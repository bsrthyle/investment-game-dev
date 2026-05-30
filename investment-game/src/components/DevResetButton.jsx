import { useGameStore } from '../store/gameStore.js';

export default function DevResetButton() {
  if (!import.meta.env.DEV) return null;

  const resetSession = useGameStore((s) => s.resetSession);

  const onClick = async () => {
    if (!window.confirm('Reset: discard all local inputs and return to Welcome?')) return;
    await resetSession();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title="Dev only: discard local session and return to Welcome"
      aria-label="Reset session (dev)"
      className="absolute bottom-3 right-3 z-30 rounded-full bg-red-600/90 px-3 py-2 text-xs font-semibold text-white shadow-lg hover:bg-red-700"
    >
      ↻ Reset
    </button>
  );
}
