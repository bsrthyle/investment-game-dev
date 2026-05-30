# Investment Game App — Development Strategy

## 1. Executive Summary

This document outlines the full development strategy for a **tablet-based lab-in-the-field experiment app** that tests how bundling of agricultural financial services (seeds + insurance) affects smallholder farmers' demand, information-seeking behavior, and risk-taking. The app will be deployed across **Zambia and Uganda** to approximately **3,200 participants** via partner organizations (One Acre Fund and Solidaridad).

The app must handle three game rounds (1 practice + 2 incentivized), random assignment to two treatment arms (bundled vs. unbundled), weather randomization (80/20), payout calculation, a post-game survey, and comprehensive behavioral data logging — all while functioning reliably in low-connectivity, low-resource rural environments.

---

## 2. Platform & Technology Decision

### Recommended: Progressive Web App (PWA) with Offline-First Architecture

**Why PWA over native (React Native / Flutter):**

- **Zero app-store dependency** — partners can load the app via a single URL, then it runs fully offline via a Service Worker cache. No Google Play / sideloading headaches on field tablets.
- **Cross-device compatibility** — works on any Android tablet with Chrome (the dominant OS in low-cost field tablets like Tecno, Samsung Tab A, Lenovo).
- **Simpler deployment & updates** — a single code push to a hosted URL propagates to all tablets on next sync, rather than coordinating APK installs across 50+ field teams.
- **Lower development cost** — a single HTML/JS/CSS codebase, no native build toolchains.

**Tech stack:**
- **Framework:** React (via Vite) — component-based UI maps cleanly to the game's screen-by-screen structure.
- **Styling:** Tailwind CSS — fast iteration on the visual design; responsive by default.
- **State management:** Zustand or React Context — lightweight, no Redux overhead for what is essentially a linear state machine.
- **Offline storage:** IndexedDB (via Dexie.js) — reliable structured storage for game session data, far more robust than localStorage for this volume of data.
- **Service Worker:** Workbox — handles precaching of all assets (images, audio, video) for full offline operation.
- **Data sync:** Background Sync API + a simple REST endpoint for uploading completed sessions when connectivity returns.

**Trade-off acknowledged — audio recording:** Background conversation recording (mentioned as a "perhaps" feature) requires the Web Audio API / MediaRecorder API, which *does* work in modern mobile Chrome. However, this introduces consent/privacy complexity and significant storage demands. We recommend making this a **configurable opt-in feature** rather than a default (see Section 8).

---

## 3. App Architecture

### 3.1 Core State Machine

The entire game is a **linear state machine** with the following states:

```
WELCOME → LANGUAGE_SELECT → PARTICIPANT_ID_ENTRY → ENUMERATOR_CONFIG
  → INSTRUCTIONS (multi-step, with audio)
    → PRACTICE_ROUND
      → practice_decision (fertilizer only)
      → practice_weather_reveal
      → practice_summary
    → ROUND_1
      → r1_decision (fertilizer only)
      → r1_weather_reveal
      → r1_summary
    → ROUND_2_GATE (random assignment: Version A or B)
      → r2_insurance_info_offer (pay 1 token to watch video?)
        → [optional] r2_insurance_video
      → r2_decision (Version A: fert + seed + insurance | Version B: fert + bundle)
      → r2_weather_reveal
      → r2_summary
    → FINAL_PAYOUT_SCREEN
    → SURVEY
    → COMPLETION / DATA_UPLOAD
```

Every state transition is logged with a **timestamp** (see Section 7).

### 3.2 Data Model

Each game session produces one `SessionRecord`:

```
SessionRecord {
  session_id: UUID
  participant_id: string (from partner list)
  enumerator_id: string
  partner: "OAF" | "Solidaridad"
  country: "UG" | "ZM"
  treatment_group: "control" | "B1" | "B2" | "B3"
  round2_version: "A" | "B"  (randomly assigned at session start)
  
  device_info: { model, os_version, screen_size, battery_level }
  session_start_time: ISO timestamp
  session_end_time: ISO timestamp
  
  practice_round: RoundData
  round_1: RoundData
  round_2: Round2Data
  
  survey_responses: SurveyData
  interaction_log: InteractionEvent[]
  
  audio_recording_path: string | null
  sync_status: "pending" | "synced" | "failed"
}
```

