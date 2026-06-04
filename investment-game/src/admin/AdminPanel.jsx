import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { getConfig, setConfig } from '../lib/db.js';
import SessionsTab from './SessionsTab.jsx';
import SyncTab from './SyncTab.jsx';
import DiagnosticsTab from './DiagnosticsTab.jsx';
import ExportTab from './ExportTab.jsx';

const TABS = [
  { id: 'sessions', label: 'Sessions' },
  { id: 'sync', label: 'Sync' },
  { id: 'export', label: 'Export / Import' },
  { id: 'diagnostics', label: 'Diagnostics' },
];

export default function AdminPanel() {
  const open = useGameStore((s) => s.adminOpen);
  const close = useGameStore((s) => s.closeAdmin);
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [err, setErr] = useState(null);
  const [tab, setTab] = useState('sessions');
  const [configuredPin, setConfiguredPin] = useState('CIMMYT1234');

  useEffect(() => {
    (async () => setConfiguredPin(await getConfig('admin_pin', 'CIMMYT1234')))();
  }, []);

  if (!open) return null;

  const closeAll = () => { close(); setUnlocked(false); setPin(''); setErr(null); };
  const unlock = () => {
    if (pin === configuredPin) { setUnlocked(true); setErr(null); }
    else setErr('Incorrect PIN');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
      <div className="flex h-full max-h-[720px] w-full max-w-[1100px] flex-col overflow-hidden rounded-2xl bg-white shadow-card">
        <header className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
          <div>
            <p className="text-badge uppercase tracking-[0.2em] text-ink/50">Enumerator admin</p>
            <h2 className="text-heading">Investment Game — Device</h2>
          </div>
          <button className="btn-secondary" onClick={closeAll}>Close</button>
        </header>

        {!unlocked ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <label className="text-body">Enter PIN</label>
            <input
              type="password"
              inputMode="text"
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && unlock()}
              className="w-48 rounded-lg border border-ink/15 bg-white px-4 py-3 text-center text-token-lg tracking-widest"
            />
            <button className="btn-primary" onClick={unlock}>Unlock</button>
            {err && <p className="chip chip-warn">{err}</p>}
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            <nav className="flex w-56 flex-col gap-1 border-r border-ink/10 bg-ink/2 p-3">
              {TABS.map((tb) => (
                <button
                  key={tb.id}
                  onClick={() => setTab(tb.id)}
                  className={`rounded-lg px-4 py-3 text-left text-body transition ${
                    tab === tb.id ? 'bg-white shadow-soft font-semibold' : 'text-ink/70 hover:bg-white/60'
                  }`}
                >
                  {tb.label}
                </button>
              ))}
            </nav>
            <section className="flex-1 overflow-auto p-6">
              {tab === 'sessions' && <SessionsTab />}
              {tab === 'sync' && <SyncTab />}
              {tab === 'export' && <ExportTab />}
              {tab === 'diagnostics' && <DiagnosticsTab />}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
