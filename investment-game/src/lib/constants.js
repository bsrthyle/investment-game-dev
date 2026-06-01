export const APP_VERSION = '0.3.0-v2';

// ---- Experiment design ---------------------------------------------------

export const NUM_ROUNDS = 10;

// v2: the in-game 3×2 arm (display format × probability training) has been
// REMOVED. Game exposure itself is the treatment now, and it is assigned
// OUTSIDE the app (the parent impact evaluation — see `treatmentGroup`). Some
// farmers play the game, some never see it; everyone who DOES play sees the
// same game so the only thing the game varies is exposure, not presentation:
//   - rain/price uncertainty is always shown as the full icon-array
//     distribution (DISPLAY_FORMAT), and
//   - the probability-comprehension training runs for everyone before practice
//     (TRAINING_ENABLED).
// Both are fixed by design so that playing builds familiarity with the
// rainfall- and price-driven uncertainty farmers face.
export const DISPLAY_FORMAT = 'distribution';
export const TRAINING_ENABLED = true;

// ---- Game parameters (calibrated in step 8) ------------------------------

export const GAME = {
  TOKEN_BUDGET_PER_ROUND: 25,

  FERTILIZER: {
    COST_PER_UNIT: 1,
    MAX_UNITS: 10,
  },

  // Rainfall: discrete three-state outcome per round.
  RAIN_STATES: ['good', 'normal', 'drought'],
  // Price: discrete three-state outcome per round.
  PRICE_STATES: ['high', 'mid', 'low'],

  // Icon-array display granularity. SIZE 10 (each icon = 0.10) renders every
  // scheduled probability EXACTLY, because all schedule rows are on the 0.10
  // grid (enforced in schedules.js + tests/iconArray.test.js "renders every
  // scheduled row exactly"). The "X out of 10 seasons" training copy (i18n
  // training.* keys) depends on SIZE === 10. To change SIZE you must (a)
  // re-snap every schedule row to multiples of 1/SIZE and (b) update that copy.
  ICON_ARRAY: { SIZE: 10, COLS: 5 },

  // yield(dose, rain) = max(FLOOR, BASE + SHOCK[rain] + MULT[rain] * (ALPHA*dose - BETA*dose^2))
  //
  // Calibrated (v2) for experimental signal, not yet for agronomic realism —
  // still pending PI sign-off. MULT is the rain x dose interaction and is the
  // ONLY thing that moves the optimal dose across rain distributions (SHOCK is
  // additive in dose, so it shifts yield level/variance but not the optimum).
  // Widening the MULT spread (good 1.4 vs drought 0.15) plus a gentler response
  // curve (lower ALPHA/BETA) spreads the risk-neutral optimal dose across the
  // 2..9 range (was a flat 5..9), so a participant who reads each season's
  // briefing has a much larger, more detectable behavioural response than one
  // who plays a fixed dose. See scripts/calibration-report.mjs.
  YIELD: {
    BASE: 8,
    ALPHA: 1.58,
    BETA: 0.05,
    SHOCK: { good: 4, normal: 0, drought: -6 },
    MULT: { good: 1.4, normal: 1.0, drought: 0.15 },
    FLOOR: 0,
  },

  // Tokens per unit yield. Wider high/low spread also lets the PRICE display
  // (not just rain) shift the optimal dose; kept modest to avoid an outsized
  // risk-aversion confound. The per-session currencyRate scales tokens to NGN.
  PRICE_LEVELS: { high: 1.6, mid: 1.0, low: 0.6 },
};

// ---- Locale --------------------------------------------------------------

// Self-labelled language names shown to participants in the picker.
export const LANGUAGE_LABELS = {
  en: 'English',
  ha: 'Hausa',
};

export const COUNTRY_LANGUAGES = {
  NG: ['en', 'ha'],
};

// Default token → local currency rate per country.
// Used as EnumeratorSetup prefill; enumerator can override per session.
export const DEFAULT_CURRENCY_RATES = { NG: 10 };

// ---- Screen identifiers + flow ------------------------------------------

// Per-round sub-phases. Tracked in gameStore.currentRoundPhase so a mid-round
// reload resumes at the right sub-screen.
export const PHASES = {
  BRIEFING: 'BRIEFING',
  DOSE: 'DOSE',
  CONFIRM: 'CONFIRM',
  REVEAL: 'REVEAL',
  SUMMARY: 'SUMMARY',
};

export const SCREENS = {
  WELCOME: 'WELCOME',
  ENUMERATOR_SETUP: 'ENUMERATOR_SETUP',
  LANGUAGE_SELECT: 'LANGUAGE_SELECT',
  INSTRUCTIONS: 'INSTRUCTIONS',
  TRAINING: 'TRAINING',
  PRACTICE: 'PRACTICE',
  ROUND: 'ROUND',
  FINAL_PAYOUT: 'FINAL_PAYOUT',
  SURVEY: 'SURVEY',
  COMPLETION: 'COMPLETION',
  ADMIN: 'ADMIN',
};

// Ordered list of screens from start to finish. ROUND repeats NUM_ROUNDS
// times; gameStore.currentRoundIndex tracks which iteration we're on.
export const FLOW = [
  SCREENS.WELCOME,
  SCREENS.ENUMERATOR_SETUP,
  SCREENS.LANGUAGE_SELECT,
  SCREENS.INSTRUCTIONS,
  SCREENS.TRAINING,
  SCREENS.PRACTICE,
  SCREENS.ROUND,
  SCREENS.FINAL_PAYOUT,
  SCREENS.SURVEY,
  SCREENS.COMPLETION,
];
