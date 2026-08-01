## Project state

Aguja is a debugger for retrieval systems: paste a document, see how it is split into chunks,
run a query, see which chunks come back with scores and ranks.

**v1, v2 and v3 are all built and shipped.** The application lives under `src/`.

Every route sits under a locale segment (v3): `/[locale]` is the landing page, `/[locale]/docs`
the documentation, and `/[locale]/tool` redirects into a shared tool session with four sibling
routes — `tool/chunks` (chunk inspection), `tool/compare` (strategy comparison), `tool/queries`
(query sensitivity), `tool/confusable` (confusable chunks). Those four share one pasted document
and one loaded model for the session (v2's contribution; v1 shipped a single combined
chunking+retrieval view under `/tool` before the suite split it apart). A request naming no locale
redirects to the default, so addresses bookmarked from v2 still work.

Features under `src/features/` are `chunking`, `retrieval`, `comparison`, `sensitivity`,
`confusability`, `documents`, `sharing`, `localization`, and `documentation`. Interface copy lives
in `src/messages/{en,es}.json`; next-intl configuration in `src/i18n/`; locale negotiation in
`src/proxy.ts` (Next 16 renamed this file convention from `middleware`).

**The tool session lives at module scope, not in React state** (`src/app/[locale]/tool/_components/
sessionStore.ts` and `src/features/retrieval/embedding/embedderStore.ts`). This is load-bearing,
not stylistic: the locale segment sits above the tool layout, so switching language remounts the
provider and would otherwise destroy the pasted document and tear down the embedder worker. The
worker is created on first use and never terminated — never at module import, which would start a
23 MB download for visitors who only see the landing page.

Read before doing anything:

| File | Authority |
|---|---|
| `.specify/memory/constitution.md` | Binding principles. Wins over every other artifact. Currently 1.2.0. |
| `specs/001-rag-chunking-debugger/spec.md` | What v1 does — user stories P1–P4, FR-001…FR-026, SC-001…SC-010 |
| `specs/002-rag-tool-suite/spec.md` | What v2 adds — user stories P1–P3, FR-027…FR-053, SC-011…SC-019 |
| `specs/003-bilingual-shell-docs/spec.md` | What v3 adds — user stories P1–P3, FR-054…FR-075, SC-020…SC-028 |
| `docs/decisions.md` | Why it is built this way. Append-only, D-001…D-014. |
| `PRODUCT.md` · `DESIGN.md` | Product truth and the visual system. DESIGN.md wins on visual decisions. |

Spec Kit is installed; skills live in `.claude/skills/speckit-*`. The flow is constitution →
specify → plan → tasks → implement.

Commands: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (Vitest),
`pnpm test:domain`, `pnpm test:e2e` (Playwright). Do not invent others.

Vitest runs four projects: `domain` (Node, no DOM — enforces Principle III at runtime),
`component` (jsdom), `messages` (catalogue parity), and `theme` (`src/app/theme/`, WCAG contrast
invariants over the design tokens — Node, plain arithmetic, no DOM). `pnpm test` runs all four.
`pnpm typecheck` is load-bearing beyond hygiene: it is what enforces documentation parity between
locales, since each locale exports a record keyed by a shared section-id union.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, pnpm. Transformers.js running
`Xenova/all-MiniLM-L6-v2` quantized for in-browser embeddings. next-intl for interface copy only
(D-014) — it arrives with feature 003 and must never reach a `domain/` folder. Vitest for unit
tests, Playwright for end-to-end. Deployed on Vercel. Fixed — substituting anything here needs a
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
- **Out of scope, permanently unless amended:** file upload of any kind, semantic chunking, saved
  sessions, user accounts, comparing more than two strategies at once, persistence across
  reloads.
- **No tool may require generative or second-model inference** (D-010). Answer generation,
  groundedness or faithfulness scoring, LLM query rewriting, and cross-encoder reranking are all
  excluded for as long as Principle V stands — not deferred, excluded. Everything ships from the
  embeddings and tokenizer the one loaded model already provides.
- **Chunk visualization must stay independently shippable.** It was v1's P1 and both halves did
  ship; if scope ever tightens again, retrieval is what gets cut, never the reverse (D-003).
- **English-only *analysis*, by choice** (D-006). The model was picked for a small first-visit
  download, not for quality or language coverage. Non-English scores are not trustworthy and the
  UI must say so.
- **Interface language ≠ analysis language** (D-013). The interface ships in Spanish and English;
  the analysis stays English-only. A translated interface asserts capability just by existing, so
  the English-only limit must be stated in the language being read and be visible without hovering
  — not a tooltip. Never let localisation reach a `domain/` folder.
- **Cosine similarity alone does not mean duplication** (D-011), and lexical overlap only
  separates paraphrase from literal duplication — it does not separate a one-word contradiction
  from a true duplicate, since both share nearly all their wording (D-012). Confusable Chunks
  reports both numbers plus each chunk's own text and never labels a pair "duplicate."

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
