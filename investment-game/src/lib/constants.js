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

  // TODO calibrate — placeholder yield model.
  // yield(dose, rain) = max(FLOOR, BASE + SHOCK[rain] + MULT[rain] * (ALPHA*dose - BETA*dose^2))
  // MULT introduces an interaction: fertilizer pays off more in good rain and
  // less in drought. Without this interaction the optimal dose barely moves
  // across rainfall distributions, which defeats the experiment.
  YIELD: {
    BASE: 8,
    ALPHA: 2.2,
    BETA: 0.08,
    SHOCK: { good: 4, normal: 0, drought: -6 },
    MULT: { good: 1.2, normal: 1.0, drought: 0.3 },
    FLOOR: 0,
  },

  // TODO calibrate — placeholder price levels (tokens per unit yield).
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
