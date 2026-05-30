# Claude Design Brief — Investment Game App

Use this document as context when creating a new project in Claude Design. Paste it into the chat or attach it as a reference file when starting the project.

---

## What You're Designing

A **tablet-based farming investment game** used for academic research in rural Zambia and Uganda. Approximately 3,200 smallholder farmers will play this game on Android tablets administered by field enumerators. The game tests how bundling agricultural products (seeds + insurance) affects purchasing behavior.

**This is not a consumer app.** It is a research instrument that must be:
- Immediately understandable to participants with limited literacy and no prior tablet experience
- Reliable in outdoor, bright-sunlight conditions
- Visually engaging enough to hold attention through a 15–20 minute session

---

## Design Constraints

- **Orientation:** Landscape only (tablets will be held horizontally)
- **Target resolution:** 1280×800px (10" Android tablet)
- **No scrolling** on any game screen — everything must fit in a single viewport
- **Touch targets:** Minimum 72px for primary buttons, 56px for secondary
- **Font:** Noto Sans (pre-installed on Android — no web font loading)
- **No dark mode** — always light backgrounds for outdoor readability
- **High contrast:** 4.5:1 minimum contrast ratio for all text. Bold colors, no subtle pastels.
- **Icons carry meaning:** Assume participant may not read. Every interactive element must be understandable from its icon alone.

---

## Visual Identity

**Aesthetic direction:** Warm, approachable, agricultural. Think of a well-designed educational game, not a banking app. The tone should feel encouraging and non-intimidating.

**Color palette:**
- Gold (#F5A623) — tokens/money
- Green (#4CAF50) — actions, positive outcomes
- Blue (#1565C0) — information, learning
- Brown (#8D6E63) — earth, farming
- White backgrounds with bold colored elements
- Weather states: blue rain (#90CAF9) for good, tan/brown (#D7CCC8, #A1887F) for drought

**Iconography style:** Friendly, slightly illustrated (not flat/minimal, not photo-realistic). Similar to the style in the reference mockup images. Think emoji-meets-illustration: a fertilizer bag should look like a recognizable green bag with a plant logo, a coin should be unmistakably golden and round.

---

## Screens to Design (in order)

### 1. Welcome Screen
- Large friendly title: "Farming Investment Game"
- Big green "Start" button
- Small gear icon in corner for admin access
- Keep it simple — this is the first thing a nervous participant sees

### 2. Language Selection
- 2–4 large language option buttons
- Each shows the language name in that language
- Clean, symmetrical layout

### 3. Enumerator Setup (not shown to participants)
- Form with: Participant ID, Enumerator ID, Country (UG/ZM), Partner (OAF/Solidaridad), Treatment Group
- Can look more "administrative" — this screen is for trained field staff
- "Begin Session" button at bottom

### 4. Instruction Screens (6 steps)
- Full-screen illustrated cards, one concept per card
- Audio player bar at the bottom (play/pause, progress, replay)
- "Next" arrow button (bottom-right)
- Step indicator dots at top
- Specific content per step:
  - **4a:** Game overview (3 rounds, real money payouts)
  - **4b:** Weather explanation (good rain 4/5 vs bad rain 1/5, side-by-side illustration)
  - **4c:** Budget (lockbox with 25 tokens)
  - **4d:** Fertilizer good rain payoff (1 token in → rain → 2 tokens out, "2×" multiplier)
  - **4e:** Fertilizer bad rain payoff (1 token in → drought → 0 tokens out, "0×")
  - **4f:** UI tutorial (annotated screenshot of the decision screen)

### 5. Decision Screen — Practice & Round 1 (fertilizer only)
**This is the most important screen. Get this right first.**

Layout (left to right):
- **Lockbox** (left): Black metal lockbox image, gold token coin, large number "25" below
- **Fertilizer** (center): Green fertilizer bag image, gold price badge showing "1", stepper controls: [–] 0 [+]
- **Payout reminder** (top-right): Small card showing the 2× good rain and 0× bad rain diagrams
- **Plant button** (bottom-right): Large green circle with planting/seeding icon

Key behaviors:
- When "+" is tapped, fertilizer count goes up, lockbox count goes down (live update)
- "+" disabled when fertilizer = 10
- Numbers update instantly with a subtle scale animation

### 6. Weather Reveal Screen
Two variants:
- **Good rain:** Blue rain cloud with droplets, lush green cornfield below. Warm, positive feeling.
- **Bad rain:** Empty cloud outline (no rain), cracked brown earth with wilted yellow crops. Somber but not scary.
- "Continue" button appears after 3 seconds

### 7. Round Summary Screen
Shows what happened in the round:
- Left column: starting budget (25 tokens) → list of purchases (icons + amounts) → savings (lockbox + amount)
- Center: weather outcome (small image)
- Right column: harvest returns per input (icons + amounts) → total tokens earned (large, prominent)
- "Continue" button at bottom

### 8. Video Offer Screen (Round 2 pre-decision)
Two large circular options, side by side:
- **Left (blue circle):** Insurance shield icon with "?" badge. Gold token "1" below (cost). Means "Learn more about insurance"
- **Right (green circle):** Planting icon with arrow. Means "Proceed to planting directly"
- Clear visual distinction between the two choices

### 9. Decision Screen — Round 2, Version A (Unbundled)
Same layout as screen 5, but with more inputs:
- Lockbox (left): token count
- Fertilizer (left-center): bag icon, price "1", stepper [0–10]
- Improved Seeds (center): orange seed packets, price "10", stepper [0–1]
- Insurance (right-center): shield icon, price "2", stepper [0–1], **grayed out until seeds are purchased**
- Payout reminder (top-right): updated with all input payoffs
- Plant button (bottom-right)

**Critical interaction:** Insurance stepper is visually disabled (gray, low opacity) when seeds = 0. It becomes active (full color) when seeds = 1.

### 10. Decision Screen — Round 2, Version B (Bundled)
- Lockbox (left)
- Fertilizer (left-center): same as above
- Seeds+Insurance Bundle (right-center): orange seed packets with small insurance shield badge overlaid, price "12", stepper [0–1]
- Payout reminder (top-right)
- Plant button (bottom-right)

**Only two inputs** (fertilizer and bundle), making this visually simpler than Version A. This is intentional — the research question is whether simplifying the presentation changes behavior.

### 11. Final Payout Screen
- "Congratulations!" header
- Season 1 tokens: [X]
- Season 2 tokens: [Y]
- Divider
- Total: [X+Y] tokens = [amount] [currency] (large and celebratory)
- "Continue" button

### 12. Survey Screens
- One question per screen
- Large tap-friendly answer buttons (not tiny radio buttons)
- Progress dots at top
- "Next" button

### 13. Completion Screen
- "Thank you!" message
- Final payout amount
- "The enumerator will now pay you"
- "Start New Session" button

---

## Reference Material

Attach the following files to your Claude Design project for visual reference:
- `Bundle_Game_Graphics_Mockup.pdf` — Original 9-page mockup showing screen layouts, icons, and visual style
- `docs/design_system.md` — Full color palette, typography, component specs
- `docs/screen_specs.md` — Detailed behavior specs for every screen

The mockup PDF is the primary visual reference. The app should closely follow its visual language (gold tokens, green fertilizer bags, orange seed packets, black lockbox, blue/green circular choice buttons) while polishing the execution into a production-quality interface.

---

## Design Deliverables

Create the following in Claude Design:

1. **Complete screen flow** — all 13+ screens in sequence, showing the full user journey
2. **Decision screen variants** — Version A (unbundled) and Version B (bundled) side by side for comparison
3. **Interactive prototype** — at minimum, make the decision screen steppers functional (tap +/– to see lockbox update)
4. **Component library** — reusable components: Lockbox, TokenStepper, PlantButton, PayoutReminder, AudioPlayer, ConfirmDialog, WeatherReveal
5. **Weather reveal animations** — both good rain and bad rain variants

---

## Handoff to Claude Code

When designs are finalized, use Claude Design's "Export → Handoff to Claude Code" feature. The codebase already has:
- React + Vite + Tailwind project structure
- Zustand state management
- Dexie.js for IndexedDB
- Full game logic and data schema

Claude Code will use the `CLAUDE.md` file and `docs/` folder for implementation context. The design export provides the visual reference and component structure that Claude Code will implement as React components.

---

## Questions to Ask Yourself While Designing

- Can a 55-year-old farmer who has never used a tablet understand this screen in 5 seconds?
- If I cover up all the text, does the screen still make sense from icons alone?
- In direct sunlight, can I still distinguish all the interactive elements?
- Is the "next action" obvious? (Where do I tap to proceed?)
- Are the +/– buttons big enough to hit accurately on the first try?
- Does the lockbox number updating feel satisfying and clear?
