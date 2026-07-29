# Specification Quality Checklist: Bilingual Shell and Documentation

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-07-29
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

Validation run on first pass; no iterations required.

**Naming discipline held deliberately.** The localisation library is named only in the Dependencies
section, by reference to D-014, and never in a requirement. Requirements say "its own distinct
address" rather than naming `/es` and `/en`, so the specification constrains behaviour rather than
route syntax. The verbatim user description in the Input block does mention both, which is correct —
it records what was asked for, not what was specified.

**One item worth watching in planning.** FR-056 requires the session to survive a language switch.
Whether that is achievable depends on how the address structure interacts with the shared session,
and it may turn out that switching language necessarily discards the pasted document. The
requirement is written to allow for that: preservation is the requirement, and a warning before
losing work is the specified fallback, consistent with D-005. Planning must resolve which one
applies rather than discovering it during implementation.

**Governance item, since resolved.** The constitution enumerated scope as "In v1", "Added in v2",
and "Out", and this feature belonged to none of those. Amended before planning began (1.1.0 →
1.2.0), which also extended the English-only paragraph to say what satisfies it once the interface
is translated — the prohibition was already there, but it was written for an interface that was
entirely English and did not survive that assumption changing.
