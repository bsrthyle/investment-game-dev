export const APP_VERSION = '0.2.0-fork';

// ---- Experiment design ---------------------------------------------------

export const NUM_ROUNDS = 8;

// 3 x 2 factorial between-subject design.
// display: how uncertainty about rain + price is presented to the participant.
// training: whether the participant saw a short probability-comprehension module
// before round 1.
export const DISPLAY_FORMATS = ['point', 'range', 'distribution'];
export const TRAINING_CONDITIONS = [false, true];
export const ARM_IDS = [
  'point-notrain', 'point-train',
  'range-notrain', 'range-train',
  'distribution-notrain', 'distribution-train',
];
export function armId(display, training) {
  return `${display}-${training ? 'train' : 'notrain'}`;
}

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
