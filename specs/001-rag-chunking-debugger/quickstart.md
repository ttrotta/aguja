# Quickstart & Validation: RAG Chunking Debugger

**Feature**: `001-rag-chunking-debugger` · **Date**: 2026-07-25

How to run Aguja and how to prove it does what [spec.md](./spec.md) says. Every success criterion
SC-001…SC-010 maps to something checkable here.

Nothing in this file exists yet — it describes the project once scaffolded, and doubles as the
acceptance checklist for the implementation phase.

---

## Prerequisites

- Node 20+ (developed against 24)
- pnpm 10+
- A Chromium-based browser for Playwright

No API key, no account, no `.env` file. If setup ever asks for a credential, something has
violated FR-021.

---

## Setup

```bash
pnpm install
pnpm exec playwright install chromium   # first time only
```

## Run

```bash
pnpm dev          # http://localhost:3000
pnpm build        # production build
pnpm start        # serve the production build
```

## Test

```bash
pnpm test                  # domain + component unit tests, watch off
pnpm test:domain           # domain only — node environment, no DOM, fastest loop
pnpm test:watch            # test-first loop for Principle II
pnpm test:e2e              # Playwright
pnpm lint                  # includes the domain import ban (R-007)
pnpm typecheck
```

Run a single file or a single test:

```bash
pnpm exec vitest run src/features/chunking/domain/paragraphs.test.ts
pnpm exec vitest run -t "yields one chunk when the document has no blank lines"
pnpm exec playwright test e2e/no-network-leak.spec.ts
```

The domain suite is the one to keep open while working. It runs in `environment: 'node'` with no
jsdom, so it starts in milliseconds — which is what makes writing the test first cheap rather than
a tax.

---

## Validating the success criteria

### Without the model — P1 only

These need no download and must pass with the network throttled to offline **after** first paint.

| Check | Criterion |
|---|---|
| Paste 3,000 chars, choose fixed-size 500 → 6 chunks marked, each labeled with index and length | SC-001 |
| Change size 500 → 1,000 without re-pasting → 3 chunks, boundaries redraw | SC-002 |
| Paste a 50,000-char document, change a parameter → redraw under 100 ms | SC-002 |
| All four strategies selectable and correct with the model never loaded | SC-003 |
| Paste text with no blank lines, choose paragraphs → one chunk plus an explanation of why | SC-010 |
| Try to paste 50,001 chars → refused at the cap, counter shown, nothing truncated | FR-003 |
| Set overlap ≥ size → rejected before chunking, message names the constraint | FR-009 |

The fourth strategy needs the tokenizer (0.7 MB), not the model (21.9 MB) — see
[R-004](./research.md). "Without the model" means exactly that.

### Model loading

| Check | Criterion |
|---|---|
| First visit shows labeled progress naming what is downloading, for the whole wait | SC-004, FR-019 |
| Model ready for queries within 30 s on a 10 Mbps connection | SC-004 |
| Reload → served from Cache API, no re-download | SC-005 |
| Block the CDN → explicit error stating chunking still works | FR-020 |

### Retrieval

| Check | Criterion |
|---|---|
| Query a 100-chunk document → complete ranking within 15 s | SC-006 |
| Run the identical query twice → identical scores, to the last digit | SC-007, FR-016 |
| Every chunk appears in the ranking — no top-N cut | FR-014 |
| Two chunks with equal scores → earlier chunk ranks first, every time | FR-015 |
| A chunk over ~1,000 characters → flagged truncated, showing how much was ignored | FR-017 |

### Privacy — the one that must never regress

```bash
pnpm exec playwright test e2e/no-network-leak.spec.ts
```

Runs a full session — paste, chunk, query, compare, export — with every request intercepted, and
fails if any request body or URL contains document or query text. The only requests permitted are
model asset fetches from the Hugging Face CDN.

This is SC-009 and FR-013, and it is the single test that most deserves to stay green: Principle V
is the project's strongest claim, and it is verifiable by anyone who opens devtools.

### Property tests

The chunking invariants are checked over generated documents, not hand-picked examples:

```bash
pnpm exec vitest run src/features/chunking/domain/invariants.test.ts
```

Asserts, for arbitrary input, that joining chunk text reproduces the source exactly for every
non-overlap strategy (FR-010, SC-008), that `text === content.slice(start, end)` always, and that
segments tile the document with no gaps or overlaps.

---

## First-run smoke test

The shortest path proving the whole thing is alive:

1. `pnpm dev`, open `http://localhost:3000`
2. Paste several paragraphs of English prose
3. Fixed-size 500 → boundaries appear; switch to overlap 500/100 → shared regions render distinctly
4. Wait for the model, query a phrase from the middle of the document
5. Confirm that phrase's chunk ranks near the top with a plausible score
6. Open devtools → Network → confirm nothing but Hugging Face asset requests

If step 6 shows anything else, stop and fix it before continuing. Everything else is a bug; that
one is a broken promise.
