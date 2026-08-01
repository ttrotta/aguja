# Feature Specification: Landing Visual Rework

**Feature Branch**: `004-landing-visual-rework`

**Created**: 2026-07-30

**Status**: Draft

**Input**: User description: "Replace the flat single-plane page background with a dot-matrix field
that parts around the needle-and-thread motif, and change the hero headline from the 'Aguja'
wordmark to the product category, now that the navbar logo carries the wordmark itself."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Learn what the product is without already knowing the name (Priority: P1)

A developer arrives at the landing page from a link, having never heard of Aguja. The first thing
they read tells them what kind of tool this is — a debugger for RAG retrieval — rather than
repeating a brand name that means nothing to them yet. The name is still present, carried by the
navbar logo, but it is no longer the largest thing on the page.

**Why this priority**: This is the comprehension gate for every other thing the landing wants to
do. A visitor who cannot tell what the product category is within a few seconds does not stay to
read the problem section, and no amount of atmosphere below the fold recovers them. It is also the
only story here that changes what the page *says* rather than how it looks, which makes it the one
with a governance obligation: the copy ships in both interface languages.

**Independent Test**: Load the landing page in each locale with no prior knowledge of the product
and confirm the largest text names the product category. Fully testable on its own, with no
dependency on the background work, and it delivers the comprehension value by itself.

**Acceptance Scenarios**:

1. **Given** a visitor who has never seen the product, **When** they load the landing page in
   either locale, **Then** the largest text on the first screen names what the product is rather
   than what it is called.
2. **Given** the navbar is visible, **When** the visitor looks for the product name, **Then** it is
   present in the navbar logo, so removing it from the headline loses nothing.
3. **Given** the headline is longer than a single short word, **When** the page is viewed at any
   supported viewport width, **Then** the hero's two-zone composition still holds and the headline
   does not overlap or displace the needle or the tool dial.
4. **Given** the headline states the product category, **When** the visitor reads the supporting
   line beneath it, **Then** that line adds new information rather than restating the headline.

---

### User Story 2 - Read a landing page that has material presence, not a flat void (Priority: P2)

A visitor scrolls the landing page. Instead of text floating on one undifferentiated plane of
near-black (or of linen, in the light theme), the page sits on a fine field of dots — a texture
that gives the surface depth and makes the page feel like a considered object rather than an
unstyled default. The texture never competes with the words: everything stays as readable as it was
before.

**Why this priority**: The visual system already declared this. `DESIGN.md` lists "never a flat
single-plane background" as a Key Characteristic of the design world, and the landing has been
exactly that flat plane since it shipped — a gap between the documented system and the built page.
Closing it is worth more than the parting refinement in Story 3, because the plain field delivers
most of the perceived quality on its own and is a fraction of the work.

**Independent Test**: Load the landing page in both themes and confirm the background carries a
visible dot texture and that all text still meets its contrast floor. Ships and demonstrates value
without Story 3.

**Acceptance Scenarios**:

1. **Given** the landing page in the dark theme, **When** it renders, **Then** the background shows
   a dot field rather than a single flat colour.
2. **Given** the landing page in the light theme, **When** it renders, **Then** the dot field is
   visible against the light page surface and is not washed out to invisibility.
3. **Given** any text on the landing page, **When** it is measured against the surface behind it,
   **Then** it meets its contrast floor in both themes.
4. **Given** a visitor scrolls the full length of the landing page, **When** the page moves,
   **Then** scrolling stays smooth and the texture does not cause visible stutter.
5. **Given** the visitor opens any tool surface, **When** it renders, **Then** it is unchanged —
   the field does not follow them into the task.

---

### User Story 3 - See the field belong to the needle rather than sit behind it (Priority: P3)

**Status (2026-07-30): reverted.** This story shipped, passed every automated check, and was
rejected on sight once rendered — the user didn't like the result. Left below as the record of
what was attempted; nothing in the codebase currently satisfies it. See the spec's post-review
amendment for what superseded it.

