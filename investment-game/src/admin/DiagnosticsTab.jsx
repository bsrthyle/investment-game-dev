import { useEffect, useState } from 'react';
import { db } from '../lib/db.js';
import { APP_VERSION } from '../lib/constants.js';

export default function DiagnosticsTab() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    (async () => {
      let battery = null;
      try {
        if (navigator.getBattery) {
          const b = await navigator.getBattery();
          battery = { level: Math.round(b.level * 100), charging: b.charging };
        }
      } catch {}
      let storage = null;
      try {
        if (navigator.storage?.estimate) {
          const s = await navigator.storage.estimate();
          storage = {
            usageMb: Math.round((s.usage || 0) / (1024 * 1024)),
            quotaMb: Math.round((s.quota || 0) / (1024 * 1024)),
          };
        }
      } catch {}
      const [sessionCount, eventCount] = await Promise.all([
        db.sessions.count(), db.events.count(),
      ]);
      setInfo({
        appVersion: APP_VERSION,
        userAgent: navigator.userAgent,
        online: navigator.onLine,
        serviceWorker: !!navigator.serviceWorker?.controller,
        screen: `${window.screen.width}×${window.screen.height}`,
        viewport: `${window.innerWidth}×${window.innerHeight}`,
        appScale: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--app-scale') || '1').toFixed(3),
        dpr: window.devicePixelRatio,
        battery, storage, sessionCount, eventCount,
      });
    })();
  }, []);

  if (!info) return <p className="text-body text-ink/60">Running diagnostics…</p>;

  const Row = ({ k, v, flag }) => (
    <div className="flex items-center justify-between border-b border-ink/10 py-2 text-body">
      <span className="text-ink/70">{k}</span>
      <span className={`font-semibold ${flag ? 'text-drought-deep' : ''}`}>{v ?? '—'}</span>
    </div>
  );

  return (
    <div className="card p-4">
      <Row k="App version" v={info.appVersion} />
      <Row k="User agent" v={info.userAgent} />
      <Row k="Online" v={info.online ? 'yes' : 'no'} flag={!info.online} />
      <Row k="Service Worker" v={info.serviceWorker ? 'active' : 'inactive'} flag={!info.serviceWorker} />
      <Row k="Screen" v={`${info.screen} @ ${info.dpr}×`} />
      <Row k="Viewport (CSS px)" v={info.viewport} />
      <Row k="App scale" v={info.appScale} />
      {info.battery && <Row k="Battery" v={`${info.battery.level}% ${info.battery.charging ? '(charging)' : ''}`} flag={info.battery.level < 15 && !info.battery.charging} />}
      {info.storage && <Row k="Storage" v={`${info.storage.usageMb}/${info.storage.quotaMb} MB`} />}
      <Row k="Sessions on device" v={info.sessionCount} />
      <Row k="Events on device" v={info.eventCount} />
    </div>
  );
}
