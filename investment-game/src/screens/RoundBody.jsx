import { useEffect, useRef, useState } from 'react';
import { GAME, PHASES, NUM_ROUNDS, SCREENS } from '../lib/constants.js';
import { useGameStore } from '../store/gameStore.js';
import { logEvent } from '../store/eventLog.js';
import { drawCategorical, newRoundSeed } from '../lib/randomize.js';
import { computeRevenue } from '../lib/yieldModel.js';
import { t } from '../i18n/index.js';
import RiskDisplay from '../components/RiskDisplay.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

// Shared 5-phase round flow used by both Round and Practice. The caller
// supplies the rain + price probability vectors for this round; on completion
// the caller decides what to persist and where to navigate next.
export default function RoundBody({
  roundIndex,        // 0..NUM_ROUNDS-1 for real rounds; null for practice
  isPractice,
  rainProbs,
  priceProbs,
  onCommitDecision,  // async ({ fertilizerUsed, dose, ...timing }) => void
  onCommitOutcome,   // async ({ rainSeed, rainDraw, rainOutcome, priceSeed, priceDraw, priceOutcome, yield, priceLevel, savings, revenue }) => void
  onFinishRound,     // () => void — caller advances screen / round
  label,
}) {
  const participantId = useGameStore((s) => s.session?.participantId);
  const phase = useGameStore((s) => s.currentRoundPhase);
  const setPhase = useGameStore((s) => s.setPhase);
  const round = useGameStore((s) => {
    if (isPractice) return s.session?.practiceRound;
    return s.session?.rounds?.[roundIndex];
  });

  // Dose is local until the participant confirms planting. Trajectory is
  // logged as stepper events + committed as an array when the decision locks.
  const [dose, setDose] = useState(round?.dose ?? 0);
  const [confirming, setConfirming] = useState(false);
  const [showRain, setShowRain] = useState(false);
  const [showPrice, setShowPrice] = useState(false);
  const decisionStartRef = useRef(null);
  const trajectoryRef = useRef([]);

  useEffect(() => {
    logEvent(SCREENS.ROUND, 'round_enter', { roundIndex, isPractice });
    // If we're reloading into REVEAL/SUMMARY after a crash, respect what was
    // already drawn; the render paths below read from the persisted round.
    return () => logEvent(SCREENS.ROUND, 'round_exit', { roundIndex, isPractice });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- phase handlers ----------------------------------------------------

  const onStartDecision = async () => {
    decisionStartRef.current = { iso: new Date().toISOString(), perf: performance.now() };
    trajectoryRef.current = [];
    await setPhase(PHASES.DOSE);
  };

  const onDoseChange = (next) => {
    const clamped = Math.max(0, Math.min(GAME.FERTILIZER.MAX_UNITS, next));
    trajectoryRef.current.push({ t: performance.now(), value: clamped });
    setDose(clamped);
    logEvent(SCREENS.ROUND, 'dose_change', { roundIndex, dose: clamped });
  };

  const onOpenConfirm = () => setConfirming(true);
  const onCancelConfirm = () => setConfirming(false);

  const onConfirmPlant = async () => {
    setConfirming(false);
    const startedIso = decisionStartRef.current?.iso ?? new Date().toISOString();
    const startedPerf = decisionStartRef.current?.perf ?? performance.now();
    const durationMs = performance.now() - startedPerf;

    await onCommitDecision({
      fertilizerUsed: dose > 0,
      dose,
      decisionStartTime: startedIso,
      decisionEndTime: new Date().toISOString(),
      decisionDurationMs: durationMs,
      doseTrajectory: trajectoryRef.current.slice(),
    });

    // Draw rain + price now (not earlier), as per research protocol.
    const pid = participantId || 'unknown';
    const rainSeed = newRoundSeed(pid, isPractice ? 'practice' : roundIndex, 'rain');
    const priceSeed = newRoundSeed(pid, isPractice ? 'practice' : roundIndex, 'price');
    const r = drawCategorical(rainSeed, GAME.RAIN_STATES, rainProbs);
    const p = drawCategorical(priceSeed, GAME.PRICE_STATES, priceProbs);
    const rev = computeRevenue({ dose, rain: r.outcome, price: p.outcome });

    await onCommitOutcome({
      rainSeed, rainDraw: r.rawDraw, rainOutcome: r.outcome,
      priceSeed, priceDraw: p.rawDraw, priceOutcome: p.outcome,
      yield: rev.yield, baselineYield: rev.baselineYield, gain: rev.gain,
      priceLevel: rev.priceLevel, savings: rev.savings, revenue: rev.revenue,
    });

    logEvent(SCREENS.ROUND, 'plant_confirmed', {
      roundIndex, dose, rainOutcome: r.outcome, priceOutcome: p.outcome,
      yield: rev.yield, revenue: rev.revenue,
    });

    await setPhase(PHASES.REVEAL);
    setShowRain(true);
    setShowPrice(false);
  };

  // In REVEAL, show rain first then price; on Continue advance to SUMMARY.
  const onContinueReveal = async () => {
    if (!showPrice) { setShowPrice(true); return; }
    await setPhase(PHASES.SUMMARY);
  };

  const onFinish = async () => {
    // Reset phase for the next round's briefing.
    await setPhase(PHASES.BRIEFING);
    onFinishRound();
  };

  // ---- rendering ---------------------------------------------------------

  const header = (
    <div className="mb-4 flex items-baseline justify-between">
      <p className="text-badge uppercase tracking-[0.2em] text-ink/50">{label}</p>
    </div>
  );

  if (phase === PHASES.BRIEFING) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-canvas p-10">
        <div className="w-full max-w-3xl">
          {header}
          <h1 className="text-heading">{t('round.outlookTitle')}</h1>
          <p className="mt-2 text-body text-ink/60">{t('round.outlookBody')}</p>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <RiskDisplay kind="rain" probs={rainProbs} />
            <RiskDisplay kind="price" probs={priceProbs} />
          </div>
          <div className="mt-8 flex justify-end">
            <button className="btn-primary" onClick={onStartDecision}>{t('round.continue')}</button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === PHASES.DOSE) {
    const savings = GAME.TOKEN_BUDGET_PER_ROUND - dose * GAME.FERTILIZER.COST_PER_UNIT;
    return (
      <div className="flex h-full w-full flex-col bg-canvas p-10">
        <div className="mx-auto w-full max-w-4xl">
          {header}
          <h1 className="text-heading">{t('round.doseTitle')}</h1>
          <p className="mt-2 text-body text-ink/60">
            {t('round.doseBody', { budget: GAME.TOKEN_BUDGET_PER_ROUND })}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <RiskDisplay kind="rain" probs={rainProbs} />
            <RiskDisplay kind="price" probs={priceProbs} />
          </div>

          <div className="mt-8 flex items-center justify-center gap-10">
            <div className="flex flex-col items-center gap-2 rounded-2xl bg-white p-5 shadow-sm">
              <span className="text-badge uppercase text-ink/50">{t('round.tokensSaved')}</span>
              <span className="text-token-xl text-token-gold">{savings}</span>
            </div>
            <DoseStepper dose={dose} onChange={onDoseChange} />
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button className="btn-primary" onClick={onOpenConfirm}>{t('decision.plant')}</button>
          </div>
        </div>
        <ConfirmDialog open={confirming} onCancel={onCancelConfirm} onConfirm={onConfirmPlant} />
      </div>
    );
  }

  if (phase === PHASES.REVEAL) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-canvas p-10">
        {header}
        <h1 className="text-heading">{t('round.harvestTitle')}</h1>
        <div className="flex flex-col items-center gap-4">
          {showRain && (
            <RevealCard
              title={t('round.rainfall')}
              value={round?.rainOutcome ? t('weather.' + round.rainOutcome) : null}
              tone={toneForRain(round?.rainOutcome)}
            />
          )}
          {showPrice && (
            <RevealCard
              title={t('round.marketPrice')}
              value={round?.priceOutcome ? t('price.' + round.priceOutcome) : null}
              tone={toneForPrice(round?.priceOutcome)}
            />
          )}
        </div>
        <button className="btn-primary" onClick={onContinueReveal}>
          {showPrice ? t('round.seeHarvest') : t('round.revealPrice')}
        </button>
      </div>
    );
  }

  if (phase === PHASES.SUMMARY) {
    const savings = round?.savings ?? 0;
    const gainValue = (round?.gain ?? 0) * (round?.priceLevel ?? 1);
    const revenue = round?.revenue ?? 0;
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-canvas p-10">
        {header}
        <h1 className="text-heading">{t('summary.title')}</h1>
        <div className="grid max-w-2xl grid-cols-3 gap-4">
          <Stat label={t('round.tokensSaved')} value={savings} />
          <Stat label={t('round.gainValue')} value={Math.round(gainValue * 10) / 10} />
          <Stat label={t('round.total')} value={Math.round(revenue * 10) / 10} big />
        </div>
        <div className="text-badge text-ink/50">
          {t('round.summaryDetail', {
            dose: round?.dose ?? 0,
            gain: Math.round((round?.gain ?? 0) * 10) / 10,
            price: round?.priceLevel ?? 1,
          })}
        </div>
        <button className="btn-primary" onClick={onFinish}>
          {isPractice ? t('round.startReal') : roundIndex + 1 >= NUM_ROUNDS ? t('round.finishRounds') : t('round.nextSeason')}
        </button>
      </div>
    );
  }

  // Fallback — should not happen in normal flow.
  return (
    <div className="flex h-full w-full items-center justify-center bg-canvas">
      <button className="btn-primary" onClick={() => setPhase(PHASES.BRIEFING)}>{t('round.resetPhase')}</button>
    </div>
  );
}

