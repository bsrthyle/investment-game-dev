import { NUM_ROUNDS } from '../lib/constants.js';
import { useGameStore } from '../store/gameStore.js';
import { rainProbsFor, priceProbsFor } from '../lib/schedules.js';
import RoundBody from './RoundBody.jsx';
import { t } from '../i18n/index.js';

export default function Round() {
  const roundIndex = useGameStore((s) => s.currentRoundIndex);
  const updateRound = useGameStore((s) => s.updateRound);
  const advanceRound = useGameStore((s) => s.advanceRound);

  return (
    <RoundBody
      roundIndex={roundIndex}
      isPractice={false}
      rainProbs={rainProbsFor(roundIndex)}
      priceProbs={priceProbsFor(roundIndex)}
      onCommitDecision={(patch) => updateRound(patch)}
      onCommitOutcome={(patch) => updateRound(patch)}
      onFinishRound={advanceRound}
      label={t('round.seasonLabel', { n: roundIndex + 1, total: NUM_ROUNDS })}
    />
  );
}
