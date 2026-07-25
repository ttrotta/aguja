# Aguja

**A debugger for retrieval systems.** Paste a document, see exactly how it gets split into
chunks, run a query, and see which chunks come back — with their similarity scores and rank
positions.

It answers one question: *why doesn't my retrieval find this passage?*

> **Status: in development.** Specification complete, implementation not started.
> Started 2026-07-25. Target: 6 days.

---

## The problem

Retrieval-augmented systems fail quietly. A passage is right there in your document, your
search doesn't return it, and there is no obvious way to find out why. The cause is usually
invisible: the chunk boundary cut the passage in half, or the chunk is so large that the
relevant sentence is diluted, or the paragraph split produced one chunk for the whole file.

You cannot see any of that. You just get bad results.

Aguja makes the invisible part visible.

## What it does

- **Shows the cuts.** Your document with chunk boundaries drawn over it — where each chunk
  starts, where it ends, how big it is.
- **Four chunking strategies.** Fixed size by characters, fixed size with overlap, by
  paragraphs, and by tokenization units. Switch between them and watch the boundaries move.
- **Runs your query.** Type the query that fails and see the chunks ranked by similarity, each
  with its score and position.
- **Compares two strategies side by side.** Same document, same query — see which one ranks
  the correct passage higher.

## Everything runs on your machine

Embeddings are computed in the browser. That means:

- **No API key.** Nothing to sign up for, nothing to paste in.
- **No cost.** Not for you, not for whoever is hosting it.
- **Your document never leaves your device.** No upload, no third-party service, no logging of
  what you paste.

The tradeoff is an initial model download on first use. After that it is fully local.

## Scope of v1

**In:** pasting plain text, the four chunking strategies listed above, querying, ranked
results with scores, pairwise strategy comparison, a shareable summary image.

**Out:** file upload (PDF, Word, Markdown), semantic chunking, saved sessions, user accounts,
comparing more than two strategies at once.

This is a deliberate boundary, not a backlog. See
[`specs/001-rag-chunking-debugger/spec.md`](specs/001-rag-chunking-debugger/spec.md) for the
full specification, and [`docs/decisions.md`](docs/decisions.md) for why the line is drawn
here.

## Planned stack

Next.js (App Router), TypeScript, Tailwind CSS, Transformers.js for in-browser embeddings.
Vitest for unit tests, Playwright for end-to-end. Deployed on Vercel.

The codebase follows screaming architecture: folders under `src/features/` are named after the
problem (`chunking`, `retrieval`, `documents`), and every `domain/` folder is free of framework
imports — plain data in, plain data out. That is what makes the chunking strategies and
similarity scoring cheap to test.

## How this was built

Spec-driven, using [Spec Kit](https://github.com/github/spec-kit). The project constitution
lives in [`.specify/memory/constitution.md`](.specify/memory/constitution.md) and holds two
non-negotiable principles — tests before implementation, and every change traceable to a
specification.

## Documentation

| Document | What it covers |
|---|---|
| [Specification](specs/001-rag-chunking-debugger/spec.md) | What the tool does, in detail — user stories, requirements, success criteria |
| [Decisions](docs/decisions.md) | Why it is built this way, and what was rejected |
| [Constitution](.specify/memory/constitution.md) | Engineering principles governing the project |
