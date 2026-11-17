import { describe, it, expect } from 'vitest';
import http from 'node:http';
import net from 'node:net';
import type { AddressInfo } from 'node:net';
import { parseHostPort, runCheck } from '../src/checker.js';

function listen<T extends net.Server>(server: T): Promise<number> {
  return new Promise((resolve) =>
    server.listen(0, '127.0.0.1', () => resolve((server.address() as AddressInfo).port)),
  );
}

function close(server: net.Server): Promise<void> {
  return new Promise((resolve) => server.close(() => resolve()));
}

describe('parseHostPort', () => {
  it('parses valid host:port', () => {
    expect(parseHostPort('192.168.1.1:80')).toEqual({ host: '192.168.1.1', port: 80 });
  });
  it('rejects invalid input', () => {
    expect(() => parseHostPort('nohost')).toThrow();
    expect(() => parseHostPort('host:99999')).toThrow();
  });
});

describe('runCheck', () => {
  it('reports http up', async () => {
    const server = http.createServer((_, res) => res.end('ok'));
    const port = await listen(server);
    const r = await runCheck({ type: 'http', target: `http://127.0.0.1:${port}` });
    await close(server);
    expect(r.up).toBe(true);
  });

  it('reports http down on 500', async () => {
    const server = http.createServer((_, res) => {
      res.statusCode = 500;
      res.end();
    });
    const port = await listen(server);
    const r = await runCheck({ type: 'http', target: `http://127.0.0.1:${port}` });
    await close(server);
    expect(r.up).toBe(false);
  });

  it('reports tcp up and down', async () => {
    const server = net.createServer((s) => s.end());
    const port = await listen(server);
    expect((await runCheck({ type: 'tcp', target: `127.0.0.1:${port}` })).up).toBe(true);
    await close(server);
    expect((await runCheck({ type: 'tcp', target: `127.0.0.1:${port}` })).up).toBe(false);
  });
});
