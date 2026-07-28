## Project state

Aguja is a debugger for retrieval systems: paste a document, see how it is split into chunks,
run a query, see which chunks come back with scores and ranks.

**v1 is built and shipped.** The application lives under `src/`, with the landing page at `/` and
the debugger at `/tool`. Features are `chunking`, `retrieval`, `comparison`, `documents`, and
`sharing`.

**v2 is specified but not built.** `specs/002-rag-tool-suite/spec.md` turns `/tool` into a suite
of tools sharing one document and one loaded model, and adds two analyses: query sensitivity
across several phrasings, and a near-duplicate map over chunks. Nothing in it exists in `src/`
yet; `plan.md` is the next artifact for it.

Read before doing anything:

| File | Authority |
|---|---|
| `.specify/memory/constitution.md` | Binding principles. Wins over every other artifact. Currently 1.1.0. |
| `specs/001-rag-chunking-debugger/spec.md` | What v1 does — user stories P1–P4, FR-001…FR-026, SC-001…SC-010 |
| `specs/002-rag-tool-suite/spec.md` | What v2 adds — user stories P1–P3, FR-027…FR-051, SC-011…SC-018 |
| `docs/decisions.md` | Why it is built this way. Append-only, D-001…D-010. |
| `PRODUCT.md` · `DESIGN.md` | Product truth and the visual system. DESIGN.md wins on visual decisions. |

Spec Kit is installed; skills live in `.claude/skills/speckit-*`. The flow is constitution →
specify → plan → tasks → implement.

Commands: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (Vitest),
`pnpm test:domain`, `pnpm test:e2e` (Playwright). Do not invent others.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, pnpm. Transformers.js running
`Xenova/all-MiniLM-L6-v2` quantized for in-browser embeddings. Vitest for unit tests, Playwright
for end-to-end. Deployed on Vercel. Fixed — substituting anything here needs a constitution
amendment plus a new decision entry.

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
- **Out of scope, permanently unless amended:** file upload of any kind, semantic chunking, saved
  sessions, user accounts, comparing more than two strategies at once, persistence across
  reloads.
- **No tool may require generative or second-model inference** (D-010). Answer generation,
  groundedness or faithfulness scoring, LLM query rewriting, and cross-encoder reranking are all
  excluded for as long as Principle V stands — not deferred, excluded. Everything ships from the
  embeddings and tokenizer the one loaded model already provides.
- **Chunk visualization must stay independently shippable.** It was v1's P1 and both halves did
  ship; if scope ever tightens again, retrieval is what gets cut, never the reverse (D-003).
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