The dot field is not uniform wallpaper. Around the needle and its thread, the dots give way — they
thin out and fade, as though the thread were passing through the field and displacing it. The
background stops being a layer behind the motif and becomes part of the same picture.

**Why this priority**: This is what separates the page from every other dotted-background landing
page, and it is the reason the texture belongs to *this* product rather than being borrowed
atmosphere. It is last because it is a refinement on Story 2 — valuable, but the page is already
substantially better without it, and it carries the only real technical risk in the feature.

**Independent Test**: Load the landing hero and confirm the dot field is visibly interrupted in the
region occupied by the needle and thread, while remaining uniform elsewhere. Testable as a visual
diff against Story 2's uniform field.

**Acceptance Scenarios**:

1. **Given** the hero is visible, **When** the visitor looks at the region around the needle and
   thread, **Then** the dots there are thinner and fainter than the dots elsewhere on the page.
2. **Given** the needle's idle sway animation is running, **When** the needle moves through its
   full range, **Then** it stays within the cleared region and never appears to collide with the
   dot field.
3. **Given** a visitor who has asked their system to reduce motion, **When** the landing loads,
   **Then** the composition holds a static frame with the clearing still present and correctly
   placed.
4. **Given** the clearing is present, **When** the visitor looks at its colour, **Then** the
   clearing is an absence of dots, not a coloured shape — no violet halo is introduced by it.

---

### Edge Cases

- **What happens when the browser does not support the masking needed for the clearing?** The page
  must fall back to the uniform dot field rather than losing the background entirely or showing a
  hard-edged rectangle where the clearing should be.
- **What happens at very small viewports, where the hero stacks vertically and the needle moves?**
  The clearing must follow the needle to its stacked position, or be suppressed — it must never
  sit over empty space while the needle sits over dots.
- **What happens on very large or high-density displays?** The dot spacing must not scale up into
  visible polka dots, nor collapse into a solid tint that changes the effective page colour.
- **What happens where the field passes behind a raised surface** — the problem section's evidence
  board, the tool dial, the footer? Those surfaces are opaque and already sit above the page
  background; the field must not show through them and must not weaken their edges.
- **What happens when the visitor switches theme while looking at the page?** The dot field must
  switch with it, in the same transition the rest of the page already uses, with no flash of the
  wrong-theme dots.
- **What happens to the long-form reading surfaces** (documentation, research)? They are outside
  this feature's scope and must be visually unchanged.

## Requirements *(mandatory)*

### Functional Requirements

#### Hero headline

- **FR-076**: The landing hero's primary heading MUST state the product category rather than the
  product name.
- **FR-077**: The heading text MUST be part of the translated interface copy and MUST be present in
  every supported locale, so no locale falls back to another language for its largest text.
- **FR-078**: The supporting line beneath the heading MUST NOT restate what the heading already
  says.
- **FR-079**: The heading MUST render without breaking the hero's two-zone composition at every
  supported viewport width, including the narrowest.
- **FR-080**: The product name MUST remain visible on the landing page outside the hero heading, so
  that the change removes a repetition rather than the identity.

#### The dot field

- **FR-081**: The landing page background MUST NOT be a single flat colour; it MUST carry a
  dot-matrix texture.
- **FR-082**: The dot texture MUST be rendered in a neutral tone derived from the theme's text
  colour, and MUST NOT be violet. Violet remains reserved for the primary action, the current
  selection, and the thread motif, per the design system's One Thread Rule.
- **FR-083**: Each supported theme MUST define its own dot value, and the dots MUST be visible
  against that theme's page surface without dominating it.
- **FR-084**: All landing text MUST meet WCAG AA contrast against the dotted surface behind it —
  4.5:1 for body copy, 3:1 for large display text — verified in both themes.
- **FR-085**: ~~The dot field MUST NOT be applied to any surface under the tool suite~~ —
  **superseded by FR-103.**
- **FR-086**: ~~The dot field MUST NOT be applied to the documentation or research pages in this
  feature~~ — **superseded by FR-103.**