```
RoundData {
  fertilizer_purchased: 0–10
  tokens_saved: number
  weather_outcome: "good" | "bad"
  weather_seed: number  (for audit/reproducibility)
  harvest_payout: number
  total_tokens_end: number
  decision_start_time: ISO timestamp
  decision_end_time: ISO timestamp
  time_on_summary_screen_ms: number
}
```

```
Round2Data extends RoundData {
  version: "A" | "B"
  
  // Version A fields
  seeds_purchased: boolean
  insurance_purchased: boolean
  
  // Version B fields
  bundle_purchased: boolean
  
  video_offered: true  (always true in R2)
  video_chosen: boolean
  video_watch_duration_ms: number | null
  video_start_time: ISO timestamp | null
  
  insurance_payout: number
  seed_payout: number
}
```

### 3.3 Randomization Strategy

Two layers of randomization per session:

1. **Treatment assignment (Version A vs B):** Seeded PRNG using `participant_id` as seed input, ensuring the same participant always gets the same version if the session is restarted. This also enables pre-registration of the randomization schedule.

2. **Weather outcomes:** Independent random draw per round (80% good, 20% bad). Uses a separate random seed logged for reproducibility. Weather is determined **at the moment the participant presses "Plant"**, not pre-determined, to preserve the authentic reveal experience.

---

## 4. UX/UI Design Principles

### 4.1 Human-Centered Design for Low-Literacy Users

The target population includes smallholder farmers with varying literacy levels. Every design decision prioritizes:

- **Visual over textual communication.** Icons, illustrations, and color-coding carry the primary meaning. Text is supplementary and always paired with audio narration.
- **Large touch targets.** All interactive elements (buttons, +/– controls) are minimum **56×56dp** (Android accessibility guideline), ideally 72dp+ given that many participants may have limited touchscreen experience.
- **Minimal cognitive load per screen.** Each screen presents one decision or one piece of information. No scrolling — everything fits in a single viewport.
- **Irreversibility warnings.** A confirmation dialog before the "Plant" button commits the decision, as specified in the gameplay document ("do not press that button until you are sure you are finished").
- **Consistent spatial layout.** The lockbox (savings) always appears on the left, inputs in the center/right, action buttons bottom-right — matching the mockup conventions throughout.

### 4.2 Screen-by-Screen UI Mapping (from Mockups)

| Screen | Key Elements | Notes |
|--------|-------------|-------|
| **Instruction slides** | Full-screen illustrations with audio narration, "Next" button | Payout explanation graphics (pages 1–2 of mockup) |
| **Practice/R1 Decision** | Lockbox with token count (left), fertilizer bag with +/– stepper (center), plant button (bottom-right), payout reminder card (top-right) | Token count updates live as stepper changes |
| **Weather Reveal** | Full-screen: rain cloud + lush field (good) OR dry cloud + cracked earth (bad) | Brief animation/transition, ~3 seconds |
| **Round Summary** | Left column: investments made (icons + amounts), center: weather outcome, right column: harvest returns, final token count | Matches page 9 of mockup |
| **Video Offer (R2)** | Two large circular buttons: "Learn more" (blue, with ? badge, costs 1 token) vs. "Proceed to planting" (green, with arrow) | Matches page 6 of mockup |
| **R2-V1 Decision** | Lockbox + three steppers: fertilizer (1 token/unit), seeds (10 tokens), insurance (2 tokens, grayed until seeds purchased) | Matches page 7 of mockup |
| **R2-V2 Decision** | Lockbox + two steppers: fertilizer (1 token/unit), seed+insurance bundle (12 tokens) | Matches page 8 of mockup |
| **Final Payout** | Total tokens from R1 + R2, converted to local currency | Large, clear numbers |

### 4.3 Audio-First Instruction Delivery

Per the research design: "Most instructions will (ideally) be programmed as audio content within the app itself."

- All instruction screens auto-play a pre-recorded audio narration.
- Audio files are pre-loaded (cached by Service Worker) — no streaming dependency.
- A visible audio progress indicator and replay button are always available.
- The "Next" button is **disabled until audio completes** (or a manual override for enumerators via a long-press).
- Audio must be recorded in **local languages** for each deployment country (at minimum: English, Luganda, Bemba, Nyanja — to be confirmed with partners).

