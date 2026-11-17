import Fastify, { type FastifyInstance } from 'fastify';
import { z } from 'zod';
import { pool } from './db.js';
import { registry } from './metrics.js';
import { parseHostPort } from './checker.js';

const serviceSchema = z
  .object({
    name: z.string().min(1).max(100),
    type: z.enum(['http', 'tcp']),
    target: z.string().min(1).max(500),
  })
  .superRefine((v, ctx) => {
    try {
      if (v.type === 'http') {
        const u = new URL(v.target);
        if (!['http:', 'https:'].includes(u.protocol)) throw new Error('bad protocol');
      } else {
        parseHostPort(v.target);
      }
    } catch {
      ctx.addIssue({ code: 'custom', path: ['target'], message: 'Invalid target for type' });
    }
  });

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: process.env.NODE_ENV !== 'test' });

  app.get('/health', async () => ({ status: 'ok' }));

  app.get('/metrics', async (_req, reply) => {
    reply.header('content-type', registry.contentType);
    return registry.metrics();
  });

  app.get('/api/services', async () => {
    const { rows } = await pool.query('SELECT * FROM services ORDER BY name');
    return rows;
  });

  app.post('/api/services', async (req, reply) => {
    const parsed = serviceSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ errors: parsed.error.flatten() });
    const { name, type, target } = parsed.data;
    try {
      const { rows } = await pool.query(
        'INSERT INTO services (name, type, target) VALUES ($1,$2,$3) RETURNING *',
        [name, type, target],
      );
      return reply.code(201).send(rows[0]);
    } catch (err) {
      if ((err as { code?: string }).code === '23505') {
        return reply.code(409).send({ error: 'Service name already exists' });
      }
      throw err;
    }
  });

  app.delete<{ Params: { id: string } }>('/api/services/:id', async (req, reply) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return reply.code(400).send({ error: 'Invalid id' });
    const res = await pool.query('DELETE FROM services WHERE id = $1', [id]);
    return reply.code(res.rowCount ? 204 : 404).send();
  });

  app.get<{ Params: { id: string } }>('/api/services/:id/checks', async (req, reply) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return reply.code(400).send({ error: 'Invalid id' });
    const { rows } = await pool.query(
      'SELECT up, latency_ms, error, checked_at FROM checks WHERE service_id = $1 ORDER BY checked_at DESC LIMIT 100',
      [id],
    );
    return rows;
  });

  return app;
}
