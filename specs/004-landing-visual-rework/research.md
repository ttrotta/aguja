# Phase 0 Research: Landing Visual Rework

**Feature**: 004-landing-visual-rework | **Date**: 2026-07-30

All measurements below were computed against the actual token values in `src/app/globals.css`
using the WCAG 2.1 relative-luminance formula, not estimated by eye.

---

## R-001 — Light-theme secondary text already fails WCAG AA, everywhere

**Decision**: Correct `--color-text-muted` in the light theme from 62% to 72% opacity before the
dot field is introduced. Leave the dark theme untouched.

**Rationale**: The specification requires every landing text element to clear 4.5:1 against the
surface behind it (FR-084). Measuring that revealed the requirement is not met *today*, before any
dot exists, and not only on the landing:

| Light surface | Value | `text-muted` @62% | Verdict |
|---|---|---|---|
| `page-bg` | `#E9E2D3` | **4.28:1** | fail |
| `panel-bg` | `#F3EEE3` | **4.49:1** | fail, by 0.01 |
| `panel-inset-bg` | `#EBE4D5` | **4.30:1** | fail |
| `card-bg` | `#E4DCC8` | **4.17:1** | fail |

The dark theme measures 6.87, 6.74 and 6.55 against its three surfaces and needs no change.

This matters more than it first appears because `text-muted` is not decorative on this page. It
carries the hero's supporting line at 20px, and the walkthrough's step labels at **10px** —
sizes for which 4.5:1 is unambiguously the applicable bar, with no "large text" exemption
available.

Raising the light muted tone to 72% clears every surface with margin, and still clears them once
the dot field is composited underneath:

| Light surface | @72% flat | @72% over an 8% dot |
|---|---|---|
| `page-bg` | 5.80:1 | 4.98:1 |
| `panel-bg` | 6.10:1 | — |
| `panel-inset-bg` | 5.83:1 | — |
| `card-bg` | 5.64:1 | — |

**Alternatives considered**:

- *Scope the correction to the landing only.* Rejected. It would satisfy the letter of SC-034
  ("other surfaces unchanged") while knowingly leaving the identical defect on the tool,
  documentation and research pages. Choosing bookkeeping over readers. FR-102 now forbids it.
- *Leave 62% and lighten the dots instead.* Rejected. It does not work: the defect exists at zero
  dots, so no dot value can fix it.
- *Treat the hero line as "large text" (3:1).* Rejected on measurement. 20px regular weight is
  below the 24px threshold for large text, and the 10px step labels are not remotely close.

**Consequence**: the spec was amended during planning per Principle I — FR-101, FR-102, a rewritten
SC-034, and a new SC-037. This is the intended behaviour of that principle, not a detour.

---

## R-002 — The dot field: repeating gradient, no asset, no DOM node

**Decision**: Render the field as a single `radial-gradient` tile repeated by `background-size`,
applied to the landing's root element.

**Rationale**: It satisfies FR-087 (no network bytes) and FR-088 (no scroll-time work) by
construction rather than by optimisation. The browser rasterises one small tile and repeats it;
there is no element to lay out, nothing to fetch, and no script to run. It is also the only option
that keeps the dot tone bound to a CSS custom property, which is what lets the field follow the
theme switch (FR-091) with no JavaScript.

Dot geometry is expressed in CSS pixels, which resolves the high-density-display edge case for
free: spacing does not scale with device pixel ratio, so dots stay the same apparent size on a
retina display instead of doubling into visible circles (SC-036).

**Alternatives considered**:

- *SVG `<pattern>` element.* Works, but adds DOM and an extra layer for no gain over a gradient.
- *A raster or inline-SVG image of the field.* Rejected by FR-087, and rejected again by FR-089 if
  it were used to bake in a silhouette.
- *`background-attachment: fixed`.* Rejected. It decouples the field from the content it sits
  behind, and on some engines forces a repaint on every scroll frame — the exact cost FR-088
  forbids.

---

## R-003 — The clearing: an opaque gradient layer, not a mask

**Decision**: Paint the clearing as a second background layer *above* the dot layer, filling from
the page colour at its centre to fully transparent at its edge.

**Rationale**: CSS background layers stack with the first-listed on top. A layer that reads
`radial-gradient(page-colour → transparent)` therefore hides the dots beneath it at the centre and
reveals them at the edge, producing FR-094's soft boundary with no mask involved.

This is materially better than `mask-image` for this feature:

- It sidesteps FR-097's fallback problem almost entirely. There is no capability to detect and no
  degraded state to design, because gradients and layered backgrounds are universally supported.
- It cannot leak colour. FR-093 requires the clearing be an *absence*, never an added shape — and
  a gradient made of the page's own colour is, by definition, indistinguishable from absence.

One implementation caution: interpolating a colour to the keyword `transparent` is specified as
premultiplied in modern engines, but the safe form is an explicit zero-alpha value of the *same*
colour. The token contract therefore defines a zero-alpha companion per theme rather than relying
on the keyword.

**Alternatives considered**:

