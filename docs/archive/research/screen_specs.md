# Screen Specifications

Every screen in the app, in order of the game flow. Each spec defines layout, interactions, transitions, data captured, and edge cases.

**Global rules for all screens:**
- Orientation: **Landscape only** (lock via manifest + CSS)
- Target viewport: **1280×800** (standard 10" Android tablet). Must also work at 1024×768.
- No scrolling. All content fits in a single viewport.
- Touch targets: minimum **56×56px**, preferred **72×72px**.
- All screens log `{ screen_name, enter_timestamp, exit_timestamp }` to the event log.

---

## 1. Welcome Screen

**Purpose:** Entry point. Access to admin panel.

**Layout:**
- Center: Project logo or title "Farming Investment Game"
- Below: Large "Start" button
- Subtle version number in bottom-left corner
- **Hidden admin access:** 4-finger tap anywhere (or a small gear icon in the top-right corner, visible but unobtrusive)

**Interactions:**
- Tap "Start" → go to Language Select
- 4-finger tap → PIN prompt → Admin Panel

**Data captured:** None

---

## 2. Language Select

**Purpose:** Choose instruction language.

**Layout:**
- Title: "Choose your language" (displayed in all available languages)
- 2–4 large buttons, one per language, each showing the language name in that language
- Flag or regional icon next to each option (optional)

**Interactions:**
- Tap a language → set locale → go to Enumerator Setup

**Data captured:** `{ language_selected: string }`

---

## 3. Enumerator Setup

**Purpose:** Enumerator enters session metadata. This screen is for the enumerator, not the participant.

**Layout:**
- Form fields (large, tablet-friendly):
  - Participant ID (text input, or dropdown from imported list)
  - Enumerator ID (text input, remembered from last session)
  - Country (UG / ZM toggle)
  - Partner (OAF / Solidaridad toggle)
  - Treatment group (Control / B1 / B2 / B3 — auto-filled if participant list is loaded)
  - Currency conversion rate (pre-filled per country, editable)
  - Audio recording toggle (on/off, default off)
- "Begin Session" button (disabled until required fields filled)

**Interactions:**
- If participant ID matches imported list, auto-fill treatment group
- "Begin Session" → create session record in IndexedDB → assign Version A/B (using participant ID seed) → go to Instructions
- Version assignment happens silently; enumerator does not see which version is assigned

**Data captured:**
```
{
  participant_id, enumerator_id, country, partner,
  treatment_group, currency_rate, audio_recording_enabled,
  round2_version (computed), device_info, session_start_time
}
```

---

## 4. Instruction Screens (Multi-Step)

**Purpose:** Explain game rules via audio narration and visual aids.

**General layout per step:**
- Full-screen illustration or diagram (occupying ~60% of screen)
- Text caption below or beside the illustration (always present as visual fallback)
- Audio progress bar at the bottom
- Replay audio button (speaker icon)
- "Next" arrow button (bottom-right), **disabled until audio finishes**
- Step indicator dots (e.g., ● ● ○ ○ ○) at the top

**Enumerator override:** Long-press "Next" for 2 seconds to skip audio wait (for cases where audio doesn't work or enumerator is narrating manually).

### Step 4a: Game Overview
- **Visual:** Farmer icon + 3 season icons (practice, round 1, round 2)
- **Audio/text:** "This is a farming game. You will make investment decisions like in real life. You will play a practice round, then 2 real rounds. Your earnings from the real rounds will be paid to you in real money."

### Step 4b: Weather Explanation
- **Visual:** Side-by-side: rain cloud with lush field (good rain, labeled "4 out of 5 seasons") vs. dry cloud with cracked earth (bad rain, labeled "1 out of 5 seasons")
- **Audio/text:** "Your harvest depends on the rains. Most seasons (4 out of 5) there will be good rains. But sometimes (1 out of 5) there are bad rains and your crop fails. You can get bad rains two seasons in a row, just like in real life."

### Step 4c: Budget Explanation
- **Visual:** Lockbox icon with "25" and token coins
- **Audio/text:** "Each round, you receive 25 tokens. Each token is worth [XX] local currency. You can use tokens to buy farming inputs. Any tokens you don't spend are saved. You get 25 new tokens each round — they don't carry over."

### Step 4d: Fertilizer — Good Rain
- **Visual:** Mockup page 1 — fertilizer bag (1 token) → rain cloud → lush field → corn + 2 tokens. Arrow labeled "2×".
- **Audio/text:** "You can buy fertilizer. Each unit costs 1 token. If the rains are good, each unit gives you 2 tokens back — double your investment! If you invest all 10 tokens, you get 20 tokens as harvest."

### Step 4e: Fertilizer — Bad Rain
- **Visual:** Mockup page 2 — fertilizer bag (1 token) → dry cloud → cracked field → 0 tokens. Arrow labeled "0×".
- **Audio/text:** "But if the rains are bad, your crops fail. You get 0 tokens back no matter how much fertilizer you bought. Any tokens you saved in the lockbox are still yours."

### Step 4f: How to Play (UI Tutorial)
- **Visual:** Annotated screenshot of the decision screen (mockup page 3), with callouts pointing to: lockbox (your savings), +/– buttons (buy fertilizer), plant button (confirm)
- **Audio/text:** "Here is how you play. Your tokens start in the lockbox. Press the + button to buy fertilizer. The lockbox updates automatically. When you're ready, press the plant button. You cannot change your mind after pressing plant."

**Data captured per step:** `{ step_id, audio_played: bool, audio_replayed: int, time_on_step_ms, next_override_used: bool }`

---

## 5. Practice Round Decision Screen

**Purpose:** Non-incentivized practice. Learn the mechanics.

**Layout:** (Matches mockup page 3)
- **Left zone:** Lockbox image with large token count below (starts at "25")
- **Center zone:** Fertilizer bag image with price badge ("1" token), +/– stepper below showing current quantity (starts at "0")
- **Right zone (top):** Payout reminder card showing mini versions of the good-rain and bad-rain diagrams (from instruction steps 4d/4e)
- **Bottom-right:** Plant button (green circle with planting icon)
- **Header text:** "Practice Round — this round is just for practice"

**Interactions:**
- Tap "+" → increment fertilizer (max 10). Lockbox count decreases by 1.
- Tap "–" → decrement fertilizer (min 0). Lockbox count increases by 1.
- "+" is disabled when fertilizer = 10 or lockbox = 15 (minimum savings enforced)
- "–" is disabled when fertilizer = 0
- Tap Plant → Confirmation dialog: "Are you sure? You cannot change your mind."
  - Confirm → execute weather draw → go to Practice Weather
  - Cancel → return to decision screen

**Data captured:**
```
{
  round: 'practice',
  fertilizer_purchased: number,
  tokens_saved: number,
  decision_start_time, decision_end_time,
  stepper_trajectory: [{action: '+'/'-', value: number, timestamp}...],
  plant_button_taps: number (including cancelled confirmations),
}
```

---

## 6. Weather Reveal Screen

**Purpose:** Show whether the rains were good or bad. Used after every round (practice, R1, R2).

**Layout:**
- **Good rain:** Full-screen animation: blue rain cloud appears, rain drops fall, lush corn field fades in below. Bright, optimistic colors. (Matches mockup page 4.)
- **Bad rain:** Full-screen animation: empty cloud appears (no rain), cracked dry earth fades in below. Muted, brown/tan palette. (Matches mockup page 5.)
- Brief pause (~3 seconds) before "Continue" button appears.
- Optional: subtle sound effect (rain sounds or wind).

**Interactions:**
- "Continue" button appears after 3-second delay → go to Round Summary

**Data captured:** `{ weather_outcome, weather_seed, weather_raw_draw, time_on_screen_ms }`

---

## 7. Round Summary Screen

**Purpose:** Show what the participant spent, what happened, and what they earned. Used after every round.

**Layout:** (Matches mockup page 9)
- **Left column ("Your Investments"):**
  - Starting budget icon + "25"
  - Arrow pointing right
  - List of inputs purchased, each with icon and amount:
    - Fertilizer icon + amount spent
    - Seeds icon + amount spent (R2 only, if applicable)
    - Insurance icon + amount spent (R2-VA only, if applicable)
    - Bundle icon + amount spent (R2-VB only, if applicable)
  - Lockbox icon + savings amount
- **Center:** Weather outcome image (good/bad rain, smaller version)
- **Right column ("Your Harvest"):**
  - Fertilizer harvest return (icon + amount)
  - Seed harvest return (icon + amount, R2 only)
  - Insurance payout (icon + amount, R2 only)
  - Or Bundle return (icon + amount, R2 only)
  - Lockbox icon + savings (same as left, carried through)
  - Arrow pointing right
  - **Total tokens earned** (large, prominent)
- **Bottom:** "Continue to Next Round" button

**For practice round:** Header says "Practice Round Results — this did not count"
**For Round 1:** Header says "Season 1 Results"
**For Round 2:** Header says "Season 2 Results"

**Interactions:**
- "Continue" → go to next screen in sequence

**Data captured:** `{ time_on_summary_ms }`

---

## 8. Round 1 Decision Screen

**Purpose:** First incentivized round. Fertilizer only.

**Layout:** Identical to Practice Round Decision Screen, except:
- Header: "Season 1 — Your decisions matter! Each token = [XX] currency"
- No "Practice" label
- The urgency/importance of the decision is highlighted visually (e.g., a subtle gold border or "REAL" badge)

**Interactions:** Same as practice round.

**Data captured:** Same as practice round, with `round: 'round1'`

---

## 9. Video Offer Screen (Round 2 Pre-Decision)

**Purpose:** Ask if participant wants to pay 1 token to learn about insurance before deciding.

**Layout:** (Matches mockup page 6)
- **Left:** Large blue circle containing an insurance/shield icon with a "?" badge. Below: token coin with "1" label, indicating the cost.
- **Right:** Large green circle containing a planting icon with an arrow, representing "proceed directly."
- **Center/top text:** "Would you like to learn more about insurance? It costs 1 token."
- The two options should be clearly distinguishable: blue = learn, green = proceed.

**Interactions:**
- Tap blue circle (learn more) → deduct 1 token from R2 budget → go to Insurance Video → then to R2 Decision
- Tap green circle (proceed) → go directly to R2 Decision with full 25 token budget

**Data captured:**
```
{
  video_chosen: boolean,
  decision_time_ms: number,  // time to make the learn/proceed choice
  tap_coordinates: {x, y},
}
```

---

## 10. Insurance Video Screen

**Purpose:** Play the insurance explanation video/animation.

**Layout:**
- Full-screen video player (or animated slideshow)
- Video progress bar at bottom
- "Done" button appears when video ends (or after minimum watch duration)
- No skip button (they paid for this; let them watch it)
- Replay button available after first watch

**Content varies by version:**

**Version A video content:**
- Improved seeds cost 10 tokens
- Good rain: seeds pay 30 tokens, insurance pays 0
- Bad rain: seeds pay 0, but insurance pays back 10 tokens (the seed cost)
- Insurance costs 2 tokens
- "Insurance is like paying for peace of mind"

**Version B video content:**
- The bundle costs 12 tokens (seeds + insurance together)
- Good rain: bundle pays 30 tokens
- Bad rain: seeds pay 0, but insurance within the bundle pays 10 tokens
- "Part of the 12-token price (2 tokens) is an insurance premium"
- "Insurance is like paying for peace of mind"

**Data captured:**
```
{
  video_start_time, video_end_time,
  video_duration_watched_ms,
  video_total_duration_ms,
  video_completed: boolean,
  video_replayed: number,  // times replay was pressed
}
```

---

## 11. Round 2 Decision Screen — Version A (Unbundled)

**Purpose:** Main treatment condition. Seeds, insurance, and fertilizer offered separately.

**Layout:** (Matches mockup page 7)
- **Far left:** Lockbox with token count (starts at 25 or 24)
- **Left-center:** Fertilizer bag, price badge "1", +/– stepper, quantity display
- **Center:** Improved seed packets (distinct visual from fertilizer — orange/yellow packets), price badge "10", +/– stepper (binary: 0 or 1)
- **Right:** Insurance shield icon, price badge "2", +/– stepper (binary: 0 or 1). **GRAYED OUT / DISABLED until seeds = 1.**
- **Top-right:** Payout reminder card (updated to show fertilizer + seed + insurance payoffs)
- **Bottom-right:** Plant button

**Interactions:**
- Fertilizer +/–: same as before, range 0–10
- Seeds +: sets seeds to 1 (costs 10), enables insurance stepper
- Seeds –: sets seeds to 0, **also sets insurance to 0**, disables insurance stepper
- Insurance +: sets insurance to 1 (costs 2). Only enabled if seeds = 1.
- Insurance –: sets insurance to 0
- All changes update lockbox count in real-time
- Lockbox count = effective_budget − fertilizer − (10 if seeds) − (2 if insurance)
- "+buttons disabled if purchasing would make lockbox < 0
- Plant → confirmation → weather draw → weather reveal → summary

**Budget constraint enforcement:**
```
max_fertilizer = min(10, effective_budget - seed_cost - insurance_cost)
// When seeds+insurance are bought: max_fert = min(10, 25-10-2) = 10 (no video) or min(10, 24-10-2) = 10 (video)
// But if fert is already at e.g. 13 when seeds are added, clamp fert down
// Actually max fert can only be 10, so check:
// Can seeds be added? Only if effective_budget - fertilizer_cost - 10 ≥ 0
// Can insurance be added? Only if effective_budget - fertilizer_cost - seed_cost - 2 ≥ 0
```

**Disable logic:**
- Seeds "+" disabled if: `effective_budget - fertilizer - 10 < 0`
- Insurance "+" disabled if: `seeds = 0` OR `effective_budget - fertilizer - 10 - 2 < 0`
- Fertilizer "+" disabled if: `fertilizer = 10` OR `effective_budget - fertilizer - 1 - seed_cost - insurance_cost < 0`

**Data captured:**
```
{
  round: 'round2',
  version: 'A',
  effective_budget: number,
  fertilizer_purchased: number,
  seeds_purchased: boolean,
  insurance_purchased: boolean,
  tokens_saved: number,
  decision_start_time, decision_end_time,
  stepper_trajectory: [{input: 'fertilizer'|'seeds'|'insurance', action, value, timestamp}...],
  plant_button_taps: number,
}
```

---

## 12. Round 2 Decision Screen — Version B (Bundled)

**Purpose:** Bundled treatment. Seeds and insurance offered as a single product.

**Layout:** (Matches mockup page 8)
- **Far left:** Lockbox with token count (starts at 25 or 24)
- **Left-center:** Fertilizer bag, price badge "1", +/– stepper
- **Right-center:** Seed packets with small insurance shield overlay/badge (visually communicating "seeds with insurance included"), price badge "12", +/– stepper (binary: 0 or 1)
- **Top-right:** Payout reminder card (shows fertilizer + bundle payoffs)
- **Bottom-right:** Plant button

**Interactions:**
- Fertilizer: same as before
- Bundle +: sets bundle to 1 (costs 12)
- Bundle –: sets bundle to 0
- Lockbox = effective_budget − fertilizer − (12 if bundle)
- Plant → confirmation → weather draw → reveal → summary

**Disable logic:**
- Bundle "+" disabled if: `effective_budget - fertilizer - 12 < 0`
- Fertilizer "+" disabled if: `fertilizer = 10` OR `effective_budget - fertilizer - 1 - bundle_cost < 0`

**Data captured:**
```
{
  round: 'round2',
  version: 'B',
  effective_budget: number,
  fertilizer_purchased: number,
  bundle_purchased: boolean,
  tokens_saved: number,
  decision_start_time, decision_end_time,
  stepper_trajectory: [{input: 'fertilizer'|'bundle', action, value, timestamp}...],
  plant_button_taps: number,
}
```

---

## 13. Final Payout Screen

**Purpose:** Show total earnings across both incentivized rounds.

**Layout:**
- Header: "Congratulations! Here are your total earnings."
- **Row 1:** "Season 1: [X] tokens"
- **Row 2:** "Season 2: [Y] tokens"
- **Divider line**
- **Total:** "[X+Y] tokens = [amount] [currency]" (large, bold)
- "Continue to Survey" button

**Interactions:**
- "Continue" → go to Survey

**Data captured:** `{ total_tokens, total_currency, time_on_screen_ms }`

---

## 14. Survey Screen

**Purpose:** Post-game demographic and comprehension questions.

**Layout:**
- One question per sub-screen (avoid scroll)
- Large touch-friendly answer options (radio buttons or dropdowns rendered as large tiles)
- Progress indicator (question X of Y)
- "Next" button per question

**Questions (configurable, suggested set):**

1. **Gender** — Male / Female / Other/Prefer not to say
2. **Age** — Number input (or age range tiles: 18–25, 26–35, 36–45, 46–55, 56+)
3. **Education level** — None / Primary / Secondary / Tertiary
4. **Household size** — Number input
5. **Main crop** — Maize / Beans / Other (text)
6. **Have you ever purchased crop insurance?** — Yes / No / Don't know
7. **Comprehension Q1:** "In the game, if you bought fertilizer and there was bad rain, what happened?" — You got double / You got nothing back / You got your money back
8. **Comprehension Q2:** "What did the insurance do?" — Paid you if rain was good / Paid you back the seed cost if rain was bad / Made your fertilizer worth more / I don't know
9. **Comprehension Q3:** "How likely were bad rains in the game?" — 1 in 2 / 1 in 5 / 1 in 10 / I don't know

**Data captured:** All responses with timestamps per question.

---

## 15. Completion Screen

**Purpose:** End of session. Prompt for payout.

**Layout:**
- "Thank you for participating!"
- Final payout amount displayed again (large)
- "The enumerator will now pay you [amount] [currency]."
- "Start New Session" button (returns to Welcome)
- Data sync status indicator (if connected: "Data uploaded ✓"; if offline: "Data saved, will upload when connected")

**Interactions:**
- "Start New Session" → clear active session state → go to Welcome
- Session data remains in IndexedDB regardless

**Data captured:** `{ session_end_time, sync_status }`

---

## 16. Admin Panel

**Purpose:** Enumerator management interface. Not part of the game flow.

**Access:** 4-finger tap on Welcome screen → PIN entry (default: 1234)

**Tabs/sections:**

### Session Management
- List of all sessions on this device: participant ID, status (complete/incomplete), sync status
- Resume incomplete session
- Delete session (with confirmation + reason — data is soft-deleted, not purged)

### Participant List
- Import CSV button (select from device files)
- CSV format: `participant_id, treatment_group, [optional fields]`
- Search/filter participants
- Shows which participants have completed sessions

### Data Sync
- Sync status: X sessions pending, Y synced, Z failed
- "Sync Now" button (attempts upload of all pending sessions)
- "Export All as JSON" button (saves to device downloads folder as backup)
- Server URL configuration

### Settings
- PIN change
- Language default
- Country/partner defaults
- Currency conversion rate
- Audio recording default
- Clear all cached data (nuclear option, requires double confirmation)

### Device Diagnostics
- Battery level
- Available storage
- Browser version
- Screen dimensions
- Network status
