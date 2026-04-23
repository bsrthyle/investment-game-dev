import { SCREENS } from '../lib/constants.js';
import { useGameStore } from '../store/gameStore.js';
import { PRACTICE_RAIN, PRACTICE_PRICE } from '../lib/schedules.js';
import RoundBody from './RoundBody.jsx';

export default function Practice() {
  const transition = useGameStore((s) => s.transition);
  const updateRound = useGameStore((s) => s.updateRound);

  return (
    <RoundBody
      roundIndex={null}
      isPractice
      rainProbs={PRACTICE_RAIN}
      priceProbs={PRACTICE_PRICE}
      onCommitDecision={(patch) => updateRound(patch, { practice: true })}
      onCommitOutcome={(patch) => updateRound(patch, { practice: true })}
      onFinishRound={() => transition(SCREENS.ROUND)}
      label="Practice season — does not count"
    />
  );
}
