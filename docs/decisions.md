# Decision log

Why Aguja is built the way it is. This records reasoning that would otherwise be lost — the
[specification](../specs/001-rag-chunking-debugger/spec.md) says *what* the tool does, this
says *why this and not something else*.

Entries are append-only. If a decision is reversed, a new entry supersedes the old one rather
than editing it away.

---

## D-001 — Build a retrieval debugger, not a prompting game

**Date**: 2026-07-25 · **Status**: Accepted

**Context.** The first concept for this project was a "prompt golf" game: reach a target model
output using the fewest tokens, with a public leaderboard. It had an obvious viral mechanic and
a clear scope.

Research into the space found the idea already occupied. [promptgolf.app](https://promptgolf.app/about)
implements exactly that mechanic — token minimization, target outputs, global leaderboard — and
is actively maintained. It is not alone: Promptle, PromptHeist, ChatJitsu, Gandalf and Prompt
Ninja form an established genre, mature enough that
[comparison articles between them](https://prompt-eval.com/en/blog/prompt-engineering-games)
already exist.

**Decision.** Drop the game. Build a debugger for chunking and retrieval instead — a space with
no comparable tool.

**Why.** The purpose of this project is to serve as portfolio work. Shipping the eighth entry in
a saturated genre produces the wrong story: "I cloned an existing site." Retrieval internals are
both unoccupied and closer to what the work actually demands.

**Consequences.** Narrower audience — this is a tool for people who build retrieval systems, not
for a general audience. Accepted deliberately: fewer users, but they are the ones who matter for
this project's purpose.

---

## D-002 — Run inference in the browser, accept zero API cost as a hard constraint

**Date**: 2026-07-25 · **Status**: Accepted

**Context.** The tool needs embeddings to rank chunks against a query. Two options: call a
hosted embeddings API, or run a small model locally via Transformers.js.

**Decision.** Run in the browser. No API key, no server-side inference.

**Why.** Three reasons compounding:

1. **Cost.** A hosted API means either paying per user — untenable for a public project with no
   budget — or asking users for their own key, which kills adoption for a tool someone tries
   once out of curiosity.
2. **Privacy.** Users paste their own documents in. Not transmitting them at all is a stronger
   guarantee than any privacy policy, and it is verifiable by anyone inspecting network traffic.
3. **Determinism.** Local inference with fixed parameters gives identical scores across runs.
   This matters more than it looks — it makes the retrieval logic testable with plain assertions
   instead of tolerance ranges.

**Consequences.** A model download on first visit, which must be surfaced as explicit progress
rather than an unexplained wait. Embedding quality is below what a large hosted model provides —
acceptable, since the tool exists to explain *relative* ranking behavior, not to be the best
retriever. Large documents are bounded by what a browser can process in reasonable time, which
is why the specification caps document size.

---

## D-003 — Include retrieval, not chunking visualization alone

**Date**: 2026-07-25 · **Status**: Accepted

**Context.** The narrower version of this project shows only how a document is split, with no
querying.

**Decision.** Include the retrieval half — query, ranked results, scores.

**Why.** Chunk visualization alone is a diagram. It shows what happened but not what it cost
you. The question users actually arrive with is "why is my passage not being found," and
answering it requires showing the ranking. The retrieval half is what makes this a debugging
tool rather than an illustration.

**Consequences.** More scope inside a 6-day budget, and it is what pulls in the embedding
dependency and therefore D-002. Mitigated by priority ordering in the specification: chunk
visualization is P1 and ships alone if the deadline tightens.

---

## D-004 — Screaming architecture with exactly one rule from Clean Architecture

**Date**: 2026-07-25 · **Status**: Accepted

**Context.** Screaming architecture and Clean Architecture are commonly framed as alternatives.
They are not — the first is about how folders are named and grouped, the second about which
direction dependencies point. Both were on the table.

**Decision.** Adopt screaming architecture fully: top-level folders under `src/features/` are
named for the problem domain (`chunking`, `retrieval`, `documents`), never for technical roles.
Adopt exactly one rule from Clean Architecture: **no `domain/` folder may import a framework.**
Domain code takes plain data and returns plain data.

Explicitly *not* adopted: interfaces at every boundary, mappers between layers, dependency
injection containers.

**Why.** The single dependency rule buys nearly all the value. The chunking strategies and
similarity scoring are the logic worth testing, and keeping them framework-free means testing
them needs no mocks, no test database, and no render harness. That is what makes the project's
test-first principle cheap rather than a tax.

The remaining Clean Architecture ceremony costs days that a 6-day solo project does not have,
and pays back only when multiple people are defending a boundary from each other.

**Consequences.** Some coupling between the application layer and the framework, accepted
knowingly. If this ever grows past one person, the boundaries would need tightening.

---

## D-005 — Paste-only input and no persistence in v1

**Date**: 2026-07-25 · **Status**: Accepted

**Context.** Two obvious features were considered and cut: uploading files (PDF, Word,
Markdown), and keeping work across page reloads.

**Decision.** Neither ships in v1. Plain text pasting only, session-scoped state.

**Why.** File upload looks like a small feature and is not — PDF text extraction is a source of
endless edge cases (columns, ligatures, scanned pages) and would consume a meaningful fraction
of a 6-day budget without teaching the user anything new about chunking. Persistence requires
storage and a state model that the core value does not depend on.

**Consequences.** Users must paste, and reloading loses work — the specification requires
warning before that happens. If the tool proves useful, file upload is the first thing to add,
and it is why the document is modeled as content plus length rather than as a file.

---

## D-006 — Use all-MiniLM-L6-v2, and accept an English-only tool

**Date**: 2026-07-25 · **Status**: Accepted

**Context.** D-002 committed the project to in-browser inference but never named a model. Three
candidates were realistic for Transformers.js: `all-MiniLM-L6-v2` (~23 MB quantized, 384
dimensions, English, 256-token input limit), `bge-small-en-v1.5` (~33 MB, better ranking quality
and a 512-token limit, still English), and `paraphrase-multilingual-MiniLM-L12-v2` (~120 MB,
50+ languages, 128-token limit).

**Decision.** Ship `Xenova/all-MiniLM-L6-v2`, quantized. Aguja is an English-only tool in v1.

**Why.** The first-visit download is the single worst moment in the product — the user has pasted
nothing yet and is already waiting. D-002 accepted that cost but requires it be kept small and
made visible, and 23 MB is the smallest credible option. Multilingual support would have cost
five times the download to serve a case that is not the target user's; the target user is a
developer debugging retrieval over technical documentation, which is overwhelmingly English.

Quality mattered less than it appears. Aguja exists to show *relative* ranking behavior — how the
order changes when the chunking strategy changes. A better model would move every score somewhat
but would not change the lesson, and D-002 already accepted embedding quality below a large
hosted model.

**Consequences.** Non-English documents will produce scores that look plausible and are not
trustworthy, which the interface must say outright rather than leave the user to discover — the
specification carries this as FR-026.

The 256-token input limit is the sharper consequence. A chunk larger than roughly 1,000 characters
will be silently truncated before embedding, meaning its tail contributes nothing to its score.
This is precisely the class of invisible failure the tool exists to expose, so it must be surfaced
as a first-class finding rather than hidden (FR-017). Choosing `bge-small` would have doubled that
ceiling; if truncation warnings turn out to dominate real usage, that is the trade to revisit.
