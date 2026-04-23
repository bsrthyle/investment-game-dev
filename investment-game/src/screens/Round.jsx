import { NUM_ROUNDS } from '../lib/constants.js';
import { useGameStore } from '../store/gameStore.js';
import { rainProbsFor, priceProbsFor } from '../lib/schedules.js';
import RoundBody from './RoundBody.jsx';

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
      label={`Season ${roundIndex + 1} of ${NUM_ROUNDS}`}
    />
  );
}
