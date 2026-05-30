# Data Schema & Event Logging Specification

## 1. IndexedDB Schema (Dexie.js)

```javascript
// db.js
import Dexie from 'dexie';

const db = new Dexie('InvestmentGameDB');

db.version(1).stores({
  // One row per game session
  sessions: '++id, participantId, sessionId, syncStatus, createdAt',

  // Append-only interaction event log
  events: '++id, sessionId, screenName, eventType, timestamp',

  // Imported participant list
  participants: 'participantId, treatmentGroup, country, partner',

  // Audio recording chunks (optional feature)
  audioChunks: '++id, sessionId, chunkIndex, timestamp',

  // App configuration
  config: 'key',
});
```

---

## 2. Session Record (Primary Data Object)

One record per completed game session. This is the main unit of analysis.

```typescript
interface SessionRecord {
  // Identifiers
  sessionId: string;            // UUID v4, generated at session start
  participantId: string;        // From enumerator entry or participant list
  enumeratorId: string;
  
  // Study design
  country: 'UG' | 'ZM';
  partner: 'OAF' | 'Solidaridad';
  treatmentGroup: 'control' | 'B1' | 'B2' | 'B3';
  round2Version: 'A' | 'B';    // Randomly assigned, seeded by participantId
  
  // Session metadata
  language: string;             // e.g. 'en', 'lg', 'bem'
  currencyRate: number;         // Tokens-to-local-currency conversion
  audioRecordingEnabled: boolean;
  deviceInfo: DeviceInfo;
  sessionStartTime: string;     // ISO 8601
  sessionEndTime: string;       // ISO 8601
  
  // Game data
  practiceRound: RoundData;
  round1: RoundData;
  round2: Round2Data;
  
  // Computed
  totalIncentivizedTokens: number;  // round1.totalTokens + round2.totalTokens
  totalPayoutCurrency: number;      // totalIncentivizedTokens × currencyRate
  
  // Survey
  survey: SurveyData;
  
  // Sync
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  syncAttempts: number;
  lastSyncAttempt: string | null;   // ISO 8601
  serverConfirmation: string | null; // Server-returned receipt ID
}

interface DeviceInfo {
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  batteryLevelStart: number | null;  // 0–1
  batteryLevelEnd: number | null;
  browserVersion: string;
  serviceWorkerActive: boolean;
}

interface RoundData {
  roundId: 'practice' | 'round1';
  budget: 25;                       // Always 25 for these rounds
  fertilizerPurchased: number;      // 0–10
  tokensSaved: number;
  weatherOutcome: 'good' | 'bad';
  weatherSeed: string;              // UUID used as PRNG seed
  weatherRawDraw: number;           // The actual random value (0–1)
  fertilizerHarvest: number;
  totalTokens: number;
  
  // Timing
  decisionStartTime: string;       // When decision screen rendered
  decisionEndTime: string;         // When Plant confirmed
  decisionDurationMs: number;
  summaryScreenDurationMs: number;
  weatherRevealDurationMs: number;
  
  // Interaction detail
  stepperTrajectory: StepperEvent[];
  plantButtonTaps: number;         // Including cancelled confirmations
  confirmCancellations: number;    // Times they hit Cancel on confirmation
}

interface Round2Data extends RoundData {
  roundId: 'round2';
  version: 'A' | 'B';
  effectiveBudget: number;         // 25 or 24
  
  // Video choice
  videoOffered: true;              // Always true for R2
  videoChosen: boolean;
  videoChoiceTimeMs: number;       // Time to decide learn/proceed
  videoWatchDurationMs: number | null;
  videoCompleted: boolean | null;
  videoReplays: number | null;
  
  // Version A specific
  seedsPurchased: boolean | null;   // null if version B
  insurancePurchased: boolean | null;
  seedHarvest: number | null;
  insurancePayout: number | null;
  
  // Version B specific
  bundlePurchased: boolean | null;  // null if version A
  bundleHarvest: number | null;
}

interface SurveyData {
  gender: string | null;
  ageRange: string | null;
  educationLevel: string | null;
  householdSize: number | null;
  mainCrop: string | null;
  hasPurchasedInsurance: 'yes' | 'no' | 'dontknow' | null;
  comprehension1: string | null;   // Answer to Q1
  comprehension2: string | null;   // Answer to Q2
  comprehension3: string | null;   // Answer to Q3
  comprehension1Correct: boolean;  // Computed
  comprehension2Correct: boolean;
  comprehension3Correct: boolean;
  surveyStartTime: string;
  surveyEndTime: string;
  perQuestionTimingMs: Record<string, number>; // questionId → time spent
}
```

---

## 3. Interaction Event Log

Every user action generates an event. This is the richest data source for behavioral analysis.