- **FR-087**: The dot field MUST add no additional network requests. ~~and no additional
  downloaded bytes~~ — **superseded by FR-111**, once the pattern grew from a single gradient to a
  hand-authored SVG. It MUST be generated by the stylesheet, not fetched as an image asset.
- **FR-088**: The dot field MUST NOT introduce layout or paint work during scrolling.
- **FR-089**: The dot field MUST NOT be shaped into any representational silhouette — in
  particular, not a map, a continent, or any other geographic form. Shaping MUST derive from the
  needle-and-thread motif the product already owns.
- **FR-090**: Opaque raised surfaces on the landing MUST continue to fully occlude the field
  behind them, with their edges unweakened.
- **FR-091**: The dot field MUST follow the active theme, changing with it and with no flash of the
  previous theme's dots during the switch.

#### The clearing around the needle

- **FR-092**: The dot field MUST be visibly interrupted — thinner and fainter — in the region
  occupied by the needle and its thread, and MUST remain uniform elsewhere.
- **FR-093**: The clearing MUST be an absence of dots, not an added coloured shape, and MUST NOT
  introduce any glow. The design system reserves glow for the motif itself and the active
  selection.
- **FR-094**: The clearing's edge MUST be soft, so that no hard boundary between cleared and
  uncleared field is visible.
- **FR-095**: The clearing MUST be fixed in place and MUST NOT track the needle's idle sway. It
  MUST be sized to contain the needle's full sway arc, so that the needle never leaves the cleared
  region at any point in its cycle. The needle's position within the clearing shifts as it sways;
  this is accepted, and FR-094's soft edge is what makes it unremarkable. Chosen over a clearing
  that tracks the sway because tracking would require a second, independent animation on a
  different element to stay in phase with the needle for the life of the page — and when the two
  drift, a clearing visibly offset from the needle is a worse defect than a needle sitting slightly
  off-centre in a generous clearing. A fixed clearing has nothing to desynchronise.
- **FR-096**: Neither the dot field nor the clearing MUST introduce any continuous animation. This
  follows from FR-095 and is stated separately so it is checkable on its own: the landing's
  existing motion moments are the only ones, and this feature adds none. When the visitor has
  requested reduced motion and the motif holds its static frame, the clearing MUST still be
  correctly placed around that held frame.
- **FR-097**: Where the browser cannot render the clearing, the page MUST degrade to the uniform
  dot field, never to a missing background or a hard-edged shape.
- **FR-098**: At viewport widths where the hero recomposes and the needle changes position, the
  clearing MUST either follow the needle or be suppressed entirely.

#### Recorded reasoning

- **FR-099**: The visual system document MUST be updated to describe the dot field, since it is the
  authority on visual decisions and currently describes a background this feature replaces.
- **FR-100**: A new append-only decision entry MUST record why the field is shaped by the
  needle-and-thread motif and why the representational alternative was rejected.

#### Contrast precondition (added during planning)

*Added after the specification was first written. Planning measured the floor FR-084 demands and
found it already unmet, which under the constitution's first principle stops work and amends the
specification rather than coding around it.*

- **FR-101**: The light theme's secondary text tone MUST be corrected to meet WCAG AA (4.5:1)
  against every surface it is used on, before the dot field is introduced. Measurement found it
  currently fails against all four light surfaces — 4.28:1 on the page, 4.49:1 on the panel,
  4.30:1 on the panel inset, and 4.17:1 on the card — which is a pre-existing defect this feature
  did not create but cannot build on top of, because the dot field lowers the effective contrast
  further. The dark theme is unaffected and MUST NOT be changed; it already measures between
  6.5:1 and 6.9:1.
- **FR-102**: The correction MUST be applied at the shared token, not scoped to the landing.
  Scoping it would leave the same defect in place on the tool, documentation, and research
  surfaces while claiming the feature meets its contrast bar.

#### Post-review amendment (2026-07-30) — site-wide field, reverted clearing

