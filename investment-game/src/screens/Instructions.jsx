import { useEffect } from 'react';
import { SCREENS, GAME } from '../lib/constants.js';
import { useGameStore } from '../store/gameStore.js';
import { logEvent } from '../store/eventLog.js';
import { t } from '../i18n/index.js';
import { CoinIcon } from '../components/Icons.jsx';

// Step-1 stub. Original seeds/insurance videos have been retired with the
// fork; new narrated instructions for the fertilizer-risk-communication
// experiment are built later (they depend on the final game design).
export default function Instructions() {
  const transition = useGameStore((s) => s.transition);
  const rate = useGameStore((s) => s.session?.currencyRate ?? 5);
  const endowment = GAME.TOKEN_BUDGET_PER_ROUND;

  useEffect(() => {
    logEvent(SCREENS.INSTRUCTIONS, 'screen_enter', {});
  }, []);

  // v2: the probability-comprehension training runs for everyone (no arm), so
  // instructions always lead into TRAINING, then the practice round.
  const onNext = () => {
    transition(SCREENS.TRAINING);
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-canvas p-10">
      <p className="text-badge uppercase tracking-[0.2em] text-ink/50">{t('instructions.badge')}</p>
      <h1 className="text-heading">{t('instructions.title')}</h1>
      <p className="max-w-2xl text-center text-body text-ink/60">{t('instructions.body')}</p>

      <div className="flex max-w-2xl items-center gap-4 rounded-2xl border border-token-gold/40 bg-token-gold/10 px-6 py-4">
        <CoinIcon size={44} />
        <p className="text-body text-ink/80">
          {t('instructions.tokenValue', { rate, endowment, endowmentValue: endowment * rate })}
        </p>
      </div>

      <button className="btn-primary" onClick={onNext}>{t('instructions.next')}</button>
    </div>
  );
}
