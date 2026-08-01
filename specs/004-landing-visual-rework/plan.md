# Implementation Plan: Landing Visual Rework

**Branch**: `004-landing-visual-rework` | **Date**: 2026-07-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-landing-visual-rework/spec.md`

## Summary

Replace the landing page's flat single-colour background with a dot-matrix texture that clears
around the needle-and-thread motif, and complete the hero headline change from the wordmark to the
product category.

The technical approach is deliberately small: the field is a repeating `radial-gradient` sized by
`background-size`, and the clearing is a second, opaque gradient layer painted *over* it in the
same background stack. No mask, no extra DOM node for the field, no image asset, no JavaScript, no
new dependency.

Planning surfaced one thing the specification did not anticipate. Measuring the contrast floor the
spec demands (FR-084) revealed that the light theme's secondary text already fails WCAG AA against
every surface in the application — 4.28:1, 4.49:1, 4.30:1 and 4.17:1, where 4.5:1 is the bar. The
dot field lowers that further, so it cannot be built on top of the defect. The specification was
amended during planning (FR-101, FR-102, SC-037) and correcting the token is now the first task,
enforced by a test that fails today.

## Technical Context

**Language/Version**: TypeScript 5, React 19.2.4

**Primary Dependencies**: Next.js 16.2.11 (App Router), Tailwind CSS 4, next-intl 4.13.4. No new
dependency is introduced by this feature.

**Storage**: N/A — this feature adds no state of any kind.

**Testing**: Vitest 4 (projects: `domain`, `component`, `messages`, plus a new `theme` project
introduced here), Playwright 1.62 for end-to-end.

**Target Platform**: Desktop browsers primarily; the landing must not break at narrow widths.

**Project Type**: Web application (Next.js App Router, single project).

**Performance Goals**: No additional network requests and no additional bytes (SC-031). No
layout or paint work attributable to the background during scroll (FR-088, SC-032).

**Constraints**: WCAG AA — 4.5:1 body, 3:1 large text — verified by measurement in both themes
(FR-084, SC-030, SC-037). No new continuous animation (FR-096). Must not reach the tool,
documentation, or research surfaces (FR-085, FR-086).

**Scale/Scope**: One page (four sections), one stylesheet, two message catalogues, one new test
project. Roughly a dozen files.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Verdict |
|---|---|---|
| **I. Specification-Driven Change** | Every behavioural change traces to a written spec before implementation. | **PASS, after correction.** The hero headline was coded before its specification existed — a real violation, now remediated by folding it into this feature as User Story 1. Planning then found the contrast defect, and per this same principle work stopped and the spec was amended first (FR-101, FR-102, SC-034, SC-037) rather than coded around. A `D-015` entry is required by FR-100. |
| **II. Test-First** | Tests written first, run, and observed to fail for the intended reason. | **PASS.** The contrast floor is expressed as a test over the token values, not as a manual check. It fails today against the real defect, which is the required red state. Sequencing is fixed in `tasks.md`: test first, token correction second. |
| **III. Framework-Free Domain** | No `domain/` file imports a framework, browser API, or runtime module. | **PASS.** This feature adds no `domain/` code. The new contrast test is pure arithmetic over plain data — no DOM, no React — and runs in the Node environment, which is what makes it cheap enough to be worth keeping. |
| **IV. Screaming Architecture** | Feature folders named for the problem, never for technical roles. | **PASS.** No new feature folder. The new test project is named `theme`, for what it protects, not `utils` or `helpers`. |
| **V. Local-Only Inference** | All inference local; no document, query, or embedding leaves the browser. | **PASS, not engaged.** This feature touches presentation only. It also *protects* the first-visit budget Principle V's rationale rests on, by forbidding any image asset (FR-087). |

**Technology Constraints gate**: the stack is fixed and this feature substitutes nothing. The
texture is expressible in Tailwind CSS 4, already in the stack, so no amendment and no
`docs/decisions.md` entry is owed on those grounds. The `D-015` entry owed under FR-100 is for the
design reasoning, not for a stack change.

**Scope gate**: the constitution's **Out** list bars file upload, semantic chunking, saved
sessions, accounts, three-way comparison, persistence, and generative inference. This feature
touches none of them.

**Result: all gates pass. No entry required in Complexity Tracking.**

## Project Structure

### Documentation (this feature)

```text
specs/004-landing-visual-rework/
├── plan.md              # This file
├── spec.md              # Amended during planning — FR-101, FR-102, SC-034, SC-037
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output — the token contract
├── quickstart.md        # Phase 1 output — how to verify the feature
├── contracts/
│   └── design-tokens.md # Phase 1 output — the visual contract this feature must hold
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 — NOT created by /speckit-plan
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── globals.css                    # Dot-field tokens + the field and clearing themselves;
│   │                                  #   light --color-text-muted corrected (FR-101)
│   ├── theme/
│   │   ├── tokens.ts                  # NEW — reads the token values out of globals.css
│   │   ├── contrast.ts                # NEW — WCAG relative luminance + ratio, pure arithmetic
│   │   └── contrast.test.ts           # NEW — the AA floor as an executable invariant
│   ├── [locale]/
│   │   └── page.tsx                   # Landing root gains the dot-field class (Story 2)
│   └── _components/
│       ├── LandingHero.tsx            # Headline already changed (Story 1); gains the
│       │                              #   clearing layer around the needle (Story 3)
│       └── LandingHero.test.tsx       # NEW — headline renders from the catalogue, not a literal
└── messages/
    ├── en.json                        # landing.heroTitle (already added)
    └── es.json                        # landing.heroTitle (already added)