```typescript
interface InteractionEvent {
  id: number;                    // Auto-increment
  sessionId: string;
  timestamp: string;             // ISO 8601 with ms precision
  performanceNow: number;        // performance.now() for sub-ms precision
  screenName: string;
  eventType: string;
  payload: Record<string, any>;  // Event-specific data
}
```

### Event Types

| eventType | screenName | payload | Description |
|-----------|-----------|---------|-------------|
| `screen_enter` | any | `{}` | Screen mounted/rendered |
| `screen_exit` | any | `{ duration_ms }` | Screen unmounted |
| `audio_play` | instruction screens | `{ step_id, audio_file }` | Narration started |
| `audio_end` | instruction screens | `{ step_id, duration_ms }` | Narration finished |
| `audio_replay` | instruction screens | `{ step_id, replay_count }` | Replay button pressed |
| `next_button_tap` | instruction screens | `{ step_id, override: boolean }` | Next pressed (override=true if long-press skip) |
| `stepper_change` | decision screens | `{ input: 'fertilizer'\|'seeds'\|'insurance'\|'bundle', action: 'increment'\|'decrement', old_value, new_value, lockbox_after }` | +/– button tapped |
| `stepper_disabled_tap` | decision screens | `{ input, reason }` | Tapped a disabled +/– button (captures attempt to exceed budget) |
| `plant_tap` | decision screens | `{ fertilizer, seeds?, insurance?, bundle? }` | Plant button tapped (before confirmation) |
| `plant_confirm` | decision screens | `{ fertilizer, seeds?, insurance?, bundle?, savings }` | Confirmed planting |
| `plant_cancel` | decision screens | `{}` | Cancelled planting confirmation |
| `video_offer_tap` | video_offer | `{ choice: 'learn'\|'proceed' }` | Video offer decision |
| `video_play` | insurance_video | `{}` | Video started |
| `video_pause` | insurance_video | `{ position_ms }` | Video paused |
| `video_end` | insurance_video | `{ completed: boolean, watch_ms }` | Video ended or skipped |
| `video_replay_tap` | insurance_video | `{ replay_count }` | Replay pressed |
| `survey_answer` | survey | `{ question_id, answer, time_ms }` | Survey question answered |
| `survey_answer_change` | survey | `{ question_id, old_answer, new_answer }` | Answer changed before submitting |
| `app_background` | any | `{}` | App went to background |
| `app_foreground` | any | `{ away_duration_ms }` | App returned to foreground |
| `error` | any | `{ error_message, stack }` | Runtime error caught |

---

## 4. Stepper Trajectory Format

The stepper trajectory for each round captures the full sequence of input adjustments:

```javascript
// Example stepper trajectory for Round 2 Version A
[
  { input: 'fertilizer', action: 'increment', value: 1, timestamp: '...', lockbox: 24 },
  { input: 'fertilizer', action: 'increment', value: 2, timestamp: '...', lockbox: 23 },
  { input: 'fertilizer', action: 'increment', value: 3, timestamp: '...', lockbox: 22 },
  { input: 'seeds',      action: 'increment', value: 1, timestamp: '...', lockbox: 12 },
  { input: 'insurance',  action: 'increment', value: 1, timestamp: '...', lockbox: 10 },
  { input: 'fertilizer', action: 'decrement', value: 2, timestamp: '...', lockbox: 11 },
  { input: 'fertilizer', action: 'decrement', value: 1, timestamp: '...', lockbox: 12 },
  // Final state: fertilizer=1, seeds=1, insurance=1, savings=12
]
```

---

## 5. Audio Recording Data (Optional)

```typescript
interface AudioChunk {
  id: number;
  sessionId: string;
  chunkIndex: number;
  timestamp: string;
  blob: Blob;              // Opus/WebM audio, ~16kbps mono
  durationMs: number;      // ~60000 (1 minute per chunk)
}
```

Recording rules:
- Chunks are 60 seconds each
- Codec: Opus in WebM container (`audio/webm;codecs=opus`)
- Sample rate: 16kHz mono
- Approximate size: ~120 KB per minute
- Stored in IndexedDB as blobs
- Uploaded separately from session JSON (larger payload)

---

## 6. Data Export Formats

### 6.1 Primary Analysis Dataset (CSV/Stata)

One row per session. Columns:

