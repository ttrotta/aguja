# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Aguja is a debugger for retrieval systems: paste a document, see how it is split into chunks,
run a query, see which chunks come back with scores and ranks.

**No application code exists yet.** There is no `package.json`, no build, no test runner, no
`src/`. Do not invent commands — when scaffolding, the stack below is what to set up.

What does exist, and should be read before doing anything:

| File | Authority |
|---|---|
| `.specify/memory/constitution.md` | Binding principles. Wins over every other artifact. |
| `specs/001-rag-chunking-debugger/spec.md` | What v1 does — user stories P1–P4, FR-001…FR-026, SC-001…SC-010 |
| `docs/decisions.md` | Why it is built this way. Append-only, D-001…D-006. |

Spec Kit is installed. The flow is constitution → specify → **plan** → tasks → implement; the
first two are done, `plan.md` is the next artifact. Skills live in `.claude/skills/speckit-*`.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, pnpm. Transformers.js running
`Xenova/all-MiniLM-L6-v2` quantized for in-browser embeddings. Vitest for unit tests, Playwright
for end-to-end. Deployed on Vercel. Fixed for v1 — substituting anything here needs a
constitution amendment plus a new decision entry.

## Architecture rules (from D-004)

- **Screaming architecture.** Folders under `src/features/` are named for the problem
  (`chunking`, `retrieval`, `documents`), never for technical roles (`services`, `utils`,
  `helpers`).
- **One rule borrowed from Clean Architecture: no `domain/` folder may import a framework.**
  Domain code takes plain data and returns plain data. This is what makes chunking strategies
  and similarity scoring testable with plain assertions — no mocks, no render harness.
- Deliberately *not* adopted: interfaces at every boundary, inter-layer mappers, DI containers.
  Coupling between the application layer and Next.js is accepted knowingly.

## Constraints that are decisions, not gaps

These were chosen with reasons recorded in `docs/decisions.md`. Do not "fix" them:

- **All inference runs in the browser.** No embeddings API, no API key, no server-side
  inference, no document ever leaving the device (D-002). The first-visit model download must
  be surfaced as explicit progress, not an unexplained wait.
- **Local inference is fixed-parameter and therefore deterministic** — assert exact scores in
  tests rather than tolerance ranges (D-002).
- **Paste-only input, session-scoped state** (D-005). No file upload (PDF/Word/Markdown), no
  persistence across reloads; the spec requires warning the user before work is lost. The
  document is modeled as content plus length, not as a file.
- **Out of v1 scope:** semantic chunking, saved sessions, user accounts, comparing more than two
  strategies at once.
- **P1 is chunk visualization**, which ships alone if the 6-day budget tightens. Retrieval is the
  half that makes it a debugger rather than an illustration (D-003), but it is second.
- **English-only, by choice** (D-006). The model was picked for a small first-visit download, not
  for quality or language coverage. Non-English scores are not trustworthy and the UI must say so.

The four chunking strategies in scope: fixed size by characters, fixed size with overlap, by
paragraphs, and by tokenization units.

Two consequences of the model that shape the design, both already in the spec:

- **Only three of the four strategies are model-free.** "By tokenization units" needs the model's
  tokenizer, so it depends on the download; the other three must work before it (FR-011, SC-003).
- **The model truncates at 256 tokens** (~1,000 characters). Larger chunks are silently cut before
  embedding, so their tails contribute nothing to the score. That is exactly the invisible failure
  Aguja exists to expose — surface it, never hide it (FR-017).

## Working conventions

- **Spec-driven, via [Spec Kit](https://github.com/github/spec-kit).** Every change traces to a
  specification, and tests come before implementation. These are the two non-negotiable
  principles of the project constitution.
- **`docs/decisions.md` is append-only.** Reversing a decision means adding a new entry that
  supersedes the old one, never editing the old entry away. Entries are `D-00N` with Date,
  Status, Context, Decision, Why, Consequences.
- Commit messages follow Conventional Commits (`feat:`, …).
