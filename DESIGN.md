---
name: Aguja
description: A retrieval debugger — a needle finding the exact point where a passage got lost, now expressed as a dark instrument panel with a floating violet thread.
colors:
  dark:
    page-bg: "#0E0B14"
    panel-bg: "#17121F"
    panel-inset-bg: "#1D1728"
    text: "#F2EFF5"
    text-muted: "rgba(242, 239, 245, 0.62)"
    violet: "#A970FF"
    violet-deep: "#7C3AED"
    warning: "#FF7A66"
  light:
    page-bg: "#E9E2D3"
    panel-bg: "#F3EEE3"
    panel-inset-bg: "#EBE4D5"
    text: "#211D1B"
    text-muted: "rgba(33, 29, 27, 0.62)"
    violet: "#7A3FC2"
    violet-deep: "#6B3FA0"
    warning: "#A83C32"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontWeight: 900
    lineHeight: 0.92
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Jost, system-ui, sans-serif"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Jost, system-ui, sans-serif"
    fontWeight: 500
    letterSpacing: "0.02em"
rounded:
  sm: "10px"
  md: "16px"
  lg: "24px"
  full: "999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "32px"
  xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.dark.violet}"
    textColor: "{colors.dark.page-bg}"
    rounded: "{rounded.full}"
    padding: "14px 28px"
  button-primary-hover:
    backgroundColor: "{colors.dark.violet-deep}"
---

# Design System: Aguja

## Overview

**Creative North Star: "El hilo que flota" (The Floating Thread)**

Aguja is still a needle: the tool that finds the exact point where a retrieval system lost a
passage. The first world ("Hilván") staged that as a sewing table — paper, dashed stitches, flat
ink. This world stages it as a precision instrument at night: a needle and a single violet thread,
suspended and slowly drifting in near-dark space, the same way a diagnostic scope glows in an
otherwise dark lab. The metaphor did not change; the register did — from a tailor's desk to a dark
instrument panel.

Two visitor modes live under one system now. The **landing** (Persuade) is where the thread and
needle get room to breathe: large, dramatic, Committed-strategy violet-on-near-black, one
choreographed motion moment. The **tool** (Operate) is the same needle doing its actual job:
Restrained, quiet, a three-column instrument shell where the task always outranks the atmosphere.

Both are available as **dark (default)** or **light**. Light is not an afterthought — it is the
same system in daylight register, evolved from the original Lino/Tinta pair rather than discarded.

**Key Characteristics:**
- Near-black page behind a raised panel, or muted linen behind a raised panel — never a flat
  single-plane background; the panel is always visibly a panel. Since D-016, this is literal
  everywhere, not only where a panel sits: `page-bg` itself carries a hand-placed dot field
  site-wide (see Dot Field below), so even the plain margin around the tool's floating panel has
  texture rather than a flat fill.
- Fraunces Black is rationed to the landing hero and the navbar wordmark only; the tool runs on
  Jost alone, per Operate-mode discipline (one family, not a brand pairing, inside the task).
- One violet, used for exactly the same three things it always was: primary action, current
  selection, and the thread/needle motif itself.
- Rounded, soft device-panel geometry now (10–24px), not the sharp paper edges of the previous
  world — this world is a physical instrument casing, not a cut sheet.

## Colors

### Primary
- **Hilo Violeta** — dark `#A970FF` / light `#7A3FC2`: primary action, current selection, and the
  thread/needle motif. The dark value was lightened from an initial `#9D5CFF` after checking it as
  *text* against `panel-inset-bg` (the sidebar surface, not just `page-bg`) — the panel-bg check
  alone was passing but was the wrong (too lenient) surface; against the lighter
  `panel-inset-bg` it only reached ~4.49:1, just under AA. `#A970FF` clears both: 5.99:1 against
  `page-bg`, 5.36:1 against `panel-inset-bg`. Light's `#7A3FC2` was unaffected (5.47:1 against
  `panel-bg`, and higher still against the darker `panel-inset-bg`).
- **Hilo Violeta Oscuro** (hover/pressed background only, never text) — dark `#7C3AED` / light
  `#6B3FA0`. `violet-deep` as a *text* color against dark surfaces was the actual bug: ~3.06:1
  against `panel-inset-bg`, well under AA. Every place that used it for text now uses `violet`
  instead; `violet-deep` is restricted to hover/pressed fills.

