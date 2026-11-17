export interface Service {
  id: number;
  name: string;
  type: 'http' | 'tcp';
  target: string;
  is_up: boolean | null;
  latency_ms: number | null;
  error: string | null;
  last_checked: string | null;
}

export async function listServices(): Promise<Service[]> {
  const res = await fetch('/api/services');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function addService(body: {
  name: string;
  type: 'http' | 'tcp';
  target: string;
}): Promise<void> {
  const res = await fetch('/api/services', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.status === 409) throw new Error('Servis sa tim imenom već postoji');
  if (res.status === 400) throw new Error('Neispravan unos (proveri target)');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function deleteService(id: number): Promise<void> {
  const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}
