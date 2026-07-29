# Phase 0 Research: Bilingual Shell and Documentation

**Date**: 2026-07-29 · **Feature**: [spec.md](./spec.md)

Five questions had to be settled before design. The first was settled by experiment rather than by
reading documentation, because getting it wrong would have shaped the whole feature around a false
assumption.

## Finding 1 — A locale segment remounts everything below it, and the session dies with it

FR-056 requires the pasted document, the loaded model, and any completed analysis to survive a
language switch. The concern was structural: the tool session lives in a React context mounted by
`src/app/tool/layout.tsx`, and putting a locale segment above it means switching language changes a
dynamic segment *above* the provider.

### Method

A probe was built with the same shape the real structure would have — a locale segment, a client
layout below it holding state in `useState`, and a page below that — then navigated between locales
with a client-side `<Link>`, exactly as a language switcher would. The provider held a `useRef` id
generated once per mount, so a changed id is direct evidence of a remount rather than an inference
from lost state.

A second run added a module-scope store and a module-scope "worker" stand-in alongside the React
state, to test whether anything survives.

### Result

| What | Before switch | After switch | Survived |
|---|---|---|---|
| Provider instance id | `c93ynn` | `ap7r4c` | **no — remounted** |
| React state (`useState`) | `"pasted document stand-in"` | `""` | **no** |
| Module-scope store | `"pasted document stand-in"` | `"pasted document stand-in"` | yes |
| Module-scope singleton id | `t5m2xy` | `t5m2xy` | yes |

The provider remounts. Everything held in React state or refs is destroyed.

This is worse than losing the text alone. `useEmbedder` creates its Worker in a mount effect and
calls `worker.terminate()` in the cleanup, so a remount also tears down the worker and
re-initialises the model. The 23 MB would come from HTTP cache rather than the network, but the
WASM session has to be built again and the visitor sits through the loading state a second time —
which FR-056 forbids in as many words.

### Decision

**Move session state out of the React tree**, rather than accept the loss and fall back to warning
the visitor.

- `documentContent` moves to a module-scope store, read through `useSyncExternalStore` so that
  components still re-render when it changes.
- The embedding cache moves from a `useRef` Map to a module-scope Map.
- The worker becomes a module-scope lazy singleton, created on first use and never terminated on
  unmount.

The probe confirms all three survive the remount that destroys React state.

### Rationale

The alternative the specification allows — let the work be lost, warn first — is cheaper to build
and worse to use. Losing a pasted document because you changed the interface language is a bad
trade in a tool whose entire premise is that you paste something and study it, and the warning
would fire on an action that has no reason to be destructive.

The refactor is bounded: two files (`ToolSession.tsx`, `useEmbedder.ts`) and the shape of what they
expose stays the same, so no tool page changes.

### Consequences

The worker is never terminated. That is the intended reading of "one loaded model for the lifetime
of a session" (FR-030, FR-031), not a leak introduced by accident — but it does mean the model
stays resident after the visitor navigates back to the landing page.

The worker MUST be created lazily, on first use, and MUST NOT be created at module import time.
Creating it at import would start a 23 MB download for every visitor who only ever sees the landing
page, which is exactly what D-002 spends its budget avoiding. Today laziness comes for free because
the provider only mounts under `/tool`; after this change it has to be deliberate.

Module-scope state persisting across a *reload* is not a concern — a reload creates a new module
context, so the no-persistence decision (D-005) is unaffected. This survives navigation, not
refreshes.

## Finding 2 — Typed message keys do not catch a missing translation

D-014 chose a library partly on the strength of typed keys catching drift between catalogues. That
claim needs narrowing before it is designed against.

next-intl's TypeScript augmentation types the *usage* — referencing a key that exists in no
catalogue is a compile error. It does not verify that the Spanish catalogue contains every key the
English one has, because the types are generated from one catalogue treated as the source of
truth. A key present in English and missing in Spanish therefore type-checks and fails at runtime,
producing exactly the silent fallback FR-059 forbids.

**Decision.** Typed keys handle wrong-key errors; a **parity test** handles missing-key errors. A
unit test loads both catalogues and asserts their key sets are identical, failing with the
offending keys named.

