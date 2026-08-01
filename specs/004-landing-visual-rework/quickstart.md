# Quickstart: Verifying the Landing Visual Rework

**Feature**: 004-landing-visual-rework | **Date**: 2026-07-30

How to confirm this feature works. Written to be run in order — the automated checks first, because
they are the ones that fail loudly, then the visual pass, because it is the one that needs eyes.

## Prerequisites

```bash
pnpm install
```

No other setup. This feature adds no dependency, no service, and no fixture.

---

## 1. The contrast invariant (the important one)

```bash
pnpm test --project theme
```

**Expected before the token correction**: fails, reporting the light theme's secondary text at
4.28:1 against the page, 4.49:1 against the panel, 4.30:1 against the panel inset, and 4.17:1
against the card — all below the 4.5:1 floor.

That failure is the point. It is a real pre-existing defect, not a fixture, and observing it fail
for that reason is what Principle II requires before the correction is written.

**Expected after**: passes. Every combination in [contracts/design-tokens.md](./contracts/design-tokens.md)
clears its threshold in both themes.

To see the measured numbers rather than only pass/fail:

```bash
pnpm test --project theme --reporter verbose
```

---

## 2. The full suite

```bash
pnpm test
pnpm typecheck
pnpm lint
```

All three must pass before any task is considered complete — `pnpm typecheck` is not hygiene here:
it is what enforces documentation parity between locales, and it is what catches a `heroTitle`
added to one catalogue and not the other.

`pnpm test` runs four projects once this feature lands: `domain`, `component`, `messages`, `theme`.

---

## 3. The headline (User Story 1)

```bash
pnpm dev
```

Then, at `http://localhost:3000`:

| Check | Expectation |
|---|---|
| `/en` | Largest text reads the product category, not the wordmark |
| `/es` | Same, in Spanish — no fallback to English |
| Navbar | Product name still present in the logo |
| Narrow the window to ~360px | Headline wraps without overlapping the needle or the dial |
| Read the supporting line | Adds information; does not restate the headline |

---

## 4. The dot field (User Story 2)

Still at `/en`, in both themes — the toggle is in the navbar.

| Check | Expectation |
|---|---|
| Dark theme | Dot texture visible against the near-black page |
| Light theme | Dots visible against the linen page, not washed out |
| Scroll the full page | Texture continues past the fold; no seam where the hero ends |
| Scroll performance | Smooth; no stutter attributable to the background |
| The problem section's evidence board | Fully opaque — no dots showing through, edges crisp |
| The footer | Same |
| Switch theme while watching | Dots change with the page; no flash of the previous theme |
| Open `/en/tool/chunks` | **No dots.** The tool is unchanged |
| Open `/en/docs` and `/en/news` | **No dots.** Unchanged apart from darker secondary text |

Confirm the no-extra-bytes requirement (SC-031) in DevTools → Network: reload the landing and check
that the request count and transferred size match what they were before the feature. There should
be no new entry of any kind — no image, no font, no stylesheet.

---

## 5. The clearing (User Story 3)

At `/en`, looking at the hero.

| Check | Expectation |
|---|---|
| Around the needle and thread | Dots noticeably thinner and fainter than elsewhere |
| The clearing's edge | Soft; no visible boundary between cleared and uncleared |
| The clearing's colour | An absence of dots — no violet halo, no tint, no glow |
| Watch one full sway cycle (7s) | The needle stays inside the clearing at both extremes |
| Narrow to mobile width | The clearing follows the needle, or is gone — never over empty space |

### Reduced motion

Set the OS preference to reduce motion, then reload:

- The needle, the thread, and the scroll cue all hold still — this is existing behaviour and must
  not regress.
- The clearing is still present and still correctly placed around the held frame.
- Nothing in the background is in motion; this feature adds no animation at all.

On Linux/GNOME:

```bash
gsettings set org.gnome.desktop.interface enable-animations false
```

Or, without touching OS settings, emulate it in Chrome DevTools:
**Rendering → Emulate CSS media feature `prefers-reduced-motion`**.

---

## 6. Texture quality (SC-036)

The judgement call, and the one no test covers. At each of ~1280px, ~1920px and a high-density
display, in both themes:

- Dots read as texture, not as individually countable circles.
- Dots do not blur into a flat tint that shifts the apparent page colour.
- The field reads as intentional rather than as a rendering artifact.

If any of those fail, adjust dot size, spacing, or alpha — then **re-run `pnpm test --project theme`**,
because changing the alpha changes the C-3 worst case.

---

## What "done" looks like

- [ ] `pnpm test`, `pnpm typecheck`, `pnpm lint` all pass
- [ ] The `theme` project was observed failing before the token correction, and passing after
- [ ] Sections 3–6 walked in both themes and both locales
- [ ] Network panel shows no new requests and no added bytes
- [ ] `DESIGN.md` updated (FR-099)
- [ ] `docs/decisions.md` has `D-015`, appended, superseding nothing (FR-100)
