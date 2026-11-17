import client from 'prom-client';

export const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });

export const serviceUp = new client.Gauge({
  name: 'homeops_service_up',
  help: '1 if the monitored service is up, 0 otherwise',
  labelNames: ['name'],
  registers: [registry],
});

export const checkLatency = new client.Gauge({
  name: 'homeops_service_latency_ms',
  help: 'Latency of the last check in ms',
  labelNames: ['name'],
  registers: [registry],
});