**Rationale.** The test is trivial, deterministic, needs no framework, and closes the actual gap.
Choosing the library is still correct — it carries locale routing, formatting, and the wrong-key
half — but the plan should not pretend it delivers the parity half.

**Consequence.** D-014's reasoning is narrowed, not reversed. No decision entry is needed: the
decision (use the library) stands, and this refines how one of its benefits is realised.

## Finding 3 — Documentation parity can be enforced by the type system

Documentation is the largest body of prose in the feature and the most likely to drift between
languages. Three storage options were considered:

| Option | Parity enforcement | Cost |
|---|---|---|
| Long prose in JSON message catalogues | Parity test only | Escaping and formatting long text in JSON is miserable |
| MDX files per locale | Filename convention, checked by test at best | A new dependency and a build integration, for one page |
| A typed section record per locale | **Compile time** | No new dependency; prose lives in TypeScript |

**Decision.** Documentation content lives in one module per locale, each exporting a
`Record<DocSectionId, DocSection>` over a shared union of section ids.

**Rationale.** A missing section in either language stops being a review problem and becomes a type
error — TypeScript requires every key of the union to be present. Section *order* is likewise
shared, because order is derived from one exported list of ids rather than from the order keys
happen to appear in each file. That is FR-069 and SC-025 enforced by construction rather than by
diligence.

**Alternative rejected.** MDX reads better for authoring long prose, and if the documentation grows
several times larger that trade may flip. For one page in two languages it adds a dependency and a
build step to solve a problem the type system already solves.

## Finding 4 — Locale routing is domain logic, and belongs in a feature

Swapping the locale in a path, validating a locale, and building a localised path are pure string
operations over plain data. They are also the part most likely to be duplicated across twelve
`e2e` files and every internal link.

**Decision.** A `localization` feature under `src/features/`, with a framework-free `domain/`
holding the locale list and path functions, and a `ui/` holding the switcher.

**Rationale.** Screaming Architecture asks for folders named after the problem, and presenting the
application in more than one language is a problem, not a technical role — so this avoids inventing
a `lib/` or `utils/` home for it. Because the path functions are pure, Principle II applies
normally: they get tests first, asserting exact strings, with no render harness and no worker.

The `e2e` suite consumes the same helper, so the twelve hardcoded paths collapse to one source of
truth. `playwright.config.ts` already sets `baseURL`, so only the path prefix was ever the problem.

## Finding 5 — The English-only notice has four surfaces, and one place to say it

FR-062 requires the notice to be legible without interaction "wherever a document is accepted or
scores are shown". Enumerated, that is: the document input (chunk inspection and strategy
comparison), ranked retrieval results, sensitivity results, and confusable pairs.

**Decision.** State it once, persistently, in the tool shell that all four tools already share,
rather than repeating a banner inside each results component.

**Rationale.** Every surface FR-062 names lives inside the tool session shell, so one placement
covers all of them and cannot fall out of sync. Repeating it four times would be four chances for
one copy to drift and four banners on screen at once.

**Presentation.** Reuse the callout already established for the chunk-cap notice in
`ConfusablePairs` — a bordered inset strip with a warning glyph. This respects the craft floor,
which bans coloured left or right borders above 1px on cards and callouts; the codebase's existing
emphasis pattern is a top border (`border-t-2 border-violet`), and the warning variant uses a full
`border-warning/50` with an inset background.

**One deviation from D-013, recorded deliberately.** D-013 says the notice is "most prominent on
`/es`". The plan gives both locales identical treatment. Asymmetric prominence is hard to justify
once written down — an English reader pasting a German document is misled by exactly the same gap —
and it would mean maintaining two visual treatments of one sentence. FR-061 and FR-062 require it
visible in both, which equal treatment satisfies. D-013's phrasing was about why the risk is
sharpest in Spanish, not a requirement that English be served worse.

## Open items for implementation

1. **The RAG primer must be written from current sources.** The specification records this as an
   assumption. Knowledge of the retrieval field carries a training cutoff earlier than this
   feature's date; the primer is the one part of the documentation where writing from memory risks
   shipping something quietly out of date. Check current references while writing it.
2. **Confirm the worker survives a locale switch in the real application**, not only in the probe.
   The probe used a module-scope stand-in, not an actual `Worker` with a WASM session. The
   mechanism is the same, but the first tool built on the refactor should verify it directly.