### Tertiary
- **Hilo Rojo de Aviso** (errors, refusals, warnings only) — dark `#FF7A66` (7.6:1 against dark
  page-bg) / light `#A83C32` (5.4:1 against light panel-bg). Never means "selected" or "primary" —
  that is Hilo Violeta's job alone, unchanged from the previous world.

### Neutral
- **page-bg** — dark `#0E0B14` / light `#E9E2D3`: the outermost surface, always visibly *behind*
  the panel.
- **panel-bg** — dark `#17121F` / light `#F3EEE3`: the floating instrument panel itself.
- **panel-inset-bg** — dark `#1D1728` / light `#EBE4D5`: the second neutral layer — sidebars,
  input fields, anything nested one level inside the panel (Operate-mode's "second neutral layer"
  rule).
- **text** / **text-muted** — dark `#F2EFF5` / light `#211D1B`, each with a ~62%-opacity muted
  variant for secondary copy.

### Named Rules
**The One Thread Rule.** Hilo Violeta appears in exactly one active meaning per view: the current
selection, the primary action, or the thread motif itself — never decorative, never a second
"accent" for unrelated chrome.

**The Panel-Behind-Panel Rule.** page-bg, panel-bg, and panel-inset-bg are always three visibly
distinct values, never the same color at different opacities. Depth here is literal stacked
surfaces, not a shadow trick.

## Typography

**Display Font:** Fraunces (weight 900) — landing hero and navbar wordmark ONLY.
**Body/Label Font:** Jost — everywhere else, including every tool heading. The tool does not use
Fraunces at all; Operate-mode surfaces read better on one disciplined family than a brand pairing.

### Hierarchy
- **Display** (900, clamp(3.5rem, 10vw, 7.5rem), line-height 0.92): the hero headline. Since
  spec 004, this states the product category ("RAG Debugger" / its localized equivalent) rather
  than the "Aguja" wordmark — the navbar logo already carries the name, so the hero states what the
  product *is* instead of repeating what it's *called*. Appears once per page.
- **Headline** (Fraunces 900, 1.5rem): reserved for the landing's section leads only.
- **Title** (Jost 500, 1.125rem): tool section headers (was Fraunces in the previous world —
  demoted deliberately, see Named Rule below).
- **Body** (Jost 400, 1rem, line-height 1.5): document text, descriptions, landing paragraphs.
  Measure capped at 65–75ch on the landing; denser is fine in the tool.
- **Label** (Jost 500, 0.8125rem, letter-spacing 0.02em): offsets, scores, counts, nav links.

### Named Rules
**The One-Family Tool Rule.** No Fraunces inside `/tool`, anywhere, including headings that used
to carry it. A display face in a data label is Operate-mode noise, not brand consistency.

## Layout

**Landing:** full-bleed page, no panel framing — the page *is* the canvas. On desktop, the hero
commits the full first viewport (`min-height: 100vh` minus the navbar) with no CTA competing for
attention inside it — the wordmark and its subhead are the entire first screen, and a standard
"scroll to explore" cue anchors its bottom edge — a floating violet arrow (D-022; was a pill with a
drifting dot at launch), dismissed permanently on the visitor's first scroll, backed by an ambient
glow that breathes along the fold. The next section begins exactly at the fold; nothing about it
is visible without scrolling. Hero composition (desktop) is left-aligned text (wordmark + subhead)
grouped tightly with the swaying needle beside it, and a circular tool dial anchored to the right —
a two-zone asymmetric layout, never centered or symmetric. Sections below avoid grids of equal
cards; the problem section is a scattered evidence-board with irregular annotation placement, not
a repeating layout.

**Tool:** the entire app lives inside one floating panel (`rounded.lg`, drop shadow, `panel-bg`)
centered on `page-bg` with visible margin on all sides — the panel is always a distinct object, not
the page itself. Since D-016, that margin carries the site-wide dot field (see Dot Field below);
the panel and everything inside it stay exactly as restrained as ever, because the field lives on
`page-bg`, never on `panel-bg` or `panel-inset-bg` — Operate mode's "task outranks atmosphere" only
ever governed the instrument, not the desk it sits on. Inside it, three columns: left (document
input + strategy controls, on
`panel-inset-bg`), center (the chunked-document canvas, the largest region, on `panel-bg`), right
(query, model status, ranked results, share, on `panel-inset-bg`). Settled: comparison mode drops
the right column (its results render inline per side inside the comparison view itself) and the
grid becomes two columns — left sidebar (both strategies stacked) plus one wide content area.

