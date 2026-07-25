<!--
Sync Impact Report
==================
Version change: (template, unversioned) → 1.0.0
Bump rationale: Initial ratification. First concrete constitution replacing the
                unfilled Spec Kit template.

Principles defined:
  I.   Specification-Driven Change (NON-NEGOTIABLE)  [new]
  II.  Test-First (NON-NEGOTIABLE)                   [new]
  III. Framework-Free Domain                         [new, derives from D-004]
  IV.  Screaming Architecture                        [new, derives from D-004]
  V.   Local-Only Inference                          [new, derives from D-002]

Sections added:
  - Technology Constraints
  - Development Workflow
  - Governance

Sections removed: none (template placeholders replaced in place)

Template consistency:
  ✅ .specify/templates/plan-template.md   — Constitution Check gate is generic and
                                             reads this file at plan time; no edit needed
  ✅ .specify/templates/spec-template.md   — no constitution-driven mandatory sections
                                             added or removed; no edit needed
  ✅ .specify/templates/tasks-template.md  — already orders tests before implementation;
                                             consistent with Principle II
  ✅ .claude/skills/speckit-*/SKILL.md     — stock Spec Kit skills; no stale
                                             agent-specific references requiring edits
  ✅ CLAUDE.md                             — architecture and constraint sections already
                                             match Principles III-V
  ✅ README.md                             — its "Specification complete" claim and its
                                             links to this file and to specs/
                                             001-rag-chunking-debugger/spec.md are now
                                             accurate; both artifacts exist
  ✅ docs/decisions.md                     — D-006 added, recording the embedding model
                                             choice required by Technology Constraints

Deferred TODOs: none
-->

# Aguja Constitution

Aguja is a debugger for retrieval systems. It exists to answer one question — *why
doesn't my retrieval find this passage?* — by making chunk boundaries and ranking
behavior visible. Every principle below serves that purpose or protects the budget that
delivers it.

## Core Principles

### I. Specification-Driven Change (NON-NEGOTIABLE)

Every behavioral change MUST trace to a written specification before implementation
begins. No feature, requirement, or user-visible behavior enters the codebase because it
seemed reasonable mid-implementation.

When implementation reveals that the specification is wrong or incomplete, work STOPS
and the specification is amended first. Discovering a gap is expected; silently coding
around it is not.

Decisions about *why* the project is built a particular way MUST be recorded in
`docs/decisions.md`. That log is append-only: reversing a decision means adding a new
entry that supersedes the old one, never editing the old entry away. A reader MUST be
able to reconstruct what was believed at the time and what changed.

**Rationale.** This project's purpose is portfolio work. An honest paper trail from
decision to specification to test to code is a substantial part of what it demonstrates.
Retroactive tidying destroys exactly the evidence that makes it credible.

### II. Test-First (NON-NEGOTIABLE)

For all domain logic, tests MUST be written before the implementation, MUST be run, and
MUST be observed to fail for the intended reason before any implementation code is
written. A test that has never failed has proven nothing.

Red-Green-Refactor applies in that order. Implementation is written only to make a
failing test pass.

Because inference runs locally with fixed parameters, scores are deterministic across
runs (Principle V). Tests over chunking and ranking therefore MUST assert exact expected
values rather than tolerance ranges. Where a tolerance appears, it MUST carry a comment
naming the source of the nondeterminism.

Ranking tests MUST cover tie behavior explicitly. When two chunks produce identical
similarity scores, the resulting order MUST be deterministic and specified, never left
to sort stability by accident.

**Rationale.** The chunking strategies and similarity scoring are the logic worth
testing and the logic users will distrust first. Determinism is what makes testing them
cheap; Principle III is what keeps them reachable without a render harness.

### III. Framework-Free Domain

No file under any `domain/` folder MAY import a framework, a UI library, a browser API,
or a runtime-specific module. This includes React, Next.js, Transformers.js, `window`,
`document`, `fetch`, and filesystem access.

Domain code takes plain data and returns plain data. Embeddings arrive as plain arrays
of numbers; producing them is the responsibility of an outer layer.

This is the single rule adopted from Clean Architecture. Explicitly NOT adopted, and
MUST NOT be introduced without amending this constitution: interfaces at every boundary,
mappers between layers, and dependency injection containers.

**Rationale.** Recorded in D-004. The dependency rule buys nearly all the value of
layered architecture at almost none of its cost — domain tests need no mocks, no test
database, and no rendering. The remaining ceremony pays back only when several people
are defending a boundary from each other, which is not this project.

