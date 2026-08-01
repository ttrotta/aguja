# Phase 1 Data Model: Landing Visual Rework

**Feature**: 004-landing-visual-rework | **Date**: 2026-07-30

This feature stores nothing and has no runtime state. Its "entities" are design tokens and the
derived values a test reads to hold them accountable. They are recorded here because the contrast
invariant needs a defined shape to assert against.

---

## Entity: ThemeTokens

The set of colour values one theme defines. Two instances exist: `dark` and `light`.

| Field | Type | Description |
|---|---|---|
| `pageBg` | hex colour | Outermost surface. What the dot field is drawn on. |
| `panelBg` | hex colour | The raised panel surface. |
| `panelInsetBg` | hex colour | Nested surface — sidebars, inputs. |
| `cardBg` | hex colour | Standalone cards on reading surfaces. |
| `text` | hex colour | Primary text. |
| `textMuted` | rgba colour | Secondary text, expressed as `text` at an opacity. |
| `violet` | hex colour | Primary action, current selection, thread motif. |
| `violetDeep` | hex colour | Hover and pressed fills only. Never text. |
| `warning` | hex colour | Errors, refusals, warnings only. |
| `dot` | rgba colour | **New.** The dot-field tone: `text` at low opacity. |
| `dotClear` | rgba colour | **New.** Zero-alpha `pageBg`, for the clearing gradient's outer stop. |

**Validation rules** — these are what the `theme` test project asserts:

1. `text` against each of `pageBg`, `panelBg`, `panelInsetBg`, `cardBg` ≥ **4.5:1**.
2. `textMuted`, composited over each of those four surfaces, ≥ **4.5:1** against that surface.
   *Four of the eight theme/surface combinations fail this today — see research R-001.*
3. `textMuted` and `text`, each measured against `dot` composited over `pageBg`, ≥ **4.5:1**.
   This is the worst case introduced by the field: a glyph landing directly on a dot.
4. `violet` as text against `pageBg`, `panelBg` and `panelInsetBg` ≥ **4.5:1**.
   *Already holds; asserted so it cannot regress, and because the design system records that it
   was got wrong once before.*
5. `violetDeep` is never asserted as text, because the design system restricts it to fills.
6. `dot` MUST derive from `text`, never from `violet`. This is the One Thread Rule (FR-082)
   expressed as an assertion rather than as a comment nobody runs.

**State transitions**: none. Tokens change only when the stylesheet is edited.

---

## Entity: DotField

The page-level background texture. Not a runtime object — a set of stylesheet values.

| Field | Type | Description |
|---|---|---|
| `tone` | reference | `ThemeTokens.dot` for the active theme. |
| `dotSize` | length | Diameter of one dot, in CSS pixels. |
| `spacing` | length | Distance between dot centres, in CSS pixels. Sets the repeat tile. |

**Validation rules**:

1. Expressed in CSS pixels, never in device pixels or viewport units, so apparent size is stable
   across display densities (SC-036).
2. Applies to the landing root only. Never to the tool, documentation, or research surfaces
   (FR-085, FR-086).
3. Occluded by any opaque raised surface drawn above it, with edges unweakened (FR-090).

---

## Entity: Clearing

The suppressed region of the field around the needle-and-thread motif. Exists only in the hero.

| Field | Type | Description |
|---|---|---|
| `centre` | position | Anchored to the motif's resting position within the hero. |
| `extent` | length | Radius at which the clearing has fully faded out. |
| `innerStop` | reference | `ThemeTokens.pageBg` — fully opaque at the centre. |
| `outerStop` | reference | `ThemeTokens.dotClear` — zero-alpha, same colour. |

**Validation rules**:

1. `extent` MUST cover the motif's bounding box across the full `needle-sway` range (−6° to −2°
   about a `50% 85%` origin), plus `thread-drift`'s 14px translation, plus the 24px `thread-glow`
   blur (FR-095).
2. Composed only of `pageBg` at varying alpha — never violet, never any other hue, and never with
   a glow (FR-093).
3. Static. No animation, no tracking of the sway (FR-095, FR-096).
4. Suppressed entirely at viewport widths where the hero recomposes and the needle moves, rather
   than left sitting over empty space (FR-098).

---

## Derived: ContrastRatio

Not stored. Computed by the `theme` test project from two colours.

| Input | Type |
|---|---|
| `foreground` | hex or rgba colour |
| `background` | hex colour |
| → output | ratio, `1.0` … `21.0` |

Where `foreground` carries alpha, it is composited over `background` before measurement — an rgba
text colour and the surface behind it are not two independent colours, and measuring them as if
they were is how the current defect went unnoticed.

Thresholds: **4.5:1** body text, **3:1** large text (≥24px regular, or ≥18.66px bold). This
feature asserts the body threshold for everything except the hero display heading, which qualifies
as large text at every viewport in its clamp range.
