# Design System

Visual language for the Investment Game app. Derived from the original mockups and optimized for low-literacy users on tablets in bright outdoor environments.

---

## 1. Design Principles

1. **Clarity over decoration.** Every visual element communicates game state. No ornamental UI.
2. **Icons carry meaning, text supports.** Assume the participant may not read. Icons and illustrations must be self-explanatory.
3. **High contrast, outdoor-readable.** Bold colors on white backgrounds. No subtle gradients or thin hairline borders.
4. **Generous touch targets.** 72px minimum for primary actions. 56px minimum for secondary.
5. **Consistent spatial metaphor.** Left = what you have (lockbox/savings). Center = what you can buy. Right = outcomes/actions.

---

## 2. Color Palette

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Gold** | `#F5A623` | Tokens, coins, currency, earnings |
| **Green (Action)** | `#4CAF50` | Plant button, positive outcomes, "proceed" actions |
| **Green (Lush)** | `#7CB342` | Good rain, healthy crops |
| **Blue (Info)** | `#1565C0` | Learn more, insurance info, video offer |
| **Brown (Earth)** | `#8D6E63` | Fertilizer, soil, farming context |

### State Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Good Rain Blue** | `#90CAF9` | Rain cloud, water drops |
| **Bad Rain Tan** | `#D7CCC8` | Dry cloud, drought |
| **Drought Brown** | `#A1887F` | Cracked earth, crop failure |
| **Warning Red** | `#E53935` | Errors, audio recording indicator |

### Neutral Colors

| Name | Hex | Usage |
|------|-----|-------|
| **White** | `#FFFFFF` | Screen backgrounds |
| **Off-White** | `#FAFAFA` | Card backgrounds |
| **Gray 300** | `#E0E0E0` | Disabled states, dividers |
| **Gray 600** | `#757575` | Secondary text |
| **Gray 900** | `#212121` | Primary text |
| **Black** | `#000000` | Stepper buttons (+/–), critical UI |

### CSS Variables

```css
:root {
  --color-token-gold: #F5A623;
  --color-action-green: #4CAF50;
  --color-lush-green: #7CB342;
  --color-info-blue: #1565C0;
  --color-earth-brown: #8D6E63;
  --color-rain-blue: #90CAF9;
  --color-drought-tan: #D7CCC8;
  --color-drought-brown: #A1887F;
  --color-warning-red: #E53935;
  --color-bg: #FFFFFF;
  --color-card-bg: #FAFAFA;
  --color-disabled: #E0E0E0;
  --color-text-secondary: #757575;
  --color-text-primary: #212121;
}
```

---

## 3. Typography

### Font Stack

```css
/* Primary: clean, legible, widely available on Android */
--font-primary: 'Noto Sans', 'Roboto', sans-serif;

/* Numbers: tabular figures for aligned token counts */
--font-numbers: 'Noto Sans', 'Roboto', sans-serif;
font-variant-numeric: tabular-nums;
```

**Why Noto Sans:** Pre-installed on virtually all Android devices. Supports Latin, Luganda, Bemba, and other African language character sets. No web font download required (critical for offline).

### Type Scale

| Role | Size | Weight | Usage |
|------|------|--------|-------|
| **Token Count (Large)** | 48px | 700 (Bold) | Lockbox number, final payout |
| **Token Count (Medium)** | 32px | 700 | Stepper values, payout amounts |
| **Heading** | 24px | 600 (Semi-Bold) | Screen titles, section headers |
| **Body** | 18px | 400 (Regular) | Instruction text, descriptions |
| **Caption** | 14px | 400 | Labels, secondary info |
| **Badge** | 14px | 700 | Price badges on input icons |

---

## 4. Component Library

### 4.1 Lockbox

The primary "savings" indicator. Always on the left side of decision screens.

