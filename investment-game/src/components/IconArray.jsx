import { GAME } from '../lib/constants.js';

// Frequency-based icon array. Given a probability vector over `states`,
// renders a 10-icon grid where each state takes a count proportional to its
// probability, rounded to the nearest whole icon and summing to exactly 10.
// Research shows this representation improves probability comprehension
// (Gigerenzer, 2011; Galesic et al., 2009).
export default function IconArray({ kind, probs }) {
  const states = kind === 'rain' ? GAME.RAIN_STATES : GAME.PRICE_STATES;
  const counts = distribute10(probs);
  const meta = META[kind];

  const cells = [];
  states.forEach((s, i) => {
    for (let k = 0; k < counts[i]; k++) {
      cells.push({ state: s, ...meta[s] });
    }
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="grid w-fit grid-cols-5 gap-2">
        {cells.map((c, idx) => (
          <div
            key={idx}
            className={`flex h-10 w-10 items-center justify-center rounded-md text-lg ${c.bg}`}
            aria-label={c.label}
            title={c.label}
          >
            <span>{c.glyph}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-badge text-ink/70">
        {states.map((s, i) => (
          <span key={s} className="inline-flex items-center gap-1">
            <span className={`inline-block h-3 w-3 rounded-sm ${meta[s].bg}`} />
            <span className="capitalize">{s}</span>
            <span className="text-ink/40">{counts[i]}/10</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// Snap probabilities to integer counts summing to exactly 10 using largest
// remainder / Hare quota. Prevents rows like [7,2,1]→[7,2,2]=11 from rounding.
export function distribute10(probs) {
  const n = 10;
  const scaled = probs.map((p) => p * n);
  const floors = scaled.map((x) => Math.floor(x));
  let remaining = n - floors.reduce((a, b) => a + b, 0);
  const order = scaled
    .map((x, i) => [x - Math.floor(x), i])
    .sort((a, b) => b[0] - a[0]);
  const out = floors.slice();
  for (let k = 0; k < remaining; k++) out[order[k][1]]++;
  return out;
}

const META = {
  rain: {
    good:    { bg: 'bg-lush-green/80 text-white',    glyph: '☔', label: 'good rain' },
    normal:  { bg: 'bg-rain-blue/80 text-white',     glyph: '🌦', label: 'normal rain' },
    drought: { bg: 'bg-drought-deep/70 text-white',  glyph: '☀',  label: 'drought' },
  },
  price: {
    high: { bg: 'bg-token-gold/80 text-ink',     glyph: '▲', label: 'high price' },
    mid:  { bg: 'bg-rain-blue/70 text-white',    glyph: '=', label: 'normal price' },
    low:  { bg: 'bg-drought-deep/70 text-white', glyph: '▼', label: 'low price' },
  },
};
