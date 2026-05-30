import IconArray from './IconArray.jsx';

// Renders rain-or-price uncertainty for the season briefing.
//
// v2: there is no longer a display-format arm. Every farmer who plays sees the
// SAME representation — the full icon-array distribution — because the point of
// the game is to build familiarity with the rainfall/price uncertainty, and
// that needs the whole distribution visible. The earlier point/range formats
// (which hid part of the distribution) have been removed.
export default function RiskDisplay({ kind, probs }) {
  const title = kind === 'rain' ? 'Rainfall this season' : 'Market price this season';
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-badge uppercase tracking-wide text-ink/50">{title}</p>
      <div className="mt-3">
        <IconArray kind={kind} probs={probs} />
      </div>
    </div>
  );
}
