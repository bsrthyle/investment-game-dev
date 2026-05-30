# Game Logic Specification

## 1. Core Parameters

```javascript
// constants.js
export const GAME = {
  BUDGET_PER_ROUND: 25,
  VIDEO_COST: 1,
  GOOD_RAIN_PROBABILITY: 0.80,
  BAD_RAIN_PROBABILITY: 0.20,

  FERTILIZER: {
    PRICE_PER_UNIT: 1,
    MAX_UNITS: 10,
    GOOD_RAIN_MULTIPLIER: 2,  // each unit → 2 tokens
    BAD_RAIN_MULTIPLIER: 0,   // each unit → 0 tokens
  },

  SEEDS: {
    PRICE: 10,
    MAX_UNITS: 1,             // binary: buy or don't
    GOOD_RAIN_PAYOUT: 30,
    BAD_RAIN_PAYOUT: 0,
  },

  INSURANCE: {
    PRICE: 2,
    MAX_UNITS: 1,             // binary: buy or don't
    GOOD_RAIN_PAYOUT: 0,
    BAD_RAIN_PAYOUT: 10,      // covers seed price
    REQUIRES_SEEDS: true,     // can only buy if seeds purchased
  },

  BUNDLE: {
    PRICE: 12,                // seeds (10) + insurance (2)
    MAX_UNITS: 1,
    GOOD_RAIN_PAYOUT: 30,     // same as seeds alone
    BAD_RAIN_PAYOUT: 10,      // insurance kicks in
  },
};
```

---

## 2. Round Structure

### Practice Round (non-incentivized)
- Budget: 25 tokens
- Available inputs: Fertilizer only (0–10 units)
- Weather draw: 80/20
- Purpose: Familiarize participant with UI and mechanics
- Payout: Shown but **not** counted toward final payment

### Round 1 (incentivized)
- Budget: 25 tokens
- Available inputs: Fertilizer only (0–10 units)
- Weather draw: 80/20 (independent of practice round)
- Payout: Counted toward final payment

### Round 2 — Version A: Unbundled (incentivized)
- Budget: 25 tokens (or 24 if video watched)
- Available inputs:
  - Fertilizer (0–10 units × 1 token)
  - Improved Seeds (0 or 1 × 10 tokens)
  - Insurance (0 or 1 × 2 tokens) — **only if seeds purchased**
- Video offer: Yes (costs 1 token)
- Weather draw: 80/20 (independent of Round 1)
- Payout: Counted toward final payment

### Round 2 — Version B: Bundled (incentivized)
- Budget: 25 tokens (or 24 if video watched)
- Available inputs:
  - Fertilizer (0–10 units × 1 token)
  - Seeds+Insurance Bundle (0 or 1 × 12 tokens)
- Video offer: Yes (costs 1 token)
- Weather draw: 80/20 (independent of Round 1)
- Payout: Counted toward final payment

---

## 3. Payout Formulas

### Practice Round & Round 1

```
harvest = fertilizer_units × GOOD_RAIN_MULTIPLIER   (if good rain)
harvest = fertilizer_units × BAD_RAIN_MULTIPLIER     (if bad rain, = 0)

savings = BUDGET - fertilizer_units

total_tokens = savings + harvest
```

### Round 2 — Version A (Unbundled)

```
effective_budget = BUDGET - (VIDEO_COST if video_watched else 0)

fertilizer_cost = fertilizer_units × 1
seed_cost = 10 if seeds_purchased else 0
insurance_cost = 2 if insurance_purchased else 0
total_spent = fertilizer_cost + seed_cost + insurance_cost

savings = effective_budget - total_spent

// Harvest calculation
fertilizer_harvest = fertilizer_units × (2 if good_rain else 0)
seed_harvest = (30 if good_rain else 0) if seeds_purchased else 0
insurance_payout = (0 if good_rain else 10) if insurance_purchased else 0

total_tokens = savings + fertilizer_harvest + seed_harvest + insurance_payout
```

### Round 2 — Version B (Bundled)