```
session_id
participant_id
enumerator_id
country
partner
treatment_group
round2_version
language
currency_rate
session_start_time
session_end_time
session_duration_minutes

// Round 1
r1_fertilizer
r1_savings
r1_weather
r1_fertilizer_harvest
r1_total_tokens
r1_decision_duration_ms

// Round 2
r2_version
r2_effective_budget
r2_video_chosen
r2_video_watch_duration_ms
r2_video_completed
r2_fertilizer
r2_seeds_purchased          // null if version B
r2_insurance_purchased      // null if version B
r2_bundle_purchased         // null if version A
r2_savings
r2_weather
r2_fertilizer_harvest
r2_seed_harvest             // null if version B
r2_insurance_payout         // null if version B
r2_bundle_harvest           // null if version A
r2_total_tokens
r2_decision_duration_ms

// Totals
total_incentivized_tokens
total_payout_currency

// Survey
survey_gender
survey_age_range
survey_education
survey_household_size
survey_main_crop
survey_has_insurance
survey_comprehension1
survey_comprehension1_correct
survey_comprehension2
survey_comprehension2_correct
survey_comprehension3
survey_comprehension3_correct

// Practice round (for robustness checks)
practice_fertilizer
practice_weather
practice_total_tokens
practice_decision_duration_ms

// Behavioral metrics (computed from event log)
r1_stepper_changes_count
r1_confirm_cancellations
r2_stepper_changes_count
r2_confirm_cancellations
r2_video_choice_time_ms
instruction_total_time_ms
instruction_audio_replays_total
```

### 6.2 Interaction Event Log (Long Format CSV)

One row per event:

```
session_id
participant_id
timestamp
performance_now
screen_name
event_type
payload_json
```

### 6.3 Stepper Trajectory (Long Format CSV)

One row per stepper action:

```
session_id
participant_id
round
input_type
action
old_value
new_value
lockbox_after
timestamp
sequence_number
```

---

## 7. Data Sync Protocol

### Upload Endpoint

```
POST /api/sessions
Content-Type: application/json
Authorization: Bearer <partner_api_key>

Body: SessionRecord (JSON)

Response:
  200: { receipt_id: string, status: 'accepted' }
  400: { error: 'validation_error', details: [...] }
  409: { error: 'duplicate', existing_receipt_id: string }
  500: { error: 'server_error' }
```

### Sync Logic

```javascript
async function syncPendingSessions() {
  const pending = await db.sessions
    .where('syncStatus').equals('pending')
    .toArray();

  for (const session of pending) {
    try {
      await db.sessions.update(session.id, { syncStatus: 'syncing' });
      
      const response = await fetch(SYNC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getApiKey()}`,
        },
        body: JSON.stringify(session),
      });

      if (response.ok) {
        const { receipt_id } = await response.json();
        await db.sessions.update(session.id, {
          syncStatus: 'synced',
          serverConfirmation: receipt_id,
          lastSyncAttempt: new Date().toISOString(),
        });
      } else if (response.status === 409) {
        // Already uploaded (duplicate)
        await db.sessions.update(session.id, { syncStatus: 'synced' });
      } else {
        throw new Error(`Server returned ${response.status}`);
      }
    } catch (error) {
      await db.sessions.update(session.id, {
        syncStatus: 'failed',
        syncAttempts: (session.syncAttempts || 0) + 1,
        lastSyncAttempt: new Date().toISOString(),
      });
    }
  }
}
```

### Offline Backup Export

If sync is not possible, the admin panel can export all session data as a single JSON file downloaded to the tablet's storage. This file can then be physically transferred (USB, email, etc.) to the research team.

```javascript
async function exportAllSessions() {
  const sessions = await db.sessions.toArray();
  const events = await db.events.toArray();
  
  const exportData = {
    exportedAt: new Date().toISOString(),
    deviceInfo: getDeviceInfo(),
    sessionCount: sessions.length,
    sessions: sessions,
    events: events,
  };
  
  const blob = new Blob(
    [JSON.stringify(exportData, null, 2)],
    { type: 'application/json' }
  );
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `investment-game-export-${Date.now()}.json`;
  a.click();
}
```

---

## 8. Data Validation Rules

Before a session is marked complete, validate:

1. `participantId` is non-empty
2. `enumeratorId` is non-empty
3. `round1.fertilizerPurchased` is integer 0–10
4. `round1.tokensSaved` = 25 − round1.fertilizerPurchased
5. `round1.totalTokens` matches payout formula
6. `round2.effectiveBudget` = 25 − (1 if videoChosen else 0)
7. For Version A: if insurancePurchased, then seedsPurchased must be true
8. For Version A: fertilizerPurchased + (10 if seeds) + (2 if insurance) ≤ effectiveBudget
9. For Version B: fertilizerPurchased + (12 if bundle) ≤ effectiveBudget
10. `round2.totalTokens` matches payout formula
11. `totalIncentivizedTokens` = round1.totalTokens + round2.totalTokens
12. All survey questions have responses (warn if incomplete, but allow)
13. Weather seeds are unique across rounds
14. All timestamps are chronologically ordered
