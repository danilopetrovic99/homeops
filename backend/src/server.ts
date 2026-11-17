import { buildApp } from './app.js';
import { config } from './config.js';
import { migrate, pool } from './db.js';
import { startScheduler } from './scheduler.js';

const app = buildApp();

async function main() {
  await migrate();
  const timer = startScheduler(config.checkIntervalMs);
  await app.listen({ port: config.port, host: '0.0.0.0' });

  const shutdown = async () => {
    clearInterval(timer);
    await app.close();
    await pool.end();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