```
effective_budget = BUDGET - (VIDEO_COST if video_watched else 0)

fertilizer_cost = fertilizer_units × 1
bundle_cost = 12 if bundle_purchased else 0
total_spent = fertilizer_cost + bundle_cost

savings = effective_budget - total_spent

// Harvest calculation
fertilizer_harvest = fertilizer_units × (2 if good_rain else 0)
bundle_harvest = (30 if good_rain else 10) if bundle_purchased else 0
// Note: bundle gives 10 even in bad rain (the insurance component)

total_tokens = savings + fertilizer_harvest + bundle_harvest
```

### Final Payout

```
total_game_tokens = round1_total + round2_total
// (Practice round NOT included)

payment_local_currency = total_game_tokens × conversion_rate
// conversion_rate is set per country in enumerator setup
```

---

## 4. Complete Payout Truth Table

### Round 1 / Practice (Fertilizer Only)

| Fertilizer Units | Savings | Good Rain Harvest | Bad Rain Harvest | Good Rain Total | Bad Rain Total |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 0 | 25 | 0 | 0 | 25 | 25 |
| 1 | 24 | 2 | 0 | 26 | 24 |
| 2 | 23 | 4 | 0 | 27 | 23 |
| 3 | 22 | 6 | 0 | 28 | 22 |
| 4 | 21 | 8 | 0 | 29 | 21 |
| 5 | 20 | 10 | 0 | 30 | 20 |
| 6 | 19 | 12 | 0 | 31 | 19 |
| 7 | 18 | 14 | 0 | 32 | 18 |
| 8 | 17 | 16 | 0 | 33 | 17 |
| 9 | 16 | 18 | 0 | 34 | 16 |
| 10 | 15 | 20 | 0 | 35 | 15 |

### Round 2 — Version A (Unbundled), Budget = 25 (no video) or 24 (video watched)

Key scenarios (budget = 25, no video):

| Fert | Seeds | Insurance | Savings | Good Rain Total | Bad Rain Total |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 0 | No | No | 25 | 25 | 25 |
| 5 | No | No | 20 | 30 | 20 |
| 10 | No | No | 15 | 35 | 15 |
| 0 | Yes | No | 15 | 45 | 15 |
| 0 | Yes | Yes | 13 | 43 | 23 |
| 5 | Yes | No | 10 | 40 | 10 |
| 5 | Yes | Yes | 8 | 38 | 18 |
| 3 | Yes | Yes | 10 | 36 | 16 |
| 10 | Yes | No | 5 | 55 | 5 |
| 10 | Yes | Yes | 3 | 53 | 13 |

With video watched (budget = 24):

| Fert | Seeds | Insurance | Savings | Good Rain Total | Bad Rain Total |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 0 | Yes | Yes | 12 | 42 | 22 |
| 5 | Yes | Yes | 7 | 37 | 17 |
| 10 | Yes | Yes | 2 | 52 | 12 |

### Round 2 — Version B (Bundled), Budget = 25 (no video) or 24 (video watched)

Key scenarios (budget = 25, no video):

| Fert | Bundle | Savings | Good Rain Total | Bad Rain Total |
|:---:|:---:|:---:|:---:|:---:|
| 0 | No | 25 | 25 | 25 |
| 5 | No | 20 | 30 | 20 |
| 10 | No | 15 | 35 | 15 |
| 0 | Yes | 13 | 43 | 23 |
| 5 | Yes | 8 | 38 | 18 |
| 10 | Yes | 3 | 53 | 13 |

With video watched (budget = 24):

| Fert | Bundle | Savings | Good Rain Total | Bad Rain Total |
|:---:|:---:|:---:|:---:|:---:|
| 0 | Yes | 12 | 42 | 22 |
| 5 | Yes | 7 | 37 | 17 |
| 10 | Yes | 2 | 52 | 12 |

---

## 5. Budget Constraint Validation

The stepper UI must enforce these constraints in real-time:

### Practice & Round 1
```
fertilizer_units ≤ 10
fertilizer_units ≤ budget (always satisfied since budget=25, max=10)
fertilizer_units ≥ 0
```

