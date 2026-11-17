import { pool } from './db.js';
import { runCheck, type ServiceType } from './checker.js';
import { sendTelegram } from './telegram.js';
import { serviceUp, checkLatency } from './metrics.js';

interface ServiceRow {
  id: number;
  name: string;
  type: ServiceType;
  target: string;
  is_up: boolean | null;
}

export async function checkAll(): Promise<void> {
  const { rows } = await pool.query<ServiceRow>('SELECT * FROM services');
  await Promise.all(rows.map(checkOne));
}

async function checkOne(svc: ServiceRow): Promise<void> {
  const result = await runCheck({ type: svc.type, target: svc.target });
  await pool.query(
    'INSERT INTO checks (service_id, up, latency_ms, error) VALUES ($1,$2,$3,$4)',
    [svc.id, result.up, result.latencyMs, result.error ?? null],
  );
  await pool.query('UPDATE services SET is_up = $1 WHERE id = $2', [result.up, svc.id]);
  serviceUp.set({ name: svc.name }, result.up ? 1 : 0);
  checkLatency.set({ name: svc.name }, result.latencyMs);

  // alert only on state change (null = first check, no alert)
  if (svc.is_up !== null && svc.is_up !== result.up) {
    await sendTelegram(
      result.up
        ? `✅ ${svc.name} je ponovo UP (${result.latencyMs} ms)`
        : `🔴 ${svc.name} je DOWN: ${result.error ?? 'unknown'}`,
    );
  }
}

export function startScheduler(intervalMs: number): NodeJS.Timeout {
  const run = () => checkAll().catch((e) => console.error('check cycle failed', e));
  void run();
  return setInterval(run, intervalMs);
}