- **Visual:** Black metal lockbox illustration (from mockups), gold token coin below
- **Token count:** Large bold number below the token coin
- **Behavior:** Count updates in real-time as stepper values change. Brief scale animation (pulse) on each change.
- **Size:** ~200×200px for the lockbox image, token count below

### 4.2 Token Stepper

The input purchase control. Used for fertilizer, seeds, insurance, and bundle.

- **Layout:** Input icon on top → price badge (gold coin with number) → [–] button, value display, [+] button in a row
- **Buttons:** 72×72px black circles with white +/– symbols
- **Value display:** 32px bold number between buttons
- **Disabled state:** Buttons become gray (#E0E0E0), icon becomes semi-transparent (opacity 0.4)
- **Price badge:** Small gold circle overlapping the bottom-right of the input icon, showing the per-unit cost

**Variants:**
- **Fertilizer stepper:** Range 0–10, step size 1
- **Seeds stepper:** Range 0–1 (binary toggle via +/–)
- **Insurance stepper:** Range 0–1, disabled when seeds=0
- **Bundle stepper:** Range 0–1

### 4.3 Plant Button

The "confirm and proceed" action.

- **Visual:** Green circle (96×96px) with a planting/seeding icon (white silhouette of hand planting seed)
- **Position:** Bottom-right corner of decision screens
- **States:**
  - Default: solid green (#4CAF50)
  - Pressed: darker green (#388E3C)
  - Disabled: gray (#E0E0E0) — only if no inputs purchased AND savings = full budget (optional: may want to allow planting with 0 inputs)

### 4.4 Payout Reminder Card

Always-visible reference showing what inputs pay out under each weather condition.

- **Position:** Top-right corner of decision screens
- **Size:** ~280×200px card
- **Content:** Mini versions of the fertilizer payout diagrams:
  - Top row: coin(1) → rain cloud → lush field → coin(2), labeled "2×"
  - Bottom row: coin(1) → dry cloud → dry field → coin(0), labeled "0×"
  - Divider line between rows
- **For Round 2:** Expanded to include seed/insurance/bundle payoffs
- **Style:** White card with thin border, subtle shadow

### 4.5 Confirmation Dialog

Modal overlay for "Are you sure?" before planting.

- **Overlay:** Semi-transparent black backdrop (50% opacity)
- **Dialog card:** White, centered, rounded corners, ~400×250px
- **Content:**
  - Icon: warning/question mark
  - Text: "Are you sure? You cannot change your mind after planting."
  - Two buttons: "Go Back" (gray, left) and "Plant!" (green, right)
- **Important:** The "Plant!" confirmation button must NOT be in the same position as the original plant button, to prevent accidental double-tap confirmation.

### 4.6 Audio Player Bar

Narration controls for instruction screens.

- **Position:** Bottom of screen, full width
- **Elements:** Play/pause button (left), progress bar (center), time display (right), replay button (far right)
- **Height:** 64px
- **Colors:** Dark background (#212121), gold progress fill, white controls

### 4.7 Weather Reveal

Full-screen weather outcome display.

**Good Rain:**
- Blue rain cloud (#90CAF9) at top center
- Three water droplets falling (animated)
- Lush green cornfield illustration below
- Background: light warm yellow (#FFF9C4)
- Mood: optimistic, abundant

**Bad Rain (Drought):**
- Empty cloud outline (#757575) at top center (no rain drops)
- Cracked brown earth with wilted crops below
- Background: light tan (#EFEBE9)
- Mood: somber but not alarming

### 4.8 Input Icons

Each purchasable input has a distinct icon:

| Input | Icon Description | Color Family |
|-------|-----------------|-------------|
| **Fertilizer** | Green bag with plant seedling logo | Green/brown |
| **Improved Seeds** | Two orange/yellow seed packets with leaf logo | Orange/yellow |
| **Insurance** | Shield with wheat/grain emblem held by hands | Blue/gold |
| **Bundle (Seeds+Insurance)** | Seed packets with small insurance shield overlay | Orange with blue badge |
| **Lockbox** | Black metal cash box | Black/gray |
| **Token** | Gold coin with diagonal shine line | Gold |

---

## 5. Layout Grid

### Decision Screens (Landscape Tablet)

```
┌──────────────────────────────────────────────────────────────────┐
│ [Header: Round title / status bar]                    [Payout   │
│                                                        Reminder │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ Card]   │
│ │          │  │          │  │          │  │          │         │
│ │ LOCKBOX  │  │ FERT     │  │ SEEDS    │  │INSURANCE│         │
│ │          │  │          │  │          │  │          │         │
│ └──────────┘  └──────────┘  └──────────┘  └──────────┘         │
│     25           [–] 0 [+]     [–] 0 [+]     [–] 0 [+]         │
│                                                                  │
│                                                   ┌──────┐      │
│                                                   │PLANT │      │
│                                                   │  🌱  │      │
│                                                   └──────┘      │
└──────────────────────────────────────────────────────────────────┘
```

### Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| `space-xs` | 4px | Tight internal padding |
| `space-sm` | 8px | Badge margins, icon gaps |
| `space-md` | 16px | Component internal padding |
| `space-lg` | 24px | Between components |
| `space-xl` | 32px | Between major sections |
| `space-2xl` | 48px | Screen edge margins |

---

## 6. Animation & Motion

Keep animations **subtle and purposeful**. Low-end devices struggle with complex animations.

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Token count change | Scale pulse (1.0 → 1.15 → 1.0) | 200ms | ease-out |
| Screen transition | Fade in | 300ms | ease-in-out |
| Weather reveal | Cloud fade in → [pause 500ms] → field fade in | 2000ms total | ease-in |
| Rain drops (good rain) | Fall from cloud, repeat 3× | 800ms per cycle | linear |
| Confirmation dialog | Fade in + scale from 0.9 | 200ms | ease-out |
| Disabled → enabled | Opacity 0.4 → 1.0 | 200ms | ease-out |

**No CSS animations that use `transform: translate3d` or `filter` on low-end devices** — these can cause jank. Stick to `opacity` and `transform: scale` which are GPU-composited.

---

## 7. Responsive Breakpoints

Primary target is landscape tablet. The app should NOT attempt phone layouts.

| Viewport | Behavior |
|----------|----------|
| ≥ 1024px wide (landscape tablet) | Full layout as designed |
| 800–1023px (small tablet landscape) | Slightly compressed spacing, same layout |
| < 800px wide | Show "Please rotate to landscape" message |

---

## 8. Asset Inventory

Assets needed (SVG preferred, WebP fallback for complex illustrations):

### Icons (SVG)
- [ ] Fertilizer bag
- [ ] Seed packets (orange)
- [ ] Insurance shield with hands
- [ ] Bundle (seeds + insurance badge)
- [ ] Lockbox / cash box
- [ ] Token coin (gold)
- [ ] Plant/seeding action icon
- [ ] Plus button (circle)
- [ ] Minus button (circle)
- [ ] Rain cloud (filled, blue)
- [ ] Dry cloud (outline only)
- [ ] Water droplets
- [ ] Speaker / audio icon
- [ ] Replay icon
- [ ] Arrow (proceed) icon
- [ ] Question mark badge
- [ ] Checkmark
- [ ] Warning triangle
- [ ] Gear (admin)
- [ ] Corn/maize ear

### Illustrations (WebP or SVG)
- [ ] Lush cornfield (good harvest)
- [ ] Cracked earth with wilted crops (drought)
- [ ] Farmer character (optional, for instructions)

### Audio Files (MP3, per language)
- [ ] Instruction step narrations (6+ steps × N languages)
- [ ] Insurance explanation (Version A narration)
- [ ] Insurance explanation (Version B narration)

### Video Files (MP4)
- [ ] Insurance video — Version A (per language)
- [ ] Insurance video — Version B (per language)