*The clearing (US3, FR-092–FR-098) shipped, passed every test, and was rejected on sight by the
user once rendered. Reverted in full — `BigNeedle` carries no clearing. Superseded by a broader
redesign rather than a second attempt at the same idea, since the direction changed underneath it:
the dot field itself is being rebuilt bigger and irregular, and the scope this section originally
bounded to the landing is reversed below. FR-092–FR-098 stay in this document as a record of what
was tried, not as live requirements — nothing currently in the codebase satisfies them, and nothing
is expected to until a clearing is designed again against the new field.*

- **FR-103**: The dot field MUST be applied site-wide — every route, not the landing alone. This
  reverses FR-085 and FR-086. The reversal is deliberate and user-directed, not a scope-creep
  default: the original exclusions were this feature's own judgement (research.md R-006), not a
  constitution-level rule, and the user chose visual presence across the product over that
  judgement after seeing the landing-only version.
- **FR-104**: Within the tool suite specifically, the field MUST be applied only to `page-bg` — the
  surface visible around the tool's floating panel, not the panel or anything inside it. The
  floating panel (`panel-bg`, opaque) and its interior continue to fully occlude the field
  (FR-090), which is what keeps the design system's Operate-mode rule — "the task always outranks
  the atmosphere" — true for the surface where the actual work happens. The reversal in FR-103 is
  about where page-bg is visible, not about decorating the instrument itself. Since FR-115, the
  tier visible there is the quiet default, not the rich landing pattern — consistent with, not in
  tension with, this requirement's original reasoning.
- **FR-105**: ~~The dot pattern MUST be irregular — hand-placed variation in position and size,
  not a uniform grid~~ — **superseded by FR-108 (post-review amendment, 2026-07-30).** The
  requirement stood for one iteration — scattered dot positions and sizes, no grid — and was
  itself rejected once rendered: the user wanted dots that *are* aligned, with the randomness
  coming from size alone. See D-017 (supersedes D-016 on this point only).
- **FR-106**: Individual dots MUST be visibly larger and more present than the field originally
  shipped with, closer in scale to the reference image that motivated this feature. Still true, and
  reinforced by FR-108 — the second reference image showed larger dots than the first.
- **FR-107**: The heavier, more visible field introduced by FR-106 MUST still hold FR-084's
  contrast floor. Verified in `theme` project invariant C-3 up to a measured ceiling of
  approximately 0.20 dot opacity, beyond which secondary text sitting on a dot pixel drops below
  4.5:1 in both themes; the shipped value stays under that ceiling with margin. The ceiling is a
  function of alpha alone, not dot radius, so it held unchanged across FR-108's rework.

#### Second post-review amendment (2026-07-30) — halftone grid, not scattered positions

*The scattered-position pattern (FR-105 as originally written) shipped, was measured, passed every
test — and was rejected on sight again, on the same day, once the user saw it rendered against a
second reference image: a halftone-style pattern where dot positions sit on a regular, aligned
grid and only the radius varies, forming rounded blob shapes. "Random" was never about position —
it was about size.*

- **FR-108**: Dot positions MUST sit on a regular, evenly spaced grid. Size MUST vary per position,
  driven by proximity to a small number of fixed points, so that dots grow into rounded blob shapes
  and shrink back to a small floor size elsewhere — a halftone pattern, not a scatter. This
  reverses FR-105 exactly on the position question while keeping FR-106's "bigger, more present"
  intact; the two were never in tension, only conflated in the first amendment.

#### Third post-review amendment (2026-07-30) — irregular coastlines, not radial blobs

*FR-108 shipped, passed every test, and was liked in principle — the grid alignment and size
variation were both confirmed as the right idea. What didn't land was the blob shape itself:
distance-based falloff from a fixed point produces a smooth, radially symmetric shape, which reads
as a soft circle rather than something organic. The user asked for something "freestyle," like
invented continents — not the real ones.*

- **FR-109**: Each landmass's edge MUST be irregular by angle, not a smooth radius from its center
  — the coastline itself must vary, producing bays, peninsulas, and asymmetry, rather than a
  falloff that is the same distance in every direction.