### Round 2 — Version A
```
effective_budget = 25 - (1 if video_watched else 0)

fertilizer_cost + seed_cost + insurance_cost ≤ effective_budget

// Specific constraints:
fertilizer_units ∈ [0, 10]
seeds ∈ {0, 1}  (binary toggle or +/- that only goes to 0 or 1)
insurance ∈ {0, 1}
insurance = 0 if seeds = 0  (insurance requires seeds)

// Dynamic max fertilizer:
max_fertilizer = min(10, effective_budget - seed_cost - insurance_cost)

// If participant removes seeds, auto-remove insurance
if seeds changed from 1 → 0:
    insurance = 0
    insurance_stepper.disabled = true
```

### Round 2 — Version B
```
effective_budget = 25 - (1 if video_watched else 0)

fertilizer_cost + bundle_cost ≤ effective_budget

fertilizer_units ∈ [0, 10]
bundle ∈ {0, 1}

max_fertilizer = min(10, effective_budget - bundle_cost)

// If bundle is purchased:
//   max fertilizer = min(10, 25-12) = min(10, 13) = 10  ← no video
//   max fertilizer = min(10, 24-12) = min(10, 12) = 10  ← with video
// So fertilizer is never constrained by the bundle (budget always sufficient)
// But fertilizer IS constrained if we consider remaining tokens:
//   savings = effective_budget - fertilizer - bundle_cost
//   savings must be ≥ 0
```

---

## 6. Randomization

### Version Assignment (A vs B)

Deterministic from participant ID so restarts produce the same assignment:

```javascript
import { seedrandom } from 'seedrandom';

function assignVersion(participantId) {
  const rng = seedrandom('version-' + participantId);
  return rng() < 0.5 ? 'A' : 'B';
}
```

This ensures:
- Same participant always gets same version (idempotent)
- Roughly 50/50 split across participants
- Assignment is auditable given the participant list

### Weather Draws

Independent random draw per round. NOT deterministic from participant ID (each session produces fresh weather). However, the seed IS logged for reproducibility:

```javascript
function drawWeather(roundSeed) {
  const rng = seedrandom(roundSeed);
  const draw = rng();
  return {
    outcome: draw < 0.80 ? 'good' : 'bad',
    seed: roundSeed,
    raw_draw: draw,
  };
}

// Generate round seeds at session start
const practiceWeatherSeed = crypto.randomUUID();
const round1WeatherSeed = crypto.randomUUID();
const round2WeatherSeed = crypto.randomUUID();
```

### Important: Weather is Revealed on "Plant" Confirmation

The weather outcome is determined at the moment the participant confirms their planting decision. It is NOT pre-computed at session start. This means:
1. Participant makes input purchase decisions
2. Participant presses "Plant" button
3. Confirmation dialog appears
4. Participant confirms
5. **Now** the weather draw executes
6. Weather reveal animation plays
7. Summary screen shows results

---

## 7. Expected Value Analysis (for researcher reference)

For the researcher's benefit, here are the expected values of each strategy:

| Strategy | Expected Payout |
|----------|:-:|
| Save everything (0 fertilizer) | 25.0 |
| 10 fertilizer, no seeds | 0.8×35 + 0.2×15 = 31.0 |
| 0 fert, seeds only (no insurance) | 0.8×45 + 0.2×15 = 39.0 |
| 0 fert, seeds + insurance | 0.8×43 + 0.2×23 = 39.0 |
| 0 fert, bundle | 0.8×43 + 0.2×23 = 39.0 |
| 10 fert, seeds, no insurance | 0.8×55 + 0.2×5 = 45.0 |
| 10 fert, seeds + insurance | 0.8×53 + 0.2×13 = 45.0 |
| 10 fert, bundle | 0.8×53 + 0.2×13 = 45.0 |

Note: Insurance is actuarially fair (EV with insurance = EV without), so rational risk-neutral agents are indifferent. The experiment measures risk aversion and behavioral effects of bundling presentation.
