import { GAME } from '../lib/constants.js';
import { t } from '../i18n/index.js';

// Frequency-based icon array. Given a probability vector over `states`,
// renders a GAME.ICON_ARRAY.SIZE-icon grid where each state takes a count
// proportional to its probability, summing to exactly SIZE. At SIZE 20 (each
// icon = 0.05) every scheduled 0.05-step probability is represented exactly,
// with no rounding. Research shows this representation improves probability
// comprehension (Gigerenzer, 2011; Galesic et al., 2009).
export default function IconArray({ kind, probs }) {
  const states = kind === 'rain' ? GAME.RAIN_STATES : GAME.PRICE_STATES;
  const { SIZE, COLS } = GAME.ICON_ARRAY;
  const counts = distributeN(probs, SIZE);
  const meta = META[kind];

  const cells = [];
  states.forEach((s, i) => {
    const label = t('aria.' + kind + '.' + s);
    for (let k = 0; k < counts[i]; k++) {
      cells.push({ state: s, bg: meta[s].bg, glyph: meta[s].glyph, label });
    }
  });

  return (
    <div className="flex flex-col gap-3">
      <div
        className="grid w-fit gap-1.5"
        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
      >
        {cells.map((c, idx) => (
          <div
            key={idx}
            className={`flex h-8 w-8 items-center justify-center rounded-md text-base ${c.bg}`}
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
            <span className="capitalize">{t('out.' + kind + '.' + s)}</span>
            <span className="text-ink/40">{counts[i]}/{SIZE}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// Snap probabilities to integer counts summing to exactly `n` using largest
// remainder / Hare quota. Prevents rows like [7,2,1]→[7,2,2]=11 from rounding.
export function distributeN(probs, n) {
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

// Back-compat alias (10-icon). Retained for existing callers/tests.
export const distribute10 = (probs) => distributeN(probs, 10);

const META = {
  rain: {
    good:    { bg: 'bg-lush-green/80 text-white',    glyph: '☔' },
    normal:  { bg: 'bg-rain-blue/80 text-white',     glyph: '🌦' },
    drought: { bg: 'bg-drought-deep/70 text-white',  glyph: '☀' },
  },
  price: {
    high: { bg: 'bg-token-gold/80 text-ink',     glyph: '▲' },
    mid:  { bg: 'bg-rain-blue/70 text-white',    glyph: '=' },
    low:  { bg: 'bg-drought-deep/70 text-white', glyph: '▼' },
  },
};
