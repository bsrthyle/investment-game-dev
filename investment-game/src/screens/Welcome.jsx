import { useEffect, useRef } from 'react';
import { SCREENS, APP_VERSION } from '../lib/constants.js';
import { useGameStore } from '../store/gameStore.js';
import { logEvent } from '../store/eventLog.js';
import { t } from '../i18n/index.js';
import { CoinIcon, PlantSeedlingIcon } from '../components/Icons.jsx';

export default function Welcome() {
  const transition = useGameStore((s) => s.transition);
  const openAdmin = useGameStore((s) => s.openAdmin);
  const screenName = SCREENS.WELCOME;
  const touchStart = useRef(null);

  useEffect(() => {
    logEvent(screenName, 'screen_enter', {});
    return () => logEvent(screenName, 'screen_exit', {});
  }, [screenName]);

  const onTouchStart = (e) => {
    if (e.touches && e.touches.length >= 4) touchStart.current = Date.now();
  };
  const onTouchEnd = () => {
    if (touchStart.current && Date.now() - touchStart.current > 400) openAdmin();
    touchStart.current = null;
  };

  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-canvas via-canvas to-rain-blue/30"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex flex-col items-center gap-8 animate-fade-up">
        <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-white shadow-card">
          <PlantSeedlingIcon size={96} color="#4CAF50" />
          <span className="absolute -right-2 -bottom-2"><CoinIcon size={56} /></span>
        </div>

        <div className="text-center">
          <p className="text-badge uppercase tracking-[0.2em] text-ink/50">CIMMYT Field Experiment Tool</p>
          <h1 className="mt-1 text-token-xl tracking-tight text-action-green">Fertilizer Investment Game</h1>
          <p className="mx-auto mt-4 max-w-2xl text-body leading-relaxed text-ink/60">{t('welcome.subtitle')}</p>
        </div>

        <button className="btn-primary px-16 py-6 text-token-lg" onClick={() => transition(SCREENS.ENUMERATOR_SETUP)}>
          {t('welcome.begin')}
        </button>
      </div>

      <span className="absolute bottom-3 left-4 text-badge text-ink/40">v{APP_VERSION}</span>
      <button
        aria-label="Admin panel"
        className="absolute right-4 top-4 h-10 w-10 rounded-full bg-ink/5 transition hover:bg-ink/10"
        onClick={openAdmin}
      />
    </div>
  );
}