- **FR-110**: The tile MUST be large enough, and carry enough independently-shaped landmasses, that
  its repetition is not obvious at normal viewport and scroll distances. A small tile with few,
  visually similar shapes reads as a stamped motif; this is what "no quiero que haya un patrón"
  ruled out, not tiling itself — a non-repeating, infinite-canvas version would need either an
  asset (FR-087) or runtime generation (ruled out earlier for cost and determinism reasons), so
  tiling remains the mechanism, sized and varied enough to not read as one.
- **FR-111**: The added payload from FR-110's larger tile MUST be disclosed, not assumed zero.
  FR-087's "no additional bytes" was written against a single-gradient design and no longer holds
  literally — supersedes FR-087 on the byte claim only; "no additional network requests" stands
  unchanged, since the pattern is still inlined in the stylesheet already being fetched, never a
  separate asset.

#### Fourth post-review amendment (2026-07-30) — size contrast, not even coverage

*FR-109/FR-110 shipped six landmasses of broadly similar size, spread to cover most of the tile.
Rejected on sight: too much of the tile carried some size bump, leaving little genuinely empty
"ocean." The ask was for real contrast — some regions much bigger, and consequently other regions
left alone — not uniform moderate coverage.*

- **FR-112**: Landmass sizes MUST vary substantially from each other, not cluster around a similar
  radius, and MUST leave a substantial genuinely-empty fraction of the tile — base-radius dots only,
  no size influence from any landmass — rather than near-full coverage at moderate size. Measured at
  63% of grid cells carrying no size bump in the shipped version, against under 5% before this
  amendment.

#### Fifth post-review amendment (2026-07-30) — the tile itself was the problem

*FR-108 through FR-112 all addressed what the tile contains. None addressed the tile's own size:
at 408×204px, a typical ~1900px-wide viewport shows it horizontally repeated roughly five times
side by side — visible, counted by the user as "5 columns" of identical shapes, regardless of how
varied or empty any single repeat is on its own.*

- **FR-113**: The tile's width MUST be close to or exceeding common desktop viewport widths, so
  that horizontal repetition is not visible within a single ordinary screen. Vertical repetition
  (encountered only by scrolling, never side by side in one view) is a materially smaller concern
  and is not held to the same bar.
- **FR-114**: FR-111's byte disclosure MUST be re-measured whenever the tile grows, not carried
  forward from a smaller version. A bigger canvas at the same dot density is a proportionally bigger
  payload; asserting the old number would be the same failure FR-111 exists to prevent, applied to
  itself.

#### Sixth post-review amendment (2026-07-30) — two tiers, landing rich / everywhere else quiet

*The rich, site-wide field satisfied FR-103's letter but not the actual want once the user saw it
everywhere: the landing should keep what FR-108–FR-113 built, but every other route should fall
back to something small and uniform, quiet enough that it doesn't compete with reading (docs,
research) or working (the tool) — "que no entorpezca."*

- **FR-115**: The rich halftone-continent pattern (FR-108–FR-113) MUST be exclusive to the landing.
  Every other route MUST render a small, uniform, size-invariant dot field instead — no landmasses,
  no size variation, the technique the feature started with before FR-108's halftone work began.
  This does not reverse FR-103 (some dot field still reaches every route) — it splits FR-103's
  single field into two tiers of richness.
- **FR-116**: The two tiers MUST NOT visually mix on any route. A landing element carrying the rich
  pattern MUST be fully opaque wherever it renders, so the default tier behind it — present on every
  route, including the landing's own `<body>` — cannot show through the rich pattern's empty
  regions, which is most of its area (FR-112's 63%+ empty requirement, inherited by every later
  landmass revision). Discovered as a real defect, not a hypothetical: the first implementation of
  this amendment shipped without it and visibly showed both tiers overlapping on the landing.
