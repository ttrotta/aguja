# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Developers building retrieval-augmented (RAG) systems, using desktop browsers. They arrive
because a passage in their own real system is not being retrieved and they need to see why.
Mobile is explicitly not a v1 target.

## Product Purpose

Aguja is a debugger for retrieval systems. It answers one question — *why doesn't my retrieval
find this passage?* — by making chunk boundaries and ranking behavior visible: paste a document,
see how it is split, run a query, see which chunks come back with scores and ranks.

## Positioning

Aguja is a debugger, not a retriever: its job is to explain *relative* ranking behavior, never to
be the best search engine. No neighboring product surfaces chunk-boundary and truncation failures
as first-class, explicit findings the way this tool does (FR-017, SC-010).

## Operating Context

Core workflow: paste a plain-text document → pick one of four chunking strategies and set its
parameters → see chunk boundaries redrawn live over the document → optionally submit a query,
which embeds every chunk and the query locally and returns a ranked, scored list → optionally
select a second strategy to compare both rankings side by side against the same document and
query → optionally export a shareable summary image (generated on-device, never uploaded).

State is session-scoped only: no login, no saved sessions, and the user is warned before losing
work on reload or tab close (D-005). Nothing pasted ever leaves the browser.

## Capabilities and Constraints

- Exactly four chunking strategies: fixed size by characters, fixed size with overlap, by
  paragraphs, by tokenization units. The first three work with no model loaded; "by tokenization
  units" depends on the model's own tokenizer (FR-011).
- All embedding inference runs locally via Transformers.js (`Xenova/all-MiniLM-L6-v2`, quantized,
  D-006), on a pinned WASM backend for cross-run determinism (D-007). No API key, account, or
  server-side inference exists or may be introduced (Constitution Principle V).
- Document size is capped at 50,000 characters; the cap is enforced, never silently truncated.
- The model is English-only. Non-English documents are not blocked, but the interface must state
  that their scores are not trustworthy (FR-026).
- The model truncates at 256 tokens (~1,000 characters) regardless of the tokenizer's own
  512-token default — enforced explicitly in code (D-008) because this ceiling is exactly the
  kind of invisible failure Aguja exists to expose, so any truncated chunk must be flagged, never
  hidden (FR-017).
- Comparison is limited to exactly two strategies at a time; the interface must not offer a third
  (FR-022).
- No file upload of any kind (PDF, Word, Markdown) and no persistence across reloads — both
  deliberately out of v1 scope (D-005).
- Identical (document, strategy, parameters, query) inputs must produce identical scores, 100% of
  the time, including deterministic tie-breaking by ascending chunk position (FR-015, FR-016).

## Brand Commitments

Name: **Aguja** (Spanish for "needle" — a needle-in-the-haystack reference to finding the passage
that retrieval missed). No other visual identity, voice, or asset commitments are confirmed yet;
none should be assumed.

## Evidence on Hand

No real customer testimonials, case studies, usage data, or sample datasets exist for this
project. It has no users yet — it is pre-launch portfolio work (D-001). Future work must not
fabricate testimonials, benchmarks, pricing, or customer logos.

## Product Principles

1. **Debugger, not retriever.** Explain relative ranking behavior; never claim or imply this is
   the best possible search engine.
2. **Never hide a failure the tool exists to expose.** Truncation, single-chunk paragraph splits,
   and silent boundary cuts must be surfaced as explicit findings, not absorbed quietly.
3. **Nothing pasted ever leaves the browser.** Zero API cost and zero trust required are treated
   as one guarantee, verifiable by anyone inspecting network traffic (D-002).
4. **Deterministic by construction.** Identical inputs always produce identical scores; this is a
   design constraint that makes the tool testable, not an incidental quality.
5. **Chunk visualization stands alone.** P1 must remain independently shippable; if scope is cut,
   retrieval goes first, never the reverse (Constitution).

## Accessibility & Inclusion

No accessibility standard applies in v1.
