import { useEffect } from 'react';
import { SCREENS } from '../lib/constants.js';
import { useGameStore } from '../store/gameStore.js';
import { logEvent } from '../store/eventLog.js';
import { t } from '../i18n/index.js';

// Step-1 stub. Original seeds/insurance videos have been retired with the
// fork; new narrated instructions for the fertilizer-risk-communication
// experiment are built later (they depend on the final game design).
export default function Instructions() {
  const transition = useGameStore((s) => s.transition);
  const arm = useGameStore((s) => s.session?.arm);

  useEffect(() => {
    logEvent(SCREENS.INSTRUCTIONS, 'screen_enter', {});
  }, []);

  const onNext = () => {
    transition(arm?.training ? SCREENS.TRAINING : SCREENS.PRACTICE);
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-canvas p-10">
      <p className="text-badge uppercase tracking-[0.2em] text-ink/50">Instructions</p>
      <h1 className="text-heading">{t('instructions.title')}</h1>
      <p className="max-w-2xl text-center text-body text-ink/60">{t('instructions.body')}</p>
      <button className="btn-primary" onClick={onNext}>{t('instructions.next')}</button>
    </div>
  );
}
