import { describe, it, expect } from 'vitest';
import { buildApp } from '../src/app.js';

describe('app', () => {
  it('GET /health', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });

  it('GET /metrics exposes prometheus text', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/metrics' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('process_cpu');
  });

  it('POST /api/services validates input', async () => {
    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/services',
      payload: { name: 'x', type: 'tcp', target: 'bad' },
    });
    expect(res.statusCode).toBe(400);
  });
});