- **FR-117**: FR-115's split is a rendering-time class distinction, not a bundle-time one. The two
  tiers' CSS — including the rich pattern's encoded SVGs — MUST NOT be assumed to load separately
  per route unless verified against the actual served asset. Verified false in this project's
  current build: `globals.css` compiles to one shared chunk loaded by every route regardless of
  which tier that route's markup uses, so FR-111/FR-114's disclosed byte figure is paid once per
  browser session (cached thereafter), not per route and not avoided by routes using only the
  quiet tier. Splitting it for real would require moving the rich pattern into a route-scoped CSS
  Module; out of scope for this feature by explicit user choice — the shared-bundle cost, paid once
  and cached, was accepted as-is rather than warranting that added architecture.

#### Scope extension (2026-07-30) — hero micro-interactions

*New capability, not a rejection of anything already shipped. The Footer's translucent background
was also corrected in this session (`bg-panel-inset-bg/40` → solid) as a small, unambiguous,
directly-requested fix — mechanical enough not to need its own requirement.*

- **FR-118**: The landing's scroll-to-explore cue MUST be visually distinct from a generic pattern
  — an arrow rather than the pill-and-dot used at launch — and MUST be dismissed permanently on the
  visitor's first scroll of the page, never reappearing even if they scroll back to the top. Same
  rule the tool dial's auto-advance already follows, applied to a second element.
- **FR-119**: The hero's lower edge MUST carry an ambient glow that breathes (cycles in intensity)
  rather than holding a fixed brightness, reinforcing the scroll cue without requiring the visitor
  to look directly at the arrow to notice it. This is a deliberate extension of the design system's
  Earned Glow Rule, not a use the rule already permitted — glow was previously reserved for the
  thread/needle motif and the active selection; recorded in DESIGN.md and docs/decisions.md (D-022)
  as the extension it is, not folded into the existing rule silently.
- **FR-120**: Both FR-118's arrow float and FR-119's glow breathing MUST respect
  `prefers-reduced-motion`, holding a static frame rather than animating — the same treatment every
  other authored motion moment on this page already receives.
- **FR-121**: The browser scrollbar MUST be restyled site-wide to read as the thread motif — a
  violet, pill-shaped thumb carrying the same glow treatment as the needle, not a literal needle
  silhouette. A curved, bent scrollbar thumb is not achievable with CSS; the scrollbar thumb is
  always a rectangle (roundable, colourable, cannot be shaped or rotated). Site-wide because this is
  chrome, like the navbar — not landing-specific atmosphere — and violet already carries this exact
  meaning (primary action, current selection, the thread) throughout the tool.
- **FR-122**: FR-121 MUST degrade gracefully where the browser cannot render it. Firefox exposes
  only `scrollbar-color` (thumb/track colour, no shape or glow) via the CSS Scrollbars spec; Chromium
  and WebKit browsers get the full pill-plus-glow treatment via `::-webkit-scrollbar-thumb`. Neither
  browser is left with an unstyled or broken scrollbar.

### Key Entities

- **Dot field**: The page-level background texture, in two tiers (FR-115). *Default* (every route):
  small, uniform dot size, no landmasses — the technique the feature started with. *Landing*: dot
  tone (per theme), regular-grid position (FR-108), size varying per position by proximity to
  irregular-edged landmasses (FR-108–FR-112). Both tiers apply site-wide in the sense that some
  field reaches every route (FR-103); only the landing renders the rich one, and only there scoped
  to `page-bg` specifically within the tool suite (FR-104) for the default tier.
- **Clearing**: The region of the dot field suppressed around the needle-and-thread motif. Reverted
  post-review (see the amendment above) — recorded for its attributes (position anchored to the
  motif, extent, edge softness) but not currently implemented.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-029**: A first-time visitor who has never heard of the product can state what category of
  tool it is after five seconds on the landing page, without scrolling.
- **SC-030**: Every text element on the landing page measures at least 4.5:1 contrast against its
  background for body copy, and at least 3:1 for large display text, in both themes — verified by
  measurement, not by eye.
