# Contract: Design Tokens and the Contrast Floor

**Feature**: 004-landing-visual-rework | **Date**: 2026-07-30

This project's externally visible interface is its rendered UI, so its contract is the visual one:
the token values, and the invariants any change to them must preserve. This document is the
authority the `theme` test project encodes.

`DESIGN.md` remains the authority on *intent* — what the world looks like and why. This file is
narrower: it states what must hold numerically, in a form a test can assert.

---

## 1. Token surface

Declared in `src/app/globals.css`, once per theme, under `:root` (dark) and `:root.light`.

### Existing tokens — unchanged by this feature

| Token | Dark | Light |
|---|---|---|
| `--color-page-bg` | `#0e0b14` | `#e9e2d3` |
| `--color-panel-bg` | `#17121f` | `#f3eee3` |
| `--color-panel-inset-bg` | `#1d1728` | `#ebe4d5` |
| `--color-card-bg` | `#1d1728` | `#e4dcc8` |
| `--color-text` | `#f2eff5` | `#211d1b` |
| `--color-violet` | `#a970ff` | `#7a3fc2` |
| `--color-violet-deep` | `#7c3aed` | `#6b3fa0` |
| `--color-warning` | `#ff7a66` | `#a83c32` |

### Corrected by this feature

| Token | Dark | Light | Change |
|---|---|---|---|
| `--color-text-muted` | `rgba(242,239,245,0.62)` | `rgba(33,29,27,0.72)` | Light raised from `0.62`. Dark unchanged. |

### Added by this feature

| Token | Dark | Light | Purpose |
|---|---|---|---|
| `--color-dot` | `text` at low alpha | `text` at low alpha | The dot-field tone. |
| `--color-dot-clear` | `rgba(14,11,20,0)` | `rgba(233,226,211,0)` | Zero-alpha page colour, the clearing gradient's outer stop. |

Exact dot alpha is set during implementation within the range the invariants below permit, and
confirmed on a real render (SC-036).

---

## 2. Invariants

Each is asserted by the `theme` Vitest project. A change that breaks one fails the suite.

### C-1 — Primary text clears AA on every surface

`text` against `page-bg`, `panel-bg`, `panel-inset-bg`, `card-bg` — **≥ 4.5:1**, both themes.

*Status: holds today. Asserted to prevent regression.*

### C-2 — Secondary text clears AA on every surface

`text-muted`, composited over the surface, against that surface — **≥ 4.5:1**, both themes.

*Status: **fails today** in the light theme on all four surfaces (4.28, 4.49, 4.30, 4.17). This
is the red state the correction turns green.*

### C-3 — Text clears AA against a dot

`text` and `text-muted` against `dot` composited over `page-bg` — **≥ 4.5:1**, both themes.

This is the worst case the field introduces. A dot is small, but a glyph stroke can land squarely
on one, and the honest floor is the worst pixel rather than the average.

### C-4 — Violet clears AA as text

`violet` against `page-bg`, `panel-bg`, `panel-inset-bg` — **≥ 4.5:1**, both themes.

*Status: holds today at 5.99, 5.36 and above. Asserted because the design system records that this
was got wrong once: the check was run against the wrong, more lenient surface and passed while the
real pairing sat at 4.49.*

### C-5 — `violet-deep` is never text

Not asserted as a text colour, in either theme. It is restricted to hover and pressed fills; as
text on a dark surface it measures about 3.06:1. The invariant is the restriction itself.

### C-6 — The dot tone derives from text, never from violet

The One Thread Rule (FR-082), as an assertion rather than a comment. Violet means primary action,
current selection, or the thread motif. A violet dot field would spend it on decoration.

### C-7 — The clearing introduces no colour

The clearing's stops are `page-bg` and `dot-clear` — the same colour at full and zero alpha. No
third colour, no glow (FR-093).

---

## 3. Measurement rules

Getting these wrong is how the current defect survived review.

1. **Composite before measuring.** An `rgba` foreground and its background are not independent
   colours. Composite the foreground over the background, then measure the result against that
   same background.
2. **Measure against the real surface.** A token used on four surfaces is checked against all
   four, not against the most flattering one.
3. **Use the WCAG 2.1 relative-luminance formula**, with the sRGB linearisation step — not a
   perceptual-lightness shortcut, and not an eyeball comparison.
4. **Body threshold is the default.** 3:1 applies only where the text is genuinely large: ≥24px
   regular or ≥18.66px bold. In this feature that is the hero display heading and nothing else.
   Notably, the hero's supporting line at 20px and the walkthrough's labels at 10px both take the
   4.5:1 bar.

---

## 4. What this contract does not cover

- Dot size and spacing. Bounded by SC-036 but chosen by eye on a real render; no numeric invariant
  would capture "reads as texture, not as polka dots".
- The clearing's extent. Derived from the motif's animation geometry (data-model, Clearing rule 1)
  rather than from a contrast figure.
- Anything outside the landing. The tool, documentation, and research surfaces are covered by C-1
  through C-5, which are global, but this feature adds no visual treatment to them.