## Elevation & Depth

Real, not simulated: depth comes from actual stacked surfaces (page-bg → panel-bg →
panel-inset-bg) plus one soft ambient shadow under the floating panel. The landing additionally
uses soft violet glow (blur, not a hard shadow) around the needle and thread — glow is reserved for
the motif itself, never for cards or buttons.

### Shadow Vocabulary
- **panel-elevation** (`box-shadow: 0 24px 64px -12px rgba(0,0,0,0.55)`): under the tool's floating
  panel only.
- **thread-glow** (`filter: drop-shadow(0 0 24px rgba(169,112,255,0.45))`): around the needle/thread
  motif on the landing and around the tool's active-selection needle glyph.

### Named Rules
**The Earned Glow Rule.** Violet glow marks the thread/needle motif, the current selection, and the
scrollbar thumb (D-022) — chrome that is quietly always the thread, not decoration earned by being
interactive. Since D-022, the hero's fold also carries a breathing ambient glow calling attention to
the scroll cue: a deliberate, recorded extension of this rule for one specific wayfinding moment, not
a general licence for glow-at-rest elsewhere. A button still does not glow at rest.

## Shapes

Soft device-panel geometry: outer panel `rounded.lg` (24px), inner cards/inputs/buttons
`rounded.sm` (10px), segmented controls and pills `rounded.full`. This is a deliberate reversal of
the previous world's sharp paper edges — this world is a physical instrument casing.

## Components

