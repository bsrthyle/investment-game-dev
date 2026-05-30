import { z } from 'zod';

// One stepper trajectory entry, as written by the PWA's RoundBody on every
// dose +/- tap. .passthrough() so we accept and store unknown future fields
// without rejecting the upload.
const DoseTrajectoryEntry = z.object({
  t: z.number(),
  value: z.number().int().min(0).max(10),
}).passthrough();

const RoundData = z.object({
  roundIndex: z.number().int().min(0),
  isPractice: z.boolean().optional(),

  fertilizerUsed: z.boolean().nullable().optional(),
  dose: z.number().int().min(0).max(10).nullable().optional(),

  rainSeed: z.string().nullable().optional(),
  rainDraw: z.number().nullable().optional(),
  rainOutcome: z.enum(['good', 'normal', 'drought']).nullable().optional(),

  priceSeed: z.string().nullable().optional(),
  priceDraw: z.number().nullable().optional(),
  priceOutcome: z.enum(['high', 'mid', 'low']).nullable().optional(),

  yield: z.number().nullable().optional(),
  priceLevel: z.number().nullable().optional(),
  savings: z.number().nullable().optional(),
  revenue: z.number().nullable().optional(),

  decisionStartTime: z.union([z.string(), z.number()]).nullable().optional(),
  decisionEndTime: z.union([z.string(), z.number()]).nullable().optional(),
  decisionDurationMs: z.number().nullable().optional(),
  doseTrajectory: z.array(DoseTrajectoryEntry).optional(),
}).passthrough();

const ArmSchema = z.object({
  display: z.enum(['point', 'range', 'distribution']),
  training: z.boolean(),
  id: z.string().min(1),
}).passthrough();

const TrainingResult = z.object({
  completed: z.boolean().optional(),
  correctOnFirstTry: z.boolean().optional(),
  attempts: z.record(z.number().int().min(0)).optional(),
  finalAnswers: z.record(z.any()).optional(),
}).passthrough();

export const SessionSchema = z.object({
  sessionId: z.string().min(6),
  appVersion: z.string().optional(),
  participantId: z.string().min(1),
  enumeratorId: z.string().min(1),
  country: z.enum(['NG']),
  partner: z.string().optional(),
  // Main-study treatment label, recorded as metadata. The substantive
  // definition lives with the parent-study team.
  treatmentGroup: z.enum(['Control', 'T1', 'T2', 'T3']).optional(),
  language: z.string(),
  currencyRate: z.number(),
  audioRecordingEnabled: z.boolean().optional(),

  // v2: the in-game arm has been removed — game exposure is the treatment and
  // is assigned outside the app. `arm` is still accepted (optional) so any
  // pre-v2 session left on a tablet can still sync.
  arm: ArmSchema.optional(),
  training: TrainingResult.optional(),

  sessionStartTime: z.string(),
  sessionEndTime: z.string().nullable().optional(),

  practiceRound: RoundData.optional(),
  rounds: z.array(RoundData).optional(),

  // Final-payout aggregates (computed PWA-side).
  totalRevenueTokens: z.number().nullable().optional(),
  totalPayoutCurrency: z.number().nullable().optional(),

  survey: z.record(z.any()).optional(),
}).passthrough();

export const AudioChunkSchema = z.object({
  sessionId: z.string().min(6),
  chunkIndex: z.number().int().min(0),
  timestamp: z.string(),
  durationMs: z.number().optional(),
  encrypted: z.boolean().optional(),
});