### IV. Screaming Architecture

Folders under `src/features/` MUST be named for the problem domain — `chunking`,
`retrieval`, `documents`. Folders named for technical roles — `services`, `utils`,
`helpers`, `managers`, or `lib` as a catch-all — MUST NOT be created inside a feature.

A reader opening `src/` should learn what the application does, not which framework
built it.

Coupling between the application layer and the framework is accepted knowingly. The
boundary this constitution defends is the one named in Principle III, and no other.

**Rationale.** Recorded in D-004. A `utils/` folder is where cohesion goes to die; the
naming rule is what keeps domain logic findable and therefore testable.

### V. Local-Only Inference

All embedding inference MUST run in the user's browser. The application MUST NOT
transmit document text, query text, or any derived embedding to a server, an analytics
endpoint, or a third-party service. There is no API key, and none may be introduced.

The first-visit model download MUST be surfaced as explicit, labeled progress. An
unexplained wait is a defect, not a cosmetic shortcoming.

**Rationale.** Recorded in D-002, on three compounding grounds. Cost: a hosted API means
either paying per user with no budget, or demanding a key from someone trying the tool
once out of curiosity. Privacy: not transmitting a document at all is a stronger
guarantee than any privacy policy, and anyone can verify it by watching network traffic.
Determinism: fixed-parameter local inference is what makes Principle II's exact
assertions possible.

## Technology Constraints

The stack is fixed for v1 and MUST NOT be substituted without an amendment and a new
entry in `docs/decisions.md`:

- **Framework**: Next.js (App Router) with TypeScript
- **Styling**: Tailwind CSS
- **Inference**: Transformers.js running `Xenova/all-MiniLM-L6-v2`, quantized (D-006)
- **Testing**: Vitest for unit tests, Playwright for end-to-end
- **Package manager**: pnpm
- **Deployment**: Vercel

The embedding model is English-only by deliberate choice. Non-English documents will
produce scores, but those scores are not meaningful, and the interface MUST NOT imply
otherwise.

The scope boundaries below are decisions, not a backlog. Implementing anything in the
**Out** list requires an amendment:

- **In v1**: pasting plain text; four chunking strategies (fixed size by characters,
  fixed size with overlap, by paragraphs, by tokenization units); querying; ranked
  results with scores and positions; pairwise strategy comparison; a shareable summary
  image.
- **Out of v1**: file upload of any kind (PDF, Word, Markdown); semantic chunking; saved
  sessions; user accounts; comparing more than two strategies at once; persistence
  across page reloads.

Chunk visualization is priority P1 and MUST remain independently shippable. If the
budget tightens, retrieval is what gets cut — never the reverse, and never by degrading
P1 to keep P2 alive.

## Development Workflow

Work proceeds through the Spec Kit flow, in order: constitution → specify → plan →
tasks → implement. A phase MUST NOT begin before the artifact from the prior phase
exists and has been reviewed.

Each feature owns a numbered directory under `specs/`, containing at minimum its
`spec.md`. Plans and task lists live beside it.

Before a task is marked complete, the full test suite MUST pass. A task that leaves the
suite red is not complete, regardless of how much of its intent is implemented.

Commit messages follow Conventional Commits.

## Governance

This constitution supersedes ad-hoc practice. Where this document and a specification,
plan, or task list disagree, this document wins and the conflicting artifact MUST be
corrected.

**Amendment procedure.** Amendments require an edit to this file, a version bump
recorded below, and — for anything touching Principles III, IV, or V, or the Technology
Constraints — a corresponding entry in `docs/decisions.md` explaining the reasoning. An
amendment that silently contradicts an accepted decision entry is invalid.

**Versioning policy.** This constitution is versioned independently of the application,
using semantic versioning:

- **MAJOR**: a principle is removed, or redefined in a way that invalidates work built
  under the previous reading.
- **MINOR**: a principle or section is added, or existing guidance is materially
  expanded.
- **PATCH**: clarification, wording, or typo fixes that do not change what is permitted.

**Compliance review.** Every plan MUST pass an explicit Constitution Check against these
principles before tasks are generated. Complexity that violates a principle is not
forbidden outright, but it MUST be justified in writing against the simpler alternative
that was rejected — and an unjustifiable violation blocks the plan.

`CLAUDE.md` carries runtime guidance for AI agents working in this repository and MUST
be kept consistent with this document.

**Version**: 1.0.0 | **Ratified**: 2026-07-25 | **Last Amended**: 2026-07-25