### Buttons
- **Shape:** `rounded.full` for the primary CTA (landing + tool's Search), `rounded.sm` for
  secondary/ghost buttons.
- **Primary:** background Hilo Violeta, text page-bg (dark theme) — inverted for contrast, not
  literally "linen text" anymore.
- **Hover:** background shifts to Hilo Violeta Oscuro.
- **Disabled:** 40% opacity, no color change.

### Chips / Toggles
- **Style:** `panel-inset-bg` background, 1px border at 20% text opacity, `rounded.full` for
  segmented toggles (theme switch, strategy chips), `rounded.sm` for the chunk-index chip list.
- **Selected:** border and text become Hilo Violeta; segmented toggles fill Hilo Violeta with
  inverted text.

### Inputs / Fields
- **Style:** `panel-inset-bg` background, 1px border at 20% text opacity, `rounded.sm`.
- **Focus:** border becomes Hilo Violeta at 2px, no glow ring (glow is reserved for the motif).

### Navbar
- Wordmark in Fraunces (small, ~1.5rem) left; nav link(s) + theme toggle right. No account/profile
  element — explicitly out of scope (Constitution Principle V, FR-021).

### Dot Field (signature texture, two tiers)
`page-bg` is never a flat fill, on any route — but only the landing gets the full signature
treatment (D-021). Every other route carries the **default tier**: a small, uniform
`radial-gradient`, same size dot everywhere, no landmasses — quiet enough that it never competes
with reading (docs, research) or working (the tool). This is deliberately the plainest possible
version of the motif, and it is what the rest of this section's history built *toward* rather than
away from — everything below describes the **landing tier**, which is exclusive to that one route.

On the landing, positions sit on a regular grid (86×25 cells) — not scattered, which is what keeps
the effect reading as a controlled halftone rather than noise. What varies is size: each dot grows
toward one of seven irregular "landmasses" spread across the full tile width, sized with real
contrast to each other (one dominant, several mid and small, no two sharing a harmonic set), and
shrinks to a small floor away from them, producing shapes with an actual coastline — bays,
peninsulas, asymmetry by angle, not a smooth radius from a center point (D-018). 77% of the tile
carries no size influence at all: genuinely empty "ocean," not moderate coverage everywhere (D-019).
The tile itself is close to a full desktop viewport wide — 1720×500px — because a smaller tile,
however varied or empty inside it, still repeats visibly side by side at ordinary viewport widths
(D-020); no amount of internal variety fixes a repeat interval that's too small. Landmasses use
toroidal (wrapping) distance so none clip hard against the tile edge. In neither theme is either
tier ever violet — the One Thread Rule reserves that for the primary action, the current selection,
and the thread motif alone.

Both tiers are applied via CSS background layers, never a mask, and the landing tier's own element
carries an explicit opaque `background-color` matching the page — without it, the default tier
underneath shows through the landing pattern's empty regions (most of its area), visibly mixing the
two (D-021's second fix, found by direct report after the first implementation shipped without it).
Both stop wherever an opaque surface (`panel-bg`, `panel-inset-bg`, `card-bg`) is drawn on top,
which is every occupied region of the tool panel, the raised evidence-board notes on the landing,
and every card on the reading pages. Rejected once already as a literal world map (D-015) — the
landing tier's shape comes from nothing but its own size gradient, never a representational
silhouette.

Five earlier versions were tried and rejected the same day, each correcting one specific thing the
last got wrong: an evenly scattered version of both position and size (not what "random" meant
here — D-017), a smooth radial version of the halftone blobs that read as soft circles rather than
something organic (D-018), too many similarly-sized landmasses leaving little genuinely empty space
(D-019), a tile too small to avoid visible side-by-side repetition (D-020), and — after the landing
tier was finally right — the whole site carrying it uniformly, when only the landing was meant to
(D-021, this one).

### Needle + Thread (signature motif)
Reinterpreted for this world: a larger, more dimensional needle SVG (stroke-only, `thread-glow`
applied) anchors the landing hero's left third. A single Hilo Violeta thread — rendered as a
slow-drifting animated path or particle trail — moves near/through the needle's eye continuously,
the landing's one authored motion moment (`prefers-reduced-motion` disables the drift, holding a
static composed frame instead). Inside the tool, the same needle glyph marks the selected chunk,
now with `thread-glow` instead of a flat stroke; chunk-boundary marking keeps its previous
mechanic (per-chunk index numeral + alternating underline opacity + solid violet underline when
selected) reskinned to the new tokens rather than reinvented, since it was already verified to
solve the "see where the cuts land" requirement.

### Tool Dial (signature component, landing hero)
A circular dial replacing a static comparison card: six nodes on a ring (the four shipped tools —
Chunk Inspector, Strategy Comparison, Query Sensitivity, Confusable Chunks — plus two generic
"Coming soon" slots that never carry a specific unannounced feature name), the active tool's
mocked preview shown in the ring's center. Navigable three ways — click a node, drag anywhere on
the ring (nearest-angle selection, not physics), or arrow keys when focused — and
slow-auto-advances only until the first interaction, after which it stops permanently and never
resumes. Skips auto-advance entirely under `prefers-reduced-motion`. The active node fills Hilo
Violeta; "Coming soon" nodes render with a dashed border and no individual label (the label only
appears once a node is actually active), so an unnamed future slot never reads as more committed
than it is.

### Thread Scrollbar (site-wide, D-022)
The browser scrollbar itself carries the thread: a violet, pill-shaped thumb with the same glow
`thread-glow` gives the needle, on every route. Not a literal needle silhouette — a scrollbar thumb
is always a rectangle, roundable but not bendable or rotatable, so the honest expression of the
motif here is colour and glow, not shape. WebKit/Blink/Safari get the full treatment via
`::-webkit-scrollbar-thumb`; Firefox, which only exposes `scrollbar-color`, gets a flat violet thumb
with no glow — graceful, not broken.

## Do's and Don'ts

### Do:
- **Do** keep Fraunces out of `/tool` entirely (One-Family Tool Rule).
- **Do** keep page-bg, panel-bg, and panel-inset-bg as three distinct values, always.
- **Do** respect `prefers-reduced-motion` on the landing's thread drift.
- **Do** verify any new text/UI color against this file's contrast ratios before shipping.

### Don't:
- **Don't** add a card grid or any repeating equal-weight layout to the landing's problem section —
  it is a scattered evidence board by design.
- **Don't** let glow apply to anything other than the thread/needle motif and the active selection
  (Earned Glow Rule).
- **Don't** introduce a login/account affordance anywhere — binding constraint, not a style choice.
- **Don't** use a shadow-as-decoration on tool components; `panel-elevation` exists once, under the
  whole panel.
