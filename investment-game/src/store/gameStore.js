import { create } from 'zustand';
import { SCREENS, PHASES, APP_VERSION, NUM_ROUNDS } from '../lib/constants.js';
import { db, upsertSession } from '../lib/db.js';
import { logEvent, setEventSession } from './eventLog.js';

function newSessionId() {
  return (crypto.randomUUID && crypto.randomUUID()) || `s-${Date.now()}-${Math.random()}`;
}

const blankRound = (roundIndex, isPractice = false) => ({
  roundIndex,
  isPractice,
  // Decision
  fertilizerUsed: null,    // bool — did participant apply any fertilizer?
  dose: null,              // 0..MAX_UNITS — units applied
  // Outcomes (filled in from randomize.js draws)
  rainSeed: null,
  rainDraw: null,
  rainOutcome: null,       // 'good' | 'normal' | 'drought'
  priceSeed: null,
  priceDraw: null,
  priceOutcome: null,      // 'high' | 'mid' | 'low'
  yield: null,
  revenue: null,
  // Timing / trajectory (for decision-process analysis)
  decisionStartTime: null,
  decisionEndTime: null,
  decisionDurationMs: null,
  doseTrajectory: [],
});

export const useGameStore = create((set, get) => ({
  currentScreen: SCREENS.WELCOME,
  currentRoundIndex: 0,
  currentRoundPhase: PHASES.BRIEFING,
  session: null,
  adminOpen: false,

  hydrate: async () => {
    const pending = await db.sessions.where('syncStatus').equals('pending').toArray();
    const unfinished = pending.find((r) => r.currentScreen && r.currentScreen !== SCREENS.COMPLETION);
    if (unfinished) {
      setEventSession(unfinished.sessionId);
      set({
        session: unfinished,
        currentScreen: unfinished.currentScreen,
        currentRoundIndex: unfinished.currentRoundIndex ?? 0,
        currentRoundPhase: unfinished.currentRoundPhase ?? PHASES.BRIEFING,
      });
    }
  },

  newSession: async (setup) => {
    const session = {
      sessionId: newSessionId(),
      appVersion: APP_VERSION,
      participantId: setup.participantId,
      enumeratorId: setup.enumeratorId,
      country: setup.country,
      partner: setup.partner,
      treatmentGroup: setup.treatmentGroup,
      language: setup.language || 'en',
      currencyRate: setup.currencyRate,
      audioRecordingEnabled: !!setup.audioRecordingEnabled,
      arm: setup.arm,                 // { display, training, id }
      sessionStartTime: new Date().toISOString(),
      sessionEndTime: null,
      practiceRound: blankRound(0, true),
      rounds: Array.from({ length: NUM_ROUNDS }, (_, i) => blankRound(i)),
      survey: {},
      totalRevenueTokens: null,
      totalPayoutCurrency: null,
      currentScreen: SCREENS.WELCOME,
      currentRoundIndex: 0,
      currentRoundPhase: PHASES.BRIEFING,
      syncStatus: 'pending',
      syncAttempts: 0,
      lastSyncAttempt: null,
      serverConfirmation: null,
    };
    await upsertSession(session);
    setEventSession(session.sessionId);
    set({ session, currentScreen: SCREENS.WELCOME, currentRoundIndex: 0, currentRoundPhase: PHASES.BRIEFING });
    await logEvent(SCREENS.WELCOME, 'session_start', {
      participantId: session.participantId,
      arm: session.arm?.id,
    });
    return session;
  },

  updateSession: async (patch) => {
    const current = get().session;
    if (!current) return;
    const next = { ...current, ...patch };
    await upsertSession(next);
    set({ session: next });
  },

  // Update the currently-active round (or practice round if isPractice=true).
  updateRound: async (patch, { practice = false } = {}) => {
    const current = get().session;
    if (!current) return;
    if (practice) {
      const next = { ...current, practiceRound: { ...current.practiceRound, ...patch } };
      await upsertSession(next);
      set({ session: next });
      return;
    }
    const idx = get().currentRoundIndex;
    const rounds = current.rounds.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    const next = { ...current, rounds };
    await upsertSession(next);
    set({ session: next });
  },

  transition: async (to) => {
    const { currentScreen, session, currentRoundIndex } = get();
    if (!session) {
      set({ currentScreen: to });
      return;
    }
    await logEvent(currentScreen, 'screen_transition', { from: currentScreen, to, roundIndex: currentRoundIndex });
    const next = { ...session, currentScreen: to, currentRoundIndex };
    await upsertSession(next);
    set({ currentScreen: to, session: next });
  },

  setPhase: async (phase) => {
    const { session, currentRoundPhase, currentRoundIndex, currentScreen } = get();
    if (!session) { set({ currentRoundPhase: phase }); return; }
    await logEvent(currentScreen, 'phase_transition', {
      from: currentRoundPhase, to: phase, roundIndex: currentRoundIndex,
    });
    const next = { ...session, currentRoundPhase: phase };
    await upsertSession(next);
    set({ currentRoundPhase: phase, session: next });
  },

  // Advance to the next round, or out of the round loop if finished.
  advanceRound: async () => {
    const { currentRoundIndex, session } = get();
    if (!session) return;
    const nextIndex = currentRoundIndex + 1;
    if (nextIndex < NUM_ROUNDS) {
      const next = {
        ...session,
        currentRoundIndex: nextIndex,
        currentRoundPhase: PHASES.BRIEFING,
        currentScreen: SCREENS.ROUND,
      };
      await upsertSession(next);
      set({
        currentRoundIndex: nextIndex,
        currentRoundPhase: PHASES.BRIEFING,
        currentScreen: SCREENS.ROUND,
        session: next,
      });
      await logEvent(SCREENS.ROUND, 'round_advance', { from: currentRoundIndex, to: nextIndex });
    } else {
      const next = { ...session, currentScreen: SCREENS.FINAL_PAYOUT };
      await upsertSession(next);
      set({ currentScreen: SCREENS.FINAL_PAYOUT, session: next });
      await logEvent(SCREENS.ROUND, 'rounds_complete', { total: NUM_ROUNDS });
    }
  },

  openAdmin: () => set({ adminOpen: true }),
  closeAdmin: () => set({ adminOpen: false }),
}));
