import net from 'node:net';

export type ServiceType = 'http' | 'tcp';

export interface CheckTarget {
  type: ServiceType;
  target: string; // http: URL, tcp: host:port
  timeoutMs?: number;
}

export interface CheckResult {
  up: boolean;
  latencyMs: number;
  error?: string;
}

export function parseHostPort(target: string): { host: string; port: number } {
  const idx = target.lastIndexOf(':');
  if (idx <= 0) throw new Error('TCP target must be host:port');
  const port = Number(target.slice(idx + 1));
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Invalid port');
  }
  return { host: target.slice(0, idx), port };
}

async function checkHttp(url: string, timeoutMs: number): Promise<void> {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
}

function checkTcp(target: string, timeoutMs: number): Promise<void> {
  const { host, port } = parseHostPort(target);
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host, port });
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => {
      socket.destroy();
      resolve();
    });
    socket.once('timeout', () => {
      socket.destroy();
      reject(new Error('timeout'));
    });
    socket.once('error', (err) => {
      socket.destroy();
      reject(err);
    });
  });
}

export async function runCheck(t: CheckTarget): Promise<CheckResult> {
  const timeoutMs = t.timeoutMs ?? 5000;
  const start = performance.now();
  try {
    if (t.type === 'http') await checkHttp(t.target, timeoutMs);
    else await checkTcp(t.target, timeoutMs);
    return { up: true, latencyMs: Math.round(performance.now() - start) };
  } catch (err) {
    return {
      up: false,
      latencyMs: Math.round(performance.now() - start),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