- **SC-031**: ~~The landing page downloads the same number of bytes~~ — **superseded by FR-111,
  then FR-114.** Restated: zero additional network *requests* (unchanged), and the additional bytes
  from the pattern itself stay under a stated, measured budget rather than being assumed away.
  Currently ~19.75KB gzipped, `globals.css` total, up from ~8.9KB once FR-113 required the tile to
  span close to a full viewport width rather than repeat within one — verified against the file's
  actual compressed size each time the tile changes, never carried forward from an earlier
  measurement.
- **SC-032**: Scrolling the full landing page holds a steady frame rate with no dropped frames
  attributable to the background, on a mid-range laptop.
- **SC-033**: With reduced motion requested, the landing presents a static composition — no element
  of the background or the motif is in continuous motion.
- **SC-034**: ~~Every tool surface, the documentation page, and the research page carry no dot
  field~~ — **superseded by FR-103.** Restated: the tool's floating panel and its interior render
  with no layout, spacing, or structural change and no field on the panel itself (FR-104); the
  documentation and research pages, and the page-bg margin around the tool's panel, now carry the
  field deliberately.
- **SC-035**: The landing headline reads in the visitor's selected interface language in 100% of
  supported locales, with no locale falling back to another language.
- **SC-036**: ~~dots remain individually indistinct~~ — superseded by FR-106, then
  ~~"never resolve into a mechanically regular grid"~~ — **superseded again by FR-108.** Restated
  a second time: the background reads as intentional halftone texture rather than as a rendering
  artifact — individual dots are visible at normal viewing distance, sit on a regular grid by
  design, and vary in size to form rounded blob shapes rather than either a flat tint or uniformly
  identical dots.
- **SC-037**: Secondary text measures at least 4.5:1 against every surface it appears on, in both
  themes — page, panel, panel inset, and card. Four of those eight combinations fail today, all of
  them in the light theme.
- **SC-038**: A visitor who scrolls the landing at all never sees the scroll-cue arrow again for the
  rest of that page view, regardless of scrolling back to the top.
- **SC-039**: With reduced motion requested, neither the scroll arrow nor the hero glow animates —
  both hold a single static frame, verified the same way SC-033 is verified for the rest of the
  page's motion.
- **SC-040**: The scrollbar thumb is visually identifiable as violet in every Chromium, WebKit, and
  Firefox-based browser this project supports, with no unstyled or default-grey scrollbar in any of
  them.

## Assumptions

- ~~**The landing is the whole scope, and the field spans all of it.**~~ **Superseded by FR-103.**
  The field is now site-wide, applied once at `body` rather than scoped per page. The clearing
  premise (existing only where the needle exists) is moot — the clearing itself was reverted.
- ~~**Documentation and research pages are excluded deliberately, not by oversight.**~~
  **Superseded by FR-103.** The Read-mode concern this assumption raised — texture behind sustained
  prose working against comprehension — was real reasoning at the time (research.md R-006), not
  withdrawn as wrong, just overridden: the user weighed it against wanting visual presence across
  the product and chose presence. If the field ever reads as fighting the reading experience on
  `/docs`, that tradeoff, not the field's existence, is what should be revisited.
- **The existing needle and thread stay as they are.** This feature changes what is behind them,
  not the motif itself. Their current idle animations are treated as fixed inputs.
- **The hero headline copy is already agreed.** The wording states the product category and was
  chosen over the more generic alternative because the product's own positioning is a debugger
  specifically, not a general tool.
- **"Supported viewport widths" means desktop-first, mobile-tolerant.** The product's users are on
  desktop browsers by stated intent; the landing must not break on narrow screens, but the
  composition is tuned for desktop.
- **No new dependency is introduced.** The texture is expected to be expressible with the styling
  layer already in the fixed stack, which means this feature needs no amendment to the technology
  constraints.

## Dependencies

- The hero headline change (User Story 1) is already implemented in the working tree but was
  written before this specification existed. It is folded into this feature so that it traces to a
  written specification, as the constitution's first principle requires. Nothing about it is
  treated as settled by the fact that it is already coded; if this specification disagrees with the
  implementation, the implementation is what changes.
- The visual system document and the decision log are both updated as part of this feature
  (FR-099, FR-100). The decision log is append-only.
