---
description: "Task list for 004-landing-visual-rework"
---

# Tasks: Landing Visual Rework

**Input**: Design documents from `/specs/004-landing-visual-rework/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/design-tokens.md](./contracts/design-tokens.md),
[quickstart.md](./quickstart.md)

**Tests**: **Required, not optional.** The template treats test tasks as opt-in; this project's
constitution does not. Principle II is NON-NEGOTIABLE and demands tests written first, run, and
*observed to fail for the intended reason* before implementation. The task order below encodes
that literally — every red state has its own task, because a test that has never failed has
proven nothing.

**Organization**: Grouped by user story so each ships independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel — different files, no dependency on an incomplete task
- **[Story]**: US1, US2, US3 — maps to the user stories in spec.md
- Every task names the exact file it touches

## Path Conventions

Single Next.js project. Source under `src/`, specs under `specs/`, config at repository root.

---

## Phase 1: Setup

**Purpose**: Make a home for the contrast invariant before anything depends on it.

- [x] T001 Add a fourth Vitest project named `theme` to `vitest.config.ts`, environment `node`,
      including `src/app/theme/**/*.test.ts`. Follow the comment style of the existing `messages`
      project and record *why* it is its own project: token contrast is neither domain logic nor a
      component, and folding it into `domain` would dilute what that project's name asserts.

**Checkpoint**: `pnpm test --project theme` runs and reports no tests, without erroring.

---

## Phase 2: Foundational (BLOCKING)

**Purpose**: Build the measuring instrument, verify the instrument itself, then use it to expose
and fix the pre-existing contrast defect.

**Why blocking**: FR-101 requires the light-theme secondary-text correction to land *before* the
dot field is introduced. The field lowers effective contrast, so building it on an already-failing
token would bury the defect instead of fixing it. No user story may start until T007 is green.

### Verify the instrument before trusting it

- [x] T002 Write `src/app/theme/contrast.test.ts` with calibration cases only — black on white is
      21:1, white on white is 1:1, and at least two published WCAG reference pairs. Fails because
      the module under test does not exist yet.
- [x] T003 Run `pnpm test --project theme` and **observe T002 fail** for the intended reason
      (missing module, not a config fault). Record the observation.
- [x] T004 Implement `src/app/theme/contrast.ts`: sRGB linearisation, WCAG 2.1 relative luminance,
      contrast ratio, and alpha compositing of a foreground over a background. Pure arithmetic —
      plain data in, a number out. Calibration goes green.

### Expose the real defect

- [x] T005 Implement `src/app/theme/tokens.ts` to read the token values out of
      `src/app/globals.css` for both themes, parsing hex and `rgba()` forms. The stylesheet stays
      the single source of truth; do not duplicate the values into TypeScript, or the test will
      eventually assert numbers nobody ships.
- [x] T006 Extend `src/app/theme/contrast.test.ts` with invariants **C-1**, **C-2**, **C-4** and
      **C-5** from [contracts/design-tokens.md](./contracts/design-tokens.md). Composite every
      `rgba` foreground over its surface before measuring — measuring them as independent colours
      is precisely how the current defect survived review.
- [x] T007 Run `pnpm test --project theme` and **observe C-2 fail** against the real defect:
      light-theme secondary text at 4.28:1 on `page-bg`, 4.49:1 on `panel-bg`, 4.30:1 on
      `panel-inset-bg`, 4.17:1 on `card-bg`. This is the red state Principle II requires. Confirm
      the dark theme passes and C-1, C-4, C-5 pass.

### Fix it

- [x] T008 In `src/app/globals.css`, raise `--color-text-muted` in the `:root.light` block from
      `0.62` to `0.72` alpha. **Do not touch the `:root` (dark) value** — it measures 6.5–6.9:1 and
      FR-101 explicitly excludes it.
- [x] T009 Run `pnpm test --project theme` and confirm every invariant is green. Then run
      `pnpm test && pnpm typecheck && pnpm lint` to confirm nothing else regressed.

**Checkpoint**: The contrast floor is executable and holds. FR-101, FR-102, SC-037 satisfied.

---

## Phase 3: User Story 1 — Learn what the product is (P1) 🎯 MVP

**Goal**: The largest text on the landing names the product category, in both languages.

**Independent test**: Load `/en` and `/es` with no prior knowledge and confirm the largest text
says what the tool *is*, not what it is *called*.

**Note on starting state**: this story is already implemented in the working tree, written before
its specification existed. It is not treated as done. Per spec Dependencies, where the
specification and the implementation disagree, the implementation is what changes.

- [x] T010 [P] [US1] Write `src/app/_components/LandingHero.test.tsx`: the heading renders from
      the message catalogue rather than a hardcoded string, and renders the correct value under
      each locale. Must fail if the component is reverted to a literal.
- [x] T011 [US1] Reconcile `src/app/_components/LandingHero.tsx` against FR-076 through FR-080 —
      heading states the category, is catalogue-driven, and its size does not break the two-zone
      composition. Change the code, not the requirement, on any disagreement.
- [x] T012 [P] [US1] Confirm `landing.heroTitle` and the trimmed `landing.heroBody` are present and
      correct in both `src/messages/en.json` and `src/messages/es.json`. Key parity is already
      enforced by `src/messages/parity.test.ts`, so verify *content*, not presence — that
      `heroBody` no longer restates the heading (FR-078).
- [x] T013 [US1] Walk [quickstart.md](./quickstart.md) §3 in both locales, including the ~360px
      width check for FR-079.

**Checkpoint**: US1 ships on its own. SC-029, SC-035 satisfied.

---

## Phase 4: User Story 2 — A page with material presence (P2)

**Goal**: The landing carries a dot texture instead of one flat plane, in both themes, without
reaching any other surface.

**Independent test**: Load the landing in both themes, confirm visible texture and that all text
still clears its contrast floor. Ships without Story 3.

**Depends on**: Phase 2 (the field lowers effective contrast; the floor must already hold).

- [x] T014 [US2] Add `--color-dot` and `--color-dot-clear` to both theme blocks in
      `src/app/globals.css`, and expose them through the `@theme inline` block so Tailwind
      generates utilities for them. `--color-dot` derives from `--color-text`; `--color-dot-clear`
      is the zero-alpha form of that theme's `--color-page-bg`.
- [x] T015 [US2] Extend `src/app/theme/contrast.test.ts` with invariants **C-3** (text and
      secondary text against a dot composited over the page) and **C-6** (the dot tone derives
      from text, never from violet — the One Thread Rule as an assertion). Run it; C-3 constrains
      the alpha chosen in T016.
- [x] T016 [US2] Implement the field in `src/app/globals.css` as a repeating `radial-gradient`
      sized by `background-size`, in CSS pixels so apparent size is stable across display
      densities (SC-036). Choose dot size, spacing and alpha within the range C-3 permits.
- [x] T017 [US2] Apply the field to the landing root in `src/app/[locale]/page.tsx` — the landing
      only. Do not put it on `body`, which would reach every route and violate FR-085 and FR-086.
- [x] T018 [US2] Verify occlusion (FR-090): confirm `ProblemEvidenceBoard`, `ClosingCta` and
      `Footer` still fully hide the field behind them with edges unweakened. These already use
      opaque surface tokens; this is a check, not an expected change.
- [x] T019 [US2] Walk [quickstart.md](./quickstart.md) §4 — both themes, theme-switch with no
      flash, and explicit confirmation that `/en/tool/chunks`, `/en/docs` and `/en/news` carry no
      field.
- [x] T020 [US2] Confirm SC-031 in DevTools → Network: reload the landing and verify the request
      count and transferred bytes are unchanged. Any new entry means the field became an asset,
      which FR-087 forbids.

**Checkpoint**: US2 ships. FR-081 through FR-091, SC-030, SC-031, SC-036 satisfied.

**Reworked 2026-07-30, six times** (checkmarks above still hold — the story, not the
implementation, is what they certify):

*First rework* — after seeing this on the real page, the user asked for bigger, irregular dots
instead of the uniform 1px grid, and for the field to reach every route instead of the landing
only. T014–T020 above describe the *original* implementation (single `radial-gradient`, landing-
scoped `.dot-field` class). What shipped: a hand-placed SVG tile of 14 circles at irregular
positions and sizes, as `background-image` on `body` directly (site-wide), dot alpha 0.06 → 0.18,
`tokens.ts`'s `--color-dot-clear` removed (dead once the clearing reverted). D-016.

*Second rework* — rejected the same day against a second reference image. The randomness the user
wanted was in dot *size*, not position: what shipped now is a regular 22×11 grid (12px spacing,
264×132 tile) where every dot sits at a fixed position and only radius varies, driven by distance
to four fixed seed points — a halftone effect, not a scatter. Alpha moved to 0.19 (a value computed
for this pattern, coincidentally close to the last one). D-017 (supersedes D-016 on pattern
technique only; the site-wide scope from D-016 stands).

*Third rework* — liked in principle, same day: grid alignment and size variation were both
confirmed right. What wasn't: the blobs were smooth radial circles, and the user wanted something
"freestyle," like invented continents, plus said the field still read as an obviously repeating
tile. Shipped: landmass edges now vary by angle (sine-harmonic perturbation, not constant radius),
giving actual coastlines — bays, peninsulas, asymmetry. Tile grew 22×11 → 34×17 (264×132px →
408×204px), 6 landmasses each with a distinct harmonic set so none repeat the same shape, 578
circles per theme. This has a real, disclosed cost: ~20KB raw SVG per theme, ~9.4KB gzipped for
both combined — measured against `globals.css`'s actual compressed size, not assumed zero as
FR-087 originally claimed. D-018 (supersedes D-017 on shape only, and FR-087's byte claim).

*Fourth rework* — six landmasses of similar size covered over 95% of the tile with some size bump,
measured after the fact; the user's complaint was density and contrast, not shape ("veo como muchas
manchas"). Shipped: three landmasses instead of six, sized with real contrast (radius 7.2 / 3.6 /
2.0 cells — one dominant, one mid, one small), positioned so 63% of grid cells now carry no size
influence at all. Toroidal (wrapping) distance added at the same time — not requested, but required
once the dominant landmass's coastline could reach ~12 cells from center in the worst harmonic case,
close enough to clip against the 34-cell tile edge without it. Tile dimensions and circle count
unchanged (408×204px, 578 circles); payload moved by rounding only (~9.4KB gzipped → ~8.9KB). D-019
(supersedes D-018 on landmass count/sizing only; the coastline technique itself stands).

*Fifth rework* — the user named the actual root cause directly: the tile itself repeats visibly,
counted as "5 columns" of identical shapes at their screen width. None of reworks two through four
had touched tile *size*, only its contents — no amount of internal variety fixes a repeat interval
smaller than the viewport. Measured three tile-size/spacing candidates for gzip cost with synthetic
data before designing any real landmass, specifically to avoid shipping an unmeasured payload.
Shipped: tile grew 34×17 → 86×25 (408×204px → 1720×500px, close to a full desktop viewport wide),
7 landmasses spread across the full width (up from 3), 2150 circles per theme (up from 578), 77%
of cells still genuinely empty (up from 63% — D-019's contrast requirement preserved, not
sacrificed for the larger canvas). Payload real and disclosed: ~19.75KB gzipped total
(`globals.css`), up from ~8.9KB — checked against the file's actual compressed size, not estimated,
both before and after patching. D-020 (supersedes D-019 on tile dimensions only).

*Sixth rework* — the rich pattern was finally right, but the user only ever wanted it on the
landing; every other route should fall back to something small and uniform. Shipped: `body` reverts
to the original pre-SVG `radial-gradient` technique (small uniform dots, near-zero cost) as the
default on every route; a new `.dot-field-landing` class, applied only to the landing's `<main>` in
`src/app/[locale]/page.tsx`, overrides that default with the rich pattern. Verified via served HTML
that the class appears only on `/en`, not on `/en/tool/chunks`, `/en/docs`, or `/en/news`.

This surfaced two things worth recording precisely because they were caught rather than shipped
silently. First, a claim made and corrected in the open: byte-checking the actually-served CSS chunk
across all four routes showed identical file, identical size — Next.js bundles `globals.css` once
for the whole app, so scoping the rich pattern to a class does not stop other routes from
downloading it, contrary to what was first reported as a benefit. Presented to the user as an
explicit choice (leave the shared ~19.5KB-gzipped bundle as-is, paid once per session and cached; or
add a route-scoped CSS Module to split it for real) — the user chose to leave it. Second, a real
defect: the first version of `.dot-field-landing` set `background-image` but not
`background-color`, so `body`'s own small-dot gradient showed through the rich pattern's empty
regions (63–77% of its area across recent revisions) — the two tiers visibly mixed on the landing,
reported directly ("veo una mezcla"). Fixed by giving the class its own opaque
`background-color: var(--color-page-bg)`. D-021 (supersedes D-016 on scope, partially — some field
still reaches every route, but only the landing gets the rich one).

Re-verified after each rework: `theme` project (63 tests), full suite (188 tests), typecheck, lint,
and the full e2e suite (17 passed, 1 honest skip) all green against the current version. See
spec.md's amendments (FR-103–FR-107, FR-108, FR-109–FR-111, FR-112, FR-113–FR-114, then FR-115–
FR-117) for the requirements this now satisfies instead of FR-085/FR-086/FR-105/FR-087's byte
claim/original SC-036/SC-031.

---

## Phase 5: User Story 3 — The field belongs to the needle (P3)

**Goal**: The dots part around the needle and thread, so the background is part of the motif
rather than a layer behind it.

**Independent test**: Load the hero and confirm the field is visibly thinner and fainter around
the motif while staying uniform elsewhere.

**Depends on**: Phase 4 (there is nothing to clear until the field exists).

**Reverted 2026-07-30**: T021–T024 were implemented, verified (188 tests, full e2e suite, compiled
CSS confirmed), and shipped — then rejected on sight. Not a bug: the user saw it rendered and
didn't like the result. Reverted in full; `BigNeedle` is back to its pre-Phase-5 form. Superseded
by a broader redesign of the field itself (bigger, irregular dots, closer to the reference image)
that folds this story's fate into that redesign rather than treating it as a separate retry.

- [ ] T021 [US3] Derive the clearing's extent from the motif's real geometry in
      `src/app/globals.css`: `needle-sway` rotates −6° to −2° about a `50% 85%` origin,
      `thread-drift` translates up to 14px, and `thread-glow` adds a 24px blur. The clearing must
      cover the union of all three so the needle never leaves it (FR-095). Record the derived
      number in a comment.
- [ ] T022 [US3] Add the clearing layer to `src/app/_components/LandingHero.tsx` as an absolutely
      positioned element anchored to the needle, carrying a `radial-gradient` from
      `--color-page-bg` to `--color-dot-clear`. A gradient of the page's own colour, not a mask —
      see [research.md](./research.md) R-003. This satisfies FR-093's "absence, not a shape" by
      construction and needs no capability fallback.
- [ ] T023 [US3] Handle FR-098 in `src/app/_components/LandingHero.tsx`: at widths where the hero
      stacks and the needle moves, the clearing follows it or is suppressed. Never left sitting
      over empty space.
- [ ] T024 [US3] Confirm FR-096: verify no new `@keyframes` or `animation` was added by this
      feature, and that the existing `prefers-reduced-motion` block in `src/app/globals.css` needs
      no new entry. If either is false, the fixed-clearing decision in FR-095 was not implemented.
- [ ] T025 [US3] Walk [quickstart.md](./quickstart.md) §5 — one full 7s sway cycle with the needle
      staying inside the clearing, soft edge, no violet halo, and the reduced-motion check.

**Checkpoint**: US3 ships. FR-092 through FR-098, SC-033 satisfied.

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: Pay the documentation debts the feature owes, and verify the whole thing.

- [x] T026 [P] Update `DESIGN.md` per FR-099. It is the visual authority and currently describes a
      background this feature replaces. Amend the Layout section's landing description and add the
      dot field and clearing to the component vocabulary. Keep the One Thread Rule and the Earned
      Glow Rule intact — this feature strengthens both rather than bending them.
- [x] T027 [P] Append `D-015` to `docs/decisions.md` per FR-100, in the established
      Date/Status/Context/Decision/Why/Consequences shape. Record why the field is shaped by the
      needle-and-thread motif and why the world-map reference was rejected as off-metaphor
      ([research.md](./research.md) R-007). **Append only** — supersede nothing, edit nothing.
- [x] T028 [P] Consider appending a second decision entry for the contrast correction, or fold it
      into D-015. The constitution requires a decision entry for amendments touching Principles
      III–V or Technology Constraints; this touches none, so it is a judgement call — but a
      light-theme token that failed AA against every surface for three features is worth a reader
      being able to reconstruct.
- [x] T029 Update `CLAUDE.md` if the new `src/app/theme/` folder or the fourth Vitest project
      changes what a future agent needs to know. The constitution requires `CLAUDE.md` be kept
      consistent; the "Vitest runs three projects" line is now wrong.
- [x] T030 Run the full gate: `pnpm test && pnpm typecheck && pnpm lint`. All four Vitest projects
      green. No task is complete while the suite is red.
- [x] T031 Walk [quickstart.md](./quickstart.md) end to end, including §6's texture-quality
      judgement at ~1280px, ~1920px and high density. If §6 forces an alpha change, **re-run
      `pnpm test --project theme`** — changing the dot alpha changes the C-3 worst case.

---

## Dependencies

```text
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ─── BLOCKING ─── contrast floor must hold before any field exists
    ↓
    ├─────────────────┬──────────────────┐
    ↓                 ↓                  │