### 4.4 Insurance Video Content

The insurance explanation video (the one participants can pay 1 token to watch) should be:
- **Short** (60–90 seconds maximum)
- **Animated/illustrated** (not live-action) for cross-cultural clarity
- **Narrated in local language** with on-screen visual aids showing the payout scenarios
- Pre-loaded as an MP4 file cached locally

---

## 5. Low-Resource Environment Considerations

### 5.1 Offline-First Operation

The app must function with **zero connectivity** during field administration. Strategy:

- **Full asset precaching:** On first load (when connected), the Service Worker downloads and caches all HTML, JS, CSS, images, audio files, and video files. Total estimated bundle: ~50–80 MB (mostly audio/video).
- **IndexedDB for data persistence:** All game session data is stored in IndexedDB immediately on the device. Data survives browser restarts, tablet reboots, and power loss (IndexedDB is transactional).
- **Background sync:** When connectivity returns (e.g., enumerator returns to a town with cell signal), the app automatically attempts to upload completed sessions to the server. A manual "Sync Now" button is also available in the enumerator admin panel.

### 5.2 Device Constraints

Target devices are likely low-end Android tablets (1–2 GB RAM, MediaTek processors). Mitigation:

- **No heavy frameworks.** React + Tailwind compiles to a small bundle. No Three.js, no complex animations.
- **Image optimization.** All game graphics (lockbox, fertilizer bag, seed packets, insurance shield, weather scenes) should be **SVG where possible** (vector scales perfectly to any tablet size, tiny file size) or **WebP** (50–70% smaller than JPEG).
- **Lazy-load audio/video.** Instruction audio loads on-demand per screen (though cached); the insurance video loads only if the participant chooses to watch it.
- **Memory management.** Each round's state is self-contained; previous round data is written to IndexedDB and cleared from active memory.
- **Battery awareness.** The app reads `navigator.getBattery()` on session start and logs battery level. If battery is below 15%, a warning is shown to the enumerator.

### 5.3 Screen Brightness & Outdoor Use

Field administration may happen outdoors. The app should:
- Use **high-contrast colors** (the mockups already use bold yellows, greens, and blacks — good).
- Avoid subtle gradients or thin text that washes out in sunlight.
- Include an enumerator-facing "brightness reminder" on the session start screen.

---

## 6. Data Capture — Behavioral & Interaction Metrics

This is critical for the research. The app must capture far more than just the final decisions.

### 6.1 Decision-Level Data

For every round:
- Fertilizer quantity chosen (0–10)
- Seeds purchased (yes/no) — R2 only
- Insurance purchased (yes/no) — R2-V1 only
- Bundle purchased (yes/no) — R2-V2 only
- Weather outcome and random seed
- Final payout calculation

### 6.2 Interaction Timing Data

Every user action generates an `InteractionEvent`:

```
InteractionEvent {
  event_type: string     // e.g. "fertilizer_increment", "plant_button_tap", "video_start"
  timestamp: ISO string  // millisecond precision
  screen: string         // e.g. "r2_decision_v1"
  value: any             // context-dependent (e.g., new fertilizer count)
  coordinates: {x, y}   // tap location on screen (optional but useful)
}
```

Key metrics derivable from this log:

| Metric | How Captured |
|--------|-------------|
| **Decision deliberation time** | Time between screen render and "Plant" button press |
| **Stepper interaction count** | Number of +/– taps before settling on a value (captures indecision/exploration) |
| **Insurance video watch rate** | Whether video_chosen = true |
| **Insurance video engagement** | Duration watched vs. total length; did they watch to completion? |
| **Information cost sensitivity** | Whether the 1-token cost deterred watching (compare across Version A vs B) |
| **Summary screen dwell time** | How long participants study their results before proceeding |
| **Instruction audio replays** | Number of times audio replay button is pressed per instruction screen |
| **Back-button attempts** | Taps on disabled/absent back navigation (captures desire to change decisions) |

### 6.3 Stepper Trajectory Logging

Beyond just the final fertilizer amount, log the **full trajectory** of stepper changes:

