import { useState } from 'react';
import { exportAllJson, exportSessionsCsv, exportRoundsCsv, exportEventsCsv, exportDoseTrajectoryCsv, importParticipantsCsv } from '../lib/export.js';

export default function ExportTab() {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const wrap = (label, fn) => async () => {
    setBusy(true);
    setStatus(null);
    try {
      const n = await fn();
      setStatus(`${label}: ${n ?? ''}`);
    } catch (err) {
      setStatus(`${label} failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const onImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      const n = await importParticipantsCsv(text);
      setStatus(`Imported ${n} participants`);
    } catch (err) {
      setStatus(`Import failed: ${err.message}`);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3">
        <button className="btn-primary" disabled={busy} onClick={wrap('Full JSON export', exportAllJson)}>
          Export all (JSON)
        </button>
        <button className="btn-outline" disabled={busy} onClick={wrap('Sessions CSV (wide)', exportSessionsCsv)}>
          Sessions CSV (wide)
        </button>
        <button className="btn-outline" disabled={busy} onClick={wrap('Rounds CSV (long)', exportRoundsCsv)}>
          Rounds CSV (long)
        </button>
        <button className="btn-outline" disabled={busy} onClick={wrap('Events CSV', exportEventsCsv)}>
          Events CSV
        </button>
        <button className="btn-outline" disabled={busy} onClick={wrap('Dose trajectory CSV', exportDoseTrajectoryCsv)}>
          Dose trajectory CSV
        </button>
      </div>

      <div className="card p-4">
        <p className="text-badge uppercase tracking-wide text-ink/60">Import participants</p>
        <p className="mt-1 text-body text-ink/70">CSV must include a <code>participantId</code> column. Other columns (treatmentGroup, country, partner) are preserved if present.</p>
        <input type="file" accept=".csv,text/csv" onChange={onImport} className="mt-3 text-body" />
      </div>

      {status && <p className="chip chip-info w-fit">{status}</p>}
    </div>
  );
}
