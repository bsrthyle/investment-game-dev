import { GAME } from '../lib/constants.js';
import IconArray from './IconArray.jsx';

// Renders rain-or-price uncertainty in the format dictated by the
// participant's arm (point / range / distribution). All three variants
// describe the same underlying probability vector — only the presentation
// differs. This is the between-subjects treatment.
export default function RiskDisplay({ kind, probs, arm }) {
  const title = kind === 'rain' ? 'Rainfall this season' : 'Market price this season';
  const format = arm?.display || 'distribution'; // fallback so admin previews show something
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-badge uppercase tracking-wide text-ink/50">{title}</p>
      <div className="mt-3">
        {format === 'point' && <PointFormat kind={kind} probs={probs} />}
        {format === 'range' && <RangeFormat kind={kind} probs={probs} />}
        {format === 'distribution' && <IconArray kind={kind} probs={probs} />}
      </div>
    </div>
  );
}

// POINT: show only the single most-likely outcome. No probability shown.
function PointFormat({ kind, probs }) {
  const states = kind === 'rain' ? GAME.RAIN_STATES : GAME.PRICE_STATES;
  const idx = argmax(probs);
  const state = states[idx];
  const meta = LABELS[kind][state];
  return (
    <div className="flex items-center gap-4">
      <span className={`flex h-12 w-12 items-center justify-center rounded-full text-xl ${meta.bg}`}>
        {meta.glyph}
      </span>
      <div>
        <p className="text-badge uppercase tracking-wide text-ink/50">Most likely</p>
        <p className="text-token-lg capitalize">{meta.phrase}</p>
      </div>
    </div>
  );
}

// RANGE: show the best and worst plausible outcomes, labelled "most likely"
// and "unlikely". Skips the middle outcome. No numeric probabilities.
function RangeFormat({ kind, probs }) {
  const states = kind === 'rain' ? GAME.RAIN_STATES : GAME.PRICE_STATES;
  const indexed = probs.map((p, i) => ({ p, i })).sort((a, b) => b.p - a.p);
  const mostIdx = indexed[0].i;
  const leastIdx = indexed[indexed.length - 1].i;
  const most = LABELS[kind][states[mostIdx]];
  const least = LABELS[kind][states[leastIdx]];
  return (
    <div className="flex items-center justify-between gap-3">
      <Pill label="Most likely" meta={most} tone="strong" />
      <span className="text-ink/30">…</span>
      <Pill label="Unlikely" meta={least} tone="weak" />
    </div>
  );
}

function Pill({ label, meta, tone }) {
  return (
    <div className={`flex flex-1 flex-col items-center rounded-xl border p-3 ${tone === 'strong' ? 'border-action-green/40 bg-action-green/5' : 'border-ink/15 bg-ink/5'}`}>
      <span className="text-badge uppercase tracking-wide text-ink/50">{label}</span>
      <span className="mt-1 flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-full text-base ${meta.bg}`}>
          {meta.glyph}
        </span>
        <span className="text-body capitalize">{meta.phrase}</span>
      </span>
    </div>
  );
}

function argmax(arr) {
  let best = 0;
  for (let i = 1; i < arr.length; i++) if (arr[i] > arr[best]) best = i;
  return best;
}

const LABELS = {
  rain: {
    good:    { bg: 'bg-lush-green/80 text-white',   glyph: '☔', phrase: 'good rain' },
    normal:  { bg: 'bg-rain-blue/80 text-white',    glyph: '🌦', phrase: 'normal rain' },
    drought: { bg: 'bg-drought-deep/70 text-white', glyph: '☀',  phrase: 'drought' },
  },
  price: {
    high: { bg: 'bg-token-gold/80 text-ink',     glyph: '▲', phrase: 'high price' },
    mid:  { bg: 'bg-rain-blue/70 text-white',    glyph: '=', phrase: 'normal price' },
    low:  { bg: 'bg-drought-deep/70 text-white', glyph: '▼', phrase: 'low price' },
  },
};