```
Example: [0, +1, +1, +1, -1, +1, +1] → final value: 4
```

This reveals whether participants deliberated, started high and scaled back, or were decisive — a rich behavioral signal for risk attitude research.

### 6.4 Session Metadata

- Device model, OS version, screen dimensions
- Battery level at start and end
- Locale / language selected
- Enumerator ID
- GPS coordinates (with consent) — useful for geographic analysis
- Session interruptions (app backgrounded/foregrounded events)

---

## 7. Background Conversation Recording

### Feasibility

The `MediaRecorder` API in modern Chrome for Android supports background audio recording from the device microphone. This is technically feasible in a PWA.

### Implementation Approach

- **Opt-in per session:** Enumerator activates recording via a toggle in the admin panel at session start, after obtaining participant verbal consent.
- **Continuous low-bitrate recording:** Use Opus codec at 16kbps mono — approximately **120 KB per minute**, meaning a 20-minute session produces ~2.4 MB.
- **Chunked storage:** Audio is recorded in 60-second chunks written to IndexedDB as blobs. This prevents data loss if the session is interrupted.
- **Privacy safeguards:**
  - Recording indicator is always visible on screen (a small red dot, similar to phone call recording indicators).
  - Audio files are encrypted at rest using a session-specific key derived from the participant ID + a master research key.
  - Audio is never played back on the device; it is only accessible after upload to the research server.

### Ethical & Practical Concerns

- **IRB approval** is essential. Background recording of conversations likely requires explicit informed consent documented in the study protocol.
- **Storage pressure** on low-end devices. If 30+ sessions are conducted before sync, audio data could accumulate to 70+ MB. The app should monitor available storage and warn the enumerator.
- **Recommendation:** Treat this as a **Phase 2 feature** — launch the core game without recording, add it after field testing and IRB clearance.

---

## 8. Enumerator Admin Panel

A hidden panel (accessible via a specific gesture, e.g., four-finger tap on the title screen) provides:

- **Session configuration:** Enter participant ID, enumerator ID, select partner/country, confirm treatment group.
- **Pre-loaded participant list:** Import CSV of randomized participant assignments (IDs, treatment groups, Version A/B assignment).
- **Sync dashboard:** View pending/synced/failed sessions, trigger manual upload, export data as CSV for offline backup.
- **Language selector:** Choose instruction audio language.
- **Audio recording toggle:** Enable/disable conversation recording.
- **Device diagnostics:** Battery, storage, connectivity status.
- **Session recovery:** Resume an interrupted session from the last completed state checkpoint.

---

## 9. Localization Strategy

### Languages Required

| Country | Languages |
|---------|-----------|
| Uganda | English, Luganda (+ possibly Luo, Ateso depending on partner regions) |
| Zambia | English, Bemba, Nyanja (+ possibly Tonga) |

### Implementation

- All on-screen text is externalized into JSON locale files.
- Audio narrations are separate MP3/OGG files per language, loaded based on session language selection.
- The insurance explanation video needs separate audio tracks per language (or separate video renders).
- Currency conversion rates and labels (UGX vs. ZMW) are configurable per country in the enumerator setup.

---

## 10. Data Pipeline & Backend

### 10.1 Server Architecture (Minimal)

The backend needs to be extremely simple — a data sink, not an application server:

- **Cloud function or lightweight API** (e.g., AWS Lambda + API Gateway, or a simple Express.js server on a $5 VPS) that accepts JSON session uploads.
- **Storage:** S3 bucket (or equivalent) for raw JSON session files + audio recordings.
- **Database:** A simple PostgreSQL instance for queryable session data, populated by a processing script that reads uploaded JSON.
- **Authentication:** API key per partner organization, embedded in the app config.

### 10.2 Data Export

- Automated nightly export to CSV/Stata-ready format for researchers.
- Each session maps to one row in the main analysis dataset; interaction logs are stored as a separate long-format dataset.

---

## 11. Testing Strategy

### 11.1 Logic Testing

- **Unit tests** for payout calculation logic (all combinations of fertilizer × seeds × insurance × weather for both versions).
- **Randomization audit:** Run 10,000 simulated sessions, verify Version A/B assignment is 50/50 and weather outcomes are 80/20.
- **State machine tests:** Verify that every valid path through the game produces a complete SessionRecord with no null fields.

