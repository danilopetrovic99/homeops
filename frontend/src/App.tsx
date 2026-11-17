import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { addService, deleteService, listServices, type Service } from './api';

function StatusBadge({ up }: { up: boolean | null }) {
  if (up === null) return <span className="badge pending">čeka</span>;
  return <span className={`badge ${up ? 'up' : 'down'}`}>{up ? 'UP' : 'DOWN'}</span>;
}

export function App() {
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'http' | 'tcp'>('http');
  const [target, setTarget] = useState('');

  const refresh = useCallback(async () => {
    try {
      setServices(await listServices());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Greška');
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 10_000);
    return () => clearInterval(t);
  }, [refresh]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await addService({ name, type, target });
      setName('');
      setTarget('');
      setTimeout(() => void refresh(), 1500);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška');
    }
  }

  async function onDelete(id: number) {
    await deleteService(id);
    await refresh();
  }

  const downCount = services.filter((s) => s.is_up === false).length;

  return (
    <main>
      <h1>HomeOps</h1>
      <p className="summary">
        {services.length} servisa ·{' '}
        {downCount === 0 ? 'sve radi' : `${downCount} DOWN`}
      </p>
      {error && <p className="error">{error}</p>}

      <form onSubmit={onSubmit}>
        <input placeholder="Naziv" value={name} onChange={(e) => setName(e.target.value)} required />
        <select value={type} onChange={(e) => setType(e.target.value as 'http' | 'tcp')}>
          <option value="http">HTTP</option>
          <option value="tcp">TCP</option>
        </select>
        <input
          placeholder={type === 'http' ? 'http://192.168.1.1' : '192.168.1.10:22'}
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          required
        />
        <button type="submit">Dodaj</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Naziv</th>
            <th>Tip</th>
            <th>Target</th>
            <th>Latencija</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <tr key={s.id} title={s.error ?? ''}>
              <td>
                <StatusBadge up={s.is_up} />
              </td>
              <td>{s.name}</td>
              <td>{s.type.toUpperCase()}</td>
              <td className="mono">{s.target}</td>
              <td>{s.latency_ms !== null ? `${s.latency_ms} ms` : '—'}</td>
              <td>
                <button className="link" onClick={() => void onDelete(s.id)}>
                  obriši
                </button>
              </td>
            </tr>
          ))}
          {services.length === 0 && (
            <tr>
              <td colSpan={6} className="empty">
                Nema servisa. Dodaj prvi gore.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
