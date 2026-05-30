import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { t } from '../i18n/index.js';

function useOnline() {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return online;
}

function useBattery() {
  const [level, setLevel] = useState(null);
  useEffect(() => {
    let battery;
    let cleanup = () => {};
    (async () => {
      if (navigator.getBattery) {
        battery = await navigator.getBattery();
        const update = () => setLevel(battery.level);
        update();
        battery.addEventListener('levelchange', update);
        cleanup = () => battery.removeEventListener('levelchange', update);
      }
    })();
    return () => cleanup();
  }, []);
  return level;
}

export default function StatusBar() {
  const session = useGameStore((s) => s.session);
  const online = useOnline();
  const battery = useBattery();
  const lowBattery = battery != null && battery < 0.15;

  if (!session) return null;

  return (
    <div
      className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-4 pt-2 text-xs"
      aria-hidden="true"
    >
      <div className="pointer-events-auto flex items-center gap-2">
        <span className="chip chip-info">P#{session.participantId}</span>
        <span className="chip">E#{session.enumeratorId}</span>
      </div>
      <div className="pointer-events-auto flex items-center gap-2">
        {lowBattery && (
          <span className="chip chip-warn">
            {t('status.lowBattery', { pct: Math.round(battery * 100) })}
          </span>
        )}
        <span className={online ? 'chip chip-ok' : 'chip chip-warn'}>
          {online ? t('status.online') : t('status.offline')}
        </span>
      </div>
    </div>
  );
}