Phase 3 (US1)    Phase 4 (US2)           │  US1 is independent of US2/US3;
  headline         dot field             │  it may ship at any point after Phase 2
    │                 ↓                  │
    │            Phase 5 (US3)           │
    │              clearing              │
    └─────────────────┴──────────────────┘
                      ↓
              Phase 6 (Polish)
```

**Hard ordering**:

- T003 before T004, T007 before T008 — the red must be observed before the fix (Principle II).
- Phase 2 before Phase 4 — FR-101 requires the correction to precede the field.
- Phase 4 before Phase 5 — nothing to clear until the field exists.
- T015 before T016 — C-3 sets the alpha budget the field must fit inside.

**Not ordered**: Phase 3 against Phase 4. US1 touches the heading and catalogues; US2 touches the
stylesheet and the page root. They do not collide.

## Parallel Opportunities

- **Phase 3**: T010 and T012 — different files (`LandingHero.test.tsx`, the two catalogues).
- **Phase 6**: T026, T027 and T028 — `DESIGN.md` and `docs/decisions.md` are independent of each
  other and of the code.
- **Across phases**: all of Phase 3 can run alongside Phase 4 once Phase 2 is green.

Nothing inside Phase 2 is parallel. It is a strict red-green chain by design.

## Implementation Strategy

**MVP is Phase 1 + Phase 2 + Phase 3.** That ships a landing that says what the product is and a
light theme that meets AA for the first time. It is genuinely shippable and genuinely valuable
without a single dot existing.

**Increment 2 is Phase 4** — the uniform field. Research R-002 is explicit that this delivers most
of the perceived quality for a fraction of the work.

**Increment 3 is Phase 5** — the clearing. The distinctive part, and the only part carrying real
technical risk.

Phase 6 is owed at whichever increment lands last, not deferred indefinitely. `DESIGN.md`
describing a background the app no longer has is exactly the drift the constitution's paper-trail
principle exists to prevent.

## Task Count

| Phase | Tasks | Story |
|---|---|---|
| 1 — Setup | 1 (T001) | — |
| 2 — Foundational | 8 (T002–T009) | — |
| 3 — Headline | 4 (T010–T013) | US1 |
| 4 — Dot field | 7 (T014–T020) | US2 |
| 5 — Clearing | 5 (T021–T025) | US3 |
| 6 — Polish | 6 (T026–T031) | — |
| **Total** | **31** | |