- *`mask-image` with a radial gradient.* The obvious approach, and the one the feature description
  assumed. Rejected once the layered-gradient approach was found to give the same visual result
  with better support and a simpler fallback story.
- *A separate absolutely-positioned `<div>` for the clearing.* Still needed for Story 3, because
  the clearing must be anchored to the needle's position inside the hero rather than to the page
  background's origin. But it carries the gradient, not a mask.

---

## R-004 — A fixed clearing, sized to contain the sway

**Decision**: The clearing does not animate and does not track the needle. It is sized to contain
the full sway arc.

**Rationale**: Settled in the specification at FR-095 after being raised as the feature's one open
question. The existing motif runs two independent continuous animations — `needle-sway` at 7s and
`thread-drift` at 10s, both defined in `globals.css`. Adding a third that must hold phase with
`needle-sway` for the life of the page introduces a failure mode with no upside: when they drift,
the clearing sits visibly offset from the needle, which reads worse than a needle sitting slightly
off-centre inside a generous, soft-edged clearing. A fixed clearing has nothing to desynchronise.

It also keeps FR-096 trivially true — this feature adds no continuous animation at all — which
means the existing `prefers-reduced-motion` block needs no new entry.

**Sway extent, measured from the existing keyframes**: `needle-sway` rotates between `-6deg` and
`-2deg` about a `50% 85%` origin. The clearing must cover the union of the motif's bounding box
across that 4-degree range, plus the `thread-drift` translation of up to 14px, plus the 24px blur
radius of the existing `thread-glow` drop shadow.

---

## R-005 — Enforcing the contrast floor with a test rather than a checklist

**Decision**: Add a fourth Vitest project, `theme`, that reads the token values and asserts the
WCAG ratios. Write it before the token correction and observe it fail.

**Rationale**: Principle II requires tests first for domain logic, and contrast arithmetic is
exactly the shape of thing that principle is designed around — plain data in, a number out, no
mocks, no DOM, no render harness. Expressing FR-084, SC-030 and SC-037 as an executable invariant
turns a one-time manual verification into a permanent one; the failure this research found would
have been caught at the moment it was introduced had the test existed.

The precedent is already in the repository. `vitest.config.ts` explains that the `messages` project
exists because catalogue parity "is neither domain logic nor a component" yet is the only thing
enforcing FR-059. Token contrast is the same shape of problem and gets the same treatment.

The test reads the values from `globals.css` rather than from a duplicated table, so the stylesheet
stays the single source of truth and the test cannot drift into asserting numbers nobody ships.

**Alternatives considered**:

- *Manual verification recorded in the checklist.* Rejected. It is what the project has been doing,
  and it is how four failing combinations reached production.
- *An automated accessibility audit in Playwright.* Complementary, not a substitute — it can only
  check rendered combinations that a test happens to visit, and it cannot check a token pairing
  that no current page uses but a future one will.
- *Extract tokens to TypeScript and generate the CSS from them.* A larger refactor that touches
  every themed surface. Deferred; nothing in this feature needs it.

---

## R-006 — Scope boundaries, and why the reading surfaces are excluded

**Decision**: The field covers the whole landing page. It does not reach the tool, the
documentation, or the research pages.

**Rationale**: The tool exclusion is the design system's own rule — it governs the tool as an
Operate-mode surface where "the task always outranks the atmosphere". The documentation and
research exclusion is the same reasoning applied to Read-mode surfaces: texture behind sustained
prose competes with the reading it is supposed to support.

Covering the full landing rather than only the hero avoids a texture that stops at the fold, which
reads as a rendering fault rather than a decision. The clearing, by contrast, exists only in the
hero, because that is the only place the needle exists.

**Alternatives considered**:

- *Hero viewport only.* Rejected; visible seam at the fold.
- *Every surface including documentation.* Rejected on the Read-mode grounds above. Revisitable as
  its own change if the reading experience is measured rather than assumed.

---

## R-007 — The rejected reference: a world map

**Decision**: The field's shaping derives from the needle-and-thread motif. No representational
silhouette, and specifically not a map.

**Rationale**: Recorded here because FR-089 states the prohibition but not the reason, and FR-100
requires the reasoning to reach `docs/decisions.md`. The reference image that prompted this feature
rendered the dots as a world map. Aguja is a debugger for retrieval systems; nothing about it is
geographic, and a map would be the only element on the page that carries no meaning — borrowed
atmosphere from a generic template. The product already owns a motif with meaning, and shaping the
field with it costs less than sourcing a silhouette asset while saying something true.

---

## Open items carried into implementation

**Visual confirmation is owed.** Every number in this document is computed and verifiable, and the
CSS techniques are standard, but no rendered screenshot was taken during planning — no browser
tooling was available in the session that produced it. The dot size, spacing and opacity that
satisfy "intentional texture, individually indistinct" (SC-036) are judgement calls that need eyes
on a real render in both themes. `quickstart.md` records how to check them, and the task list
treats the visual pass as a required step, not a formality.
