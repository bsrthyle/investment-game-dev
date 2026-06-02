import { useGameStore } from '../store/gameStore.js';
import { SHOW_RESET_BUTTON } from '../lib/constants.js';

// On-screen reset, pinned top-center. Visibility is controlled by
// SHOW_RESET_BUTTON in constants.js (see the warning there — turn it off before
// fielding). Kept as a confirm-gated action so it isn't a one-tap session wipe.
export default function DevResetButton() {
  const resetSession = useGameStore((s) => s.resetSession);

  if (!SHOW_RESET_BUTTON) return null;

  const onClick = async () => {
    if (!window.confirm('Reset: discard all local inputs and return to Welcome?')) return;
    await resetSession();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title="Discard local session and return to Welcome"
      aria-label="Reset session"
      className="absolute left-1/2 top-2 z-30 -translate-x-1/2 rounded-full bg-red-600/90 px-3 py-2 text-xs font-semibold text-white shadow-lg hover:bg-red-700"
    >
      ↻ Reset
    </button>
  );
}