function DoseStepper({ dose, onChange }) {
  const max = GAME.FERTILIZER.MAX_UNITS;
  const canDec = dose > 0;
  const canInc = dose < max;
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-5 shadow-sm">
      <span className="text-badge uppercase text-ink/50">{t('round.fertilizerBags')}</span>
      <div className="flex items-center gap-4">
        <button
          disabled={!canDec}
          onClick={() => onChange(dose - 1)}
          className={`h-[72px] w-[72px] rounded-xl text-token-lg font-bold text-white transition ${canDec ? 'bg-ink active:scale-95' : 'bg-ink/30'}`}
          aria-label={t('round.decrease')}
        >−</button>
        <span className="min-w-[72px] text-center text-token-xl font-bold">{dose}</span>
        <button
          disabled={!canInc}
          onClick={() => onChange(dose + 1)}
          className={`h-[72px] w-[72px] rounded-xl text-token-lg font-bold text-white transition ${canInc ? 'bg-ink active:scale-95' : 'bg-ink/30'}`}
          aria-label={t('round.increase')}
        >+</button>
      </div>
      <span className="text-badge text-ink/50">{t('round.stepperHint', { max })}</span>
    </div>
  );
}

function Stat({ label, value, big }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-white px-4 py-3 shadow-sm">
      <span className="text-badge uppercase text-ink/50">{label}</span>
      <span className={big ? 'text-token-xl text-action-green' : 'text-token-lg text-token-gold'}>{value}</span>
    </div>
  );
}

function RevealCard({ title, value, tone }) {
  if (!value) return null;
  return (
    <div className={`flex w-[520px] items-center justify-between rounded-2xl px-6 py-5 shadow-card ${tone}`}>
      <span className="text-badge uppercase tracking-wide">{title}</span>
      <span className="text-token-xl capitalize">{value}</span>
    </div>
  );
}

function toneForRain(r) {
  if (r === 'good') return 'bg-lush-green/20 text-lush-green';
  if (r === 'drought') return 'bg-drought-deep/10 text-drought-deep';
  return 'bg-rain-blue/15 text-rain-blue';
}
function toneForPrice(p) {
  if (p === 'high') return 'bg-token-gold/20 text-token-gold';
  if (p === 'low') return 'bg-drought-deep/10 text-drought-deep';
  return 'bg-rain-blue/15 text-rain-blue';
}
