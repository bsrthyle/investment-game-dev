import { useEffect } from 'react';
import { SCREENS } from '../lib/constants.js';
import { useGameStore } from '../store/gameStore.js';
import { logEvent } from '../store/eventLog.js';
import { CoinIcon } from '../components/Icons.jsx';

export default function FinalPayout() {
  const transition = useGameStore((s) => s.transition);
  const updateSession = useGameStore((s) => s.updateSession);
  const session = useGameStore((s) => s.session);

  const rounds = session?.rounds ?? [];
  const total = rounds.reduce((sum, r) => sum + (r.revenue ?? 0), 0);
  const rate = session?.currencyRate ?? 1;
  const currency = Math.round(total * rate);

  useEffect(() => {
    logEvent(SCREENS.FINAL_PAYOUT, 'screen_enter', {});
    updateSession({ totalRevenueTokens: total, totalPayoutCurrency: currency });
  }, [total, currency, updateSession]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8 bg-canvas p-10">
      <h1 className="text-heading">Your final earnings</h1>

      <div className="grid max-w-3xl grid-cols-4 gap-3">
        {rounds.map((r, i) => (
          <div key={i} className="flex flex-col items-center rounded-xl bg-white px-4 py-3 shadow-sm">
            <span className="text-badge uppercase text-ink/50">Season {i + 1}</span>
            <span className="text-token-lg text-token-gold">{Math.round(r.revenue ?? 0)}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-6">
        <Stat label="Total tokens" value={Math.round(total)} big />
        <div className="flex items-center gap-3 rounded-2xl bg-white px-8 py-4 text-token-lg shadow">
          <CoinIcon size={40} />
          <span>{currency.toLocaleString()} NGN</span>
        </div>
      </div>

      <button
        className="min-h-touch rounded-xl bg-action-green px-10 py-4 text-body text-white"
        onClick={() => transition(SCREENS.SURVEY)}
      >
        Continue
      </button>
    </div>
  );
}

function Stat({ label, value, big }) {
  return (
    <div className="flex flex-col items-center">
      <span className={`${big ? 'text-token-xl text-action-green' : 'text-token-lg text-token-gold'}`}>
        {value}
      </span>
      <span className="text-body text-ink/60">{label}</span>
    </div>
  );
}
