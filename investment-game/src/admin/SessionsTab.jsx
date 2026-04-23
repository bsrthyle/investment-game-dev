import { useEffect, useState } from 'react';
import { db } from '../lib/db.js';

export default function SessionsTab() {
  const [sessions, setSessions] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = async () => {
    const s = await db.sessions.orderBy('createdAt').reverse().toArray();
    setSessions(s);
    setLoaded(true);
  };
  useEffect(() => { refresh(); }, []);

  const del = async (id) => {
    if (!confirm('Delete this local session? (Will not delete server copy.)')) return;
    await db.sessions.delete(id);
    refresh();
  };

  if (!loaded) return <p className="text-body text-ink/60">Loading…</p>;
  if (sessions.length === 0) return <p className="text-body text-ink/60">No sessions on this tablet yet.</p>;

  return (
    <div className="max-h-[440px] overflow-auto">
      <table className="w-full text-left text-body">
        <thead className="sticky top-0 bg-white">
          <tr className="border-b border-ink/10 text-badge uppercase tracking-wide text-ink/60">
            <th className="py-2">Participant</th>
            <th>Arm</th>
            <th>Started</th>
            <th>Screen</th>
            <th>Tokens</th>
            <th>Sync</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.id} className="border-b border-ink/5">
              <td className="py-2 font-semibold">{s.participantId}</td>
              <td className="text-badge text-ink/70">{s.arm?.id || '—'}</td>
              <td>{s.sessionStartTime ? new Date(s.sessionStartTime).toLocaleString() : '—'}</td>
              <td className="text-ink/60">{s.currentScreen}</td>
              <td>{s.totalRevenueTokens ?? '—'}</td>
              <td>
                <span className={
                  s.syncStatus === 'synced' ? 'chip chip-ok'
                  : s.syncStatus === 'failed' ? 'chip chip-warn'
                  : 'chip'
                }>{s.syncStatus}</span>
              </td>
              <td>
                <button onClick={() => del(s.id)} className="text-badge text-drought-deep">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