### 11.2 Field Simulation Testing

- **"Hallway test" with 5–10 non-technical users** operating a tablet, observing confusion points.
- **Enumerator training session** with the actual field staff, collecting feedback on the admin panel workflow.
- **Low-battery test:** Run the app on a tablet at 5% battery and verify data persistence.
- **Kill-and-resume test:** Force-close the browser mid-session and verify session recovery.

### 11.3 Pilot Deployment

- Deploy to **~50 participants** in one partner region before full rollout.
- Analyze pilot data for: completion rates, average session duration, data quality, sync reliability.
- Iterate on UX issues identified during pilot.

---

## 12. Implementation Roadmap

### Phase 1 — Core Game (Weeks 1–4)

| Week | Deliverables |
|------|-------------|
| 1 | Project scaffolding (React + Vite + Tailwind + Dexie). State machine skeleton. All game screens as static components matching mockups. |
| 2 | Interactive logic: stepper controls, budget calculations, plant button with confirmation. Weather randomization and reveal animation. Payout calculation engine. |
| 3 | Full game flow: practice → R1 → R2 (both versions). Interaction event logging. Summary screens with correct payout display. |
| 4 | Enumerator admin panel. Participant list import. Session data export. PWA Service Worker + offline caching. |

### Phase 2 — Audio/Video & Localization (Weeks 5–6)

| Week | Deliverables |
|------|-------------|
| 5 | Audio narration integration (placeholder English files initially). Insurance video player. Video choice screen with 1-token cost mechanic. |
| 6 | Localization framework. Language-specific audio file integration (as recordings become available from partners). Currency configuration. |

### Phase 3 — Survey, Sync & Polish (Weeks 7–8)

| Week | Deliverables |
|------|-------------|
| 7 | Post-game survey module (demographic questions, comprehension checks). Backend data sync endpoint. Sync dashboard in admin panel. |
| 8 | Field testing and UX polish. Session recovery. Battery/storage monitoring. Performance optimization for low-end devices. |

### Phase 4 — Pilot & Iterate (Weeks 9–10)

| Week | Deliverables |
|------|-------------|
| 9 | Pilot deployment (~50 participants). Data quality review. |
| 10 | Bug fixes and UX adjustments based on pilot feedback. Final build for full deployment. |

### Phase 5 (Optional) — Advanced Features (Post-Launch)

- Background conversation recording (pending IRB)
- GPS capture
- Real-time field dashboard for research team
- Automated payout receipt generation

---

## 13. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Tablets have outdated Chrome version | Medium | High (PWA features may not work) | Test on Chrome 70+; the core app uses only widely-supported APIs. Include browser version check on launch. |
| Participants accidentally close the browser | High | Medium (data loss) | Checkpoint state to IndexedDB after every screen transition. Session recovery on relaunch. |
| Audio doesn't play (speaker broken, volume off) | Medium | High (instructions not understood) | Visual fallback text is always present. Enumerator is present to narrate if needed. Volume check screen at session start. |
| Enumerators skip practice round to save time | Medium | Medium (comprehension issues) | Practice round is mandatory in the state machine; cannot be skipped. |
| Battery dies mid-session | Medium | Medium | IndexedDB persists across reboots. Session recovery loads last checkpoint. Warn enumerator at <15% battery. |
| Data sync fails repeatedly | Low | High | Local CSV export option as backup. Sessions are never deleted from the device until confirmed synced. |

---

## 14. Key Design Decisions Requiring Partner Input

1. **Exact token-to-currency conversion rates** for Uganda (UGX) and Zambia (ZMW).
2. **Languages required** per country — which local languages beyond English?
3. **Audio recording consent** — is this approved by the IRB? Should it be included in Phase 1?
4. **Tablet inventory** — what models/OS versions are in the field? This affects browser compatibility testing.
5. **Participant list format** — what fields are available? How are treatment group assignments communicated?
6. **Insurance video production** — who produces the video content? Is it animated or live-action? In how many languages?
7. **Connectivity expectations** — how often do enumerators have cell/WiFi access for data sync?