vitest.config.ts                       # Gains a fourth project: `theme`
DESIGN.md                              # Updated per FR-099 — it is the visual authority
docs/decisions.md                      # Gains D-015 per FR-100 — append-only
```

**Structure Decision**: Single Next.js project, matching the existing layout. The one structural
addition is `src/app/theme/`, holding the token reader, the contrast arithmetic, and its test.

It sits under `src/app/` rather than `src/features/` on purpose. Principle IV reserves
`src/features/` for problem domains — `chunking`, `retrieval`, `confusability`. Theme contrast is
not a problem domain of this product; it is a property of the application shell, which is what
`src/app/` already holds. Putting it in `features/` would be inventing a fake domain to satisfy a
folder convention, which is the failure mode Principle IV exists to prevent, not an instance of
obeying it.

The new `theme` Vitest project follows the precedent the `messages` project already set. That
project exists, in its own words, because catalogue parity "is neither domain logic nor a
component" yet is the only thing enforcing FR-059. Token contrast is the same shape of problem:
not domain logic, not a component, and the only thing that can enforce FR-084 permanently rather
than once.

## Constitution Check — re-evaluated after Phase 1 design

*Required gate. The design introduced two things the pre-research check could not have judged: a
new folder and a fourth test project.*

| Concern raised by the design | Assessment |
|---|---|
| `src/app/theme/` is a new folder — does it violate Screaming Architecture? | **No.** Principle IV governs `src/features/`, reserving it for problem domains. Theme contrast is a property of the application shell, not a problem this product solves for its users. Placing it in `features/` would mean inventing a fake domain to satisfy a convention — the failure mode the principle exists to prevent. It is also not a `utils`/`helpers`/`lib` catch-all: it is named for exactly what it holds. |
| The contrast test reads a file from disk — does that breach Framework-Free Domain? | **No.** Principle III scopes the prohibition to files under a `domain/` folder. `src/app/theme/` is not one, and adding it there was considered and rejected precisely so the rule stays unambiguous. The contrast arithmetic itself is pure and would satisfy Principle III on its own terms. |
| A fourth Vitest project — is that unjustified complexity? | **No, and it follows an existing precedent.** `vitest.config.ts` already carries a third project, `messages`, created because catalogue parity "is neither domain logic nor a component". Token contrast is the same shape of problem. The alternative — folding it into `domain` — would dilute what that project's name asserts, which is the specific thing its comment says it exists to protect. |
| The spec was amended mid-planning — is that a process violation? | **No, it is the process.** Principle I states that when implementation reveals the specification is incomplete, work stops and the specification is amended first. That is what happened: measurement found the contrast defect, planning halted, FR-101, FR-102, SC-034 and SC-037 were written, and only then did design continue. |
| Does anything here touch the constitution's **Out** list or the fixed stack? | **No.** No dependency added, nothing substituted, and none of file upload, semantic chunking, saved sessions, accounts, three-way comparison, persistence, or generative inference is involved. |

**Result: all gates still pass after design. No Complexity Tracking entry required.**

## Complexity Tracking

> No Constitution Check violations, before or after design. This section is intentionally empty.
