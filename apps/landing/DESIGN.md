# Design System: Just4You.buzz — Landing Page

**Project:** `apps/landing` (Vite + React + TypeScript + Tailwind v4 + framer-motion)
**Design Language:** "Candlelit" — a warm, heartfelt night glow

---

## 1. Visual Theme & Atmosphere

The landing page evokes the exact feeling of the product itself: the moment a loved one
opens a surprise link and warmth blooms across the screen. The mood is **intimate,
celebratory, and hand-crafted** — a velvet-plum night sky lit from within by candle-amber,
rose, and marigold-gold glows.

The atmosphere is **soft and layered rather than flat**. Deep, desaturated plum backgrounds
recede while warm radial glows, drifting particles, and blurred color-orbs float in front of
them, creating a gentle sense of depth and movement without clutter. Generous negative space
keeps each section calm and unhurried, letting the warm accent colors and elegant serif
headlines carry the emotion. The overall feeling is **premium, romantic, and human** — the
antithesis of a cold, templated, mass-produced SaaS page.

---

## 2. Color Palette & Roles

### Backgrounds (Velvet Night)
- **Velvet Plum (`#18101e`)** — The primary page background; a deep, warm-tinted plum that
  reads as night without going cold-black.
- **Deep Mulberry (`#201430`)** — Secondary/elevated background for alternating sections and
  gradient depth.
- **Ink Well (`#0f0913`)** — The deepest well tone, used at the base of gradients and behind
  the hero radial glow for dramatic contrast.

### Text (Warm Light)
- **Warm Ivory (`#fff5ec`)** — Primary heading text; a soft candle-white with a faint amber
  warmth so it never feels clinical.
- **Soft Linen (`#efe1d6`)** — Slightly softened light tone for emphasized body copy.
- **Warm Mauve (`#b9a6be`)** — Primary body/subheading text; muted lilac-taupe that sits
  calmly against the plum background.
- **Dusty Orchid (`#8f8098`)** — Tertiary/supporting label text and captions.
- **Faded Heather (`#6a5d73`)** — The faintest muted tone for fine print and de-emphasized
  metadata.

### Accents (Candle Glow)
- **Candle Amber (`#ff9e4f`)** — Signature warm accent; used for glows, orbs, active states,
  and statistic figures.
- **Rose Petal (`#ff6f9c` / `#ff5f93`)** — Romantic pink accent; the second half of primary
  gradients and hover glows.
- **Sunset Coral (`#ff8a5c`)** — The bridge tone that opens the primary button and logo
  gradients (coral melting into rose).
- **Marigold Gold (`#ffcf7a` / `#ffd98a`)** — Luxe gold used for premium accents, pricing
  highlights, and the gold gradient text.
- **Warm Apricot (`#ffb877`)** — Small interactive sparkle/icon accents and pill labels.

### Gradients (Signature Blends)
- **Warm Headline Gradient** — `linear-gradient(120deg, #ffc978, #ff8fae, #ff9e4f)` — amber →
  rose → amber; used for gradient headline words.
- **Primary Action Gradient** — `linear-gradient(135deg, #ff8a5c, #ff5f93)` — coral → rose;
  the unmistakable primary-button and logo fill.
- **Gold Gradient** — `linear-gradient(120deg, #ffd98a, #f0a93c, #ffe6b0)` — used for premium
  "pass"/pricing emphasis.

### Lines & Surfaces
- **Warm Hairline (`rgba(255,224,196,0.09)`)** — Faint warm borders and dividers.
- **Warm Glass Fill (`rgba(255,240,228,0.03)`)** — The near-transparent warm tint that gives
  cards their candlelit-glass quality.

---

## 3. Typography Rules

The system pairs an **expressive high-contrast serif** for emotion with a **clean humanist
sans** for clarity.

- **Display / Headlines — Fraunces (serif):** A soft, optical serif with gentle warmth and
  personality. Used for hero and section headlines at large sizes and semi-bold to bold
  weights. Its curves feel hand-set and celebratory rather than corporate. Key words within
  headlines are filled with the Warm Headline or Gold gradient for emphasis.
- **Body / UI — Plus Jakarta Sans (sans-serif):** A friendly geometric-humanist sans used for
  all body copy, subheadings, buttons, labels, and navigation. Weights range from light (300)
  for airy paragraphs to bold (700–800) for statistics and calls to action.
- **Letter-spacing:** Small uppercase eyebrow labels ("STEP BY STEP") use widened tracking
  (~0.02–0.15em) for a refined editorial feel; large serif headlines use tight, natural
  spacing to keep them intimate.

---

## 4. Component Stylings

- **Buttons:**
  - *Primary (`.btn-main`)* — **Pill-shaped** with a Sunset-Coral → Rose-Petal gradient fill,
    warm ivory label, and a soft **candle-glow drop shadow** (warm coral/rose halo) that lifts
    on hover. Confident and inviting — the emotional focal point of every section.
  - *Ghost (`.btn-ghost`)* — Pill-shaped with a translucent warm surface and a faint warm
    hairline border; used for secondary actions like "See How It Works."
- **Cards / Containers:** **Generously rounded corners (~20px)** with a warm glass fill
  (`rgba(255,240,228,0.03)`) over a faint warm border. Elevation is **soft and diffused** —
  gentle shadows and inner glows rather than hard drop shadows — so cards feel like they are
  lit from within. A gradient-border treatment (`.gb`) frames feature and CTA panels with a
  thin warm amber-to-rose edge.
- **Inputs / Forms (auth modal):** Sit on a **Deep Mulberry surface (`#221630`)** with softly
  rounded corners, muted warm fills (`#2c1e3a` resting → `#3a2a4a` focus), warm-ivory typed
  text, and dusty-orchid placeholders. The modal's own primary button reuses the coral→rose
  Primary Action gradient (scoped to `.login .btn` so it never overrides site CTAs).

---

## 5. Layout Principles

- **Centered, single-column narrative:** Content flows down the page as a story — hero →
  how-it-works → occasions → features → showcase → testimonials → pricing → final call —
  each section center-aligned within a constrained content width (`.wrap`) for comfortable
  reading.
- **Generous vertical rhythm:** Ample section padding and breathing room between elements keep
  the page calm and premium; nothing feels crowded.
- **Responsive grids:** Feature and occasion blocks use two- and three-column grids
  (`.two-col` / `.three-col`) that collapse gracefully on small screens, with helper classes
  (`.hide-sm` / `.show-sm`) tailoring content per breakpoint.
- **Depth through layering, not borders:** Structure is communicated with background-tone
  shifts (Velvet Plum ↔ Deep Mulberry), floating orbs, particles, and radial glows rather
  than heavy dividing lines — reinforcing the soft, candlelit atmosphere.
- **Motion with restraint:** framer-motion fades and gentle rises reveal content on scroll,
  and the hero's occasion label cross-fades through celebrations — movement that feels warm
  and alive without distracting from the message.
