# Data Model: Bilingual Shell and Documentation

**Date**: 2026-07-29 · **Feature**: [spec.md](./spec.md) · **Research**: [research.md](./research.md)

Nothing here is persisted. Everything below lives for the lifetime of a page load, which is what
D-005 requires and what this feature must not quietly change.

## Locale

The set of supported interface languages.

| Field | Type | Notes |
|---|---|---|
| `code` | `"en" \| "es"` | Appears in the address. The union is the single source of truth for what is supported. |
| `label` | `string` | Shown in the switcher, written in its own language ("English", "Español"), never translated. |

**Why a union and not a string**: FR-058 forbids rendering a partially translated interface for an
unsupported language. If the type admits any string, that check has to be remembered at every
boundary; as a union it is a compile error to forget one, and one runtime guard at the routing edge
covers requests arriving from outside.

**`en` is the fallback.** A request naming no locale, or an unsupported one, resolves to English
(spec Assumptions). The label is deliberately not translated — a Spanish speaker looking for their
language scans for "Español", not for "Spanish" rendered in the language they cannot read.

## Message catalogue

One complete set of interface strings per locale.

| Field | Type | Notes |
|---|---|---|
| `key` | nested string path | Grouped by surface (`nav.*`, `footer.*`, `tools.*`, `notice.*`). |
| `value` | `string` | The translated copy. |

**Parity is a test, not a type** (research.md Finding 2). Typed keys catch a reference to a key
that exists nowhere; they do not catch a key present in English and missing in Spanish, because
the types come from one catalogue treated as the source. A unit test asserts both key sets are
identical and names the offenders when they are not. That test is what enforces FR-059, and it is
the only thing that does.

## Documentation section

One unit of documentation content, existing once per locale.

| Field | Type | Notes |
|---|---|---|
| `id` | `DocSectionId` | Union: the primer, one per tool, the troubleshooting path, the concepts section. |
| `title` | `string` | Per locale. |
| `body` | renderable content | Per locale. Prose, examples, and any inline emphasis. |

**Order lives outside the content.** A single exported ordered list of `DocSectionId` defines the
sequence, and both locales render from it. Two files cannot disagree about order because neither
file expresses order.

**Parity is a type** (research.md Finding 3). Each locale exports `Record<DocSectionId, DocSection>`,
so omitting a section is a compile error rather than a review miss. This is what makes FR-069 and
SC-025 structural instead of aspirational.

## Tool session (changed)

Not a new entity — the existing session, relocated. Its externally visible shape is unchanged, so
no tool page is affected.

| Field | Type | Before | After |
|---|---|---|---|
| `documentContent` | `string` | `useState` in the provider | module-scope store, read via `useSyncExternalStore` |
| embedding cache | `Map<string, Embedding>` | `useRef` in the provider | module-scope `Map` |
| worker | `Worker` | created in a mount effect, terminated on cleanup | module-scope lazy singleton, never terminated |

**Why it moved**: a locale segment above the provider remounts it, destroying React state and
tearing down the worker (research.md Finding 1, measured). Module scope survives that remount;
React state does not.

**Invariant that must not be lost in the move**: setting a new document still clears the embedding
cache. Chunk text from a previous document can never be requested again, and keeping it would let a
stale vector answer for text that happens to match — the exact-match cache key exists to prevent
that (FR-032).

**Invariant the move introduces**: the worker MUST be created on first use, never at module import.
Import-time creation would start the model download for visitors who only ever see the landing
page, which D-002's whole budget argument forbids.

## What this feature does not touch

`Chunk`, `Embedding`, `RankedResult`, `PhrasingProfile`, `ConfusablePair`, and every other domain
type are unchanged, and no field of any of them becomes locale-aware. Chunking, similarity,
ranking, and ordering produce byte-identical results in both languages — FR-060, and Principle III
independently.
