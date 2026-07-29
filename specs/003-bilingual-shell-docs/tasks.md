# Tasks: Bilingual Shell and Documentation

**Input**: Design documents from `/specs/003-bilingual-shell-docs/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Included for the new `localization/domain` module (Principle II is non-negotiable for
domain logic, with exact-value assertions) and for message-catalogue parity, which is the only
thing enforcing FR-059 — typed keys do not catch a key missing from one catalogue
([research.md](./research.md) Finding 2). Documentation parity needs no test: it is a compile-time
property of the section-record type. UI components remain implementation-only, validated through
quickstart.md, matching the convention v1 and v2 established.

**Organization**: Grouped by user story from spec.md, in priority order (P1 → P2 → P3). Numbering
continues from feature 002, which ended at T034.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Different files, no dependency on an incomplete task — safe to run in parallel
- **[Story]**: Which user story this task belongs to (US1, US2, US3); absent for Setup,
  Foundational, and Polish

## Path Conventions

Single Next.js project. Routes move under `src/app/[locale]/`; feature code lives in
`src/features/*/` with folders named for the problem (Principle IV). Message catalogues live in
`src/messages/`.

---

## Phase 1: Setup

**Purpose**: Add the one dependency this feature needs, recorded in D-014.

- [ ] T035 Add `next-intl` to `package.json` via `pnpm add next-intl`. It is listed in the
      constitution's fixed stack for interface copy only (1.2.0, Technology Constraints) — confirm
      no other dependency is required, and that `vitest.config.ts`'s `domain` project glob
      (`src/features/**/domain/**/*.test.ts`) already picks up the new localization feature with
      no config edit.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Two things all three stories rest on — the locale path functions, and moving the tool
session out of the React tree so it survives the remount a locale segment causes.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete. In particular, US1
cannot satisfy FR-056 without T038–T041, and the twelve `e2e` paths cannot be rewritten without
T037.

- [ ] T036 [P] Write `src/features/localization/domain/routes.test.ts` covering every row of the
      test obligations table in [contracts/localization.md](./contracts/localization.md):
      `isSupportedLocale` true for each supported code and false for `"fr"`, `""`, `"EN"`;
      `localizedPath` on a nested path and on `"/"` (which must yield `"/en"`, no trailing slash);
      `swapLocale` between locales, preserving a query string and fragment, and prefixing rather
      than replacing when the path carries no locale; `stripLocale` on a localised path, an
      unlocalised path, a locale-only path, and an unsupported first segment (`/fr/tool` must
      yield `locale: null`, path unchanged — guessing would produce the half-translated page
      FR-058 forbids); and the round trip
      `swapLocale(localizedPath(p, "en"), "es") === localizedPath(p, "es")`. Exact strings, no
      tolerances. Run and observe failing before T037.
- [ ] T037 Implement `src/features/localization/domain/routes.ts` and
      `src/features/localization/domain/index.ts`: the `Locale` union (`"en" | "es"`),
      `SUPPORTED_LOCALES`, `DEFAULT_LOCALE`, `isSupportedLocale`, `localizedPath`, `swapLocale`,
      `stripLocale`. Framework-free — no `next-intl` import, no router, no `window` (Principle
      III). Make T036 pass without editing it.
- [ ] T038 Create `src/app/tool/_components/sessionStore.ts` holding the session outside React:
      the document string, a subscriber set, `getSnapshot`/`subscribe`, and the embedding
      `Map<string, Embedding>` at module scope. Preserve the existing invariant exactly — setting
      a new document clears the embedding cache, because chunk text from a previous document can
      never be requested again and a stale vector must never answer for text that happens to
      match (FR-032, [data-model.md](./data-model.md)).
- [ ] T039 Rewire `src/app/tool/_components/ToolSession.tsx` to read the document through
      `useSyncExternalStore` against T038's store instead of `useState`, and to use the
      module-scope cache instead of its `useRef` Map. The value the context exposes MUST NOT
      change shape, so no tool page is touched.
- [ ] T040 Make the worker a module-scope lazy singleton in
      `src/features/retrieval/embedding/useEmbedder.ts`: create it on first use rather than in a
      mount effect, and remove the `worker.terminate()` cleanup so it survives unmount. **Lazy is
      the load-bearing word** — creating the worker at module import would start a 23 MB download
      for every visitor who only ever sees the landing page, which is exactly the cost D-002
      spends its budget avoiding (research.md Finding 1, Consequences).
- [ ] T041 Confirm the refactor changed behaviour nowhere it should not: `pnpm typecheck`,
      `pnpm test` (98 tests at the start of this feature), and `pnpm test:e2e` all green, and no
      file under any `domain/` folder was touched by T038–T040.

**Checkpoint**: Locale path functions exist and are tested; the session survives a remount. No
user-visible change yet.

---

## Phase 3: User Story 1 - Read the interface in your own language without being misled (Priority: P1) 🎯 MVP

**Goal**: The interface is available in Spanish and English at separate addresses, switchable from
any page without losing the pasted document, and states visibly — in the language being read —
that the analysis is English-only.

**Independent Test**: Visit both addresses with no other part of this feature built; every visible
string renders in the requested language, the language can be switched from any page while keeping
the document and without reloading the model, and the English-only limit is legible without
hovering.

- [ ] T042 [US1] Configure next-intl: `src/i18n/routing.ts` (or equivalent) declaring the two
      locales and the English default, `src/i18n/request.ts` for message loading, and
      `src/middleware.ts` for locale negotiation. The supported-locale list MUST derive from
      T037's `SUPPORTED_LOCALES` rather than being restated, so there is one source of truth.
- [ ] T043 [US1] Move every route under `src/app/[locale]/`: the landing page, `tool/layout.tsx`,
      `tool/page.tsx`, and the four tool pages (`chunks`, `compare`, `queries`, `confusable`).
      Reduce `src/app/layout.tsx` to `html`/`body` only, and put the locale provider, navbar, and
      footer slot in `src/app/[locale]/layout.tsx`.
- [ ] T044 [US1] Extract every visible string into `src/messages/en.json`, grouped by surface
      (`nav.*`, `footer.*`, `tools.*`, `notice.*`, `docs.*`). Covers the landing components, the
      tool shell, and every feature `ui/` component carrying copy. No visible string may remain
      inline.
- [ ] T045 [P] [US1] Write `src/messages/es.json` with the same key set, translated. Locale
      display names stay in their own language ("English", "Español") and are never translated —
      a Spanish speaker scans for "Español", not for "Spanish" written in a language they cannot
      read ([data-model.md](./data-model.md), Locale).
- [ ] T046 [US1] Write `src/messages/parity.test.ts` asserting both catalogues have identical key
      sets, failing with the offending keys named in both directions. This is the only thing
      enforcing FR-059 — typed keys catch a reference to a key that exists nowhere, not a key
      present in English and missing in Spanish (research.md Finding 2).
- [ ] T047 [P] [US1] Build `src/features/localization/ui/LocaleSwitcher.tsx` using T037's
      `swapLocale` so it lands on the equivalent page rather than a generic entry point (FR-055).
      Navigate client-side; a full reload would defeat T038–T040 by discarding module scope.
- [ ] T048 [US1] Build the English-only notice and place it once in the tool shell
      (`src/app/[locale]/tool/layout.tsx`), where every surface FR-062 names already lives, and
      remove the tooltip presentation from `src/features/retrieval/ui/ModelStatus.tsx`. Reuse the
      callout pattern already established by the chunk-cap notice in
      `src/features/confusability/ui/ConfusablePairs.tsx` — bordered inset strip with a warning
      glyph. The craft floor bans coloured left or right borders above 1px on cards and callouts;
      this codebase's emphasis pattern is a top border (`border-t-2 border-violet`). Identical
      treatment in both locales, deliberately — research.md Finding 5 records why this departs
      from D-013's "most prominent on `/es`" phrasing.
- [ ] T049 [US1] Rewrite the twelve hardcoded paths in `e2e/chunking.spec.ts`,
      `e2e/retrieval.spec.ts`, and `e2e/no-network-leak.spec.ts` to build their addresses from
      T037's helper instead of the literal `/tool/chunks`. `playwright.config.ts` already sets
      `baseURL`, so only the path prefix was ever the problem — leave the host alone.
- [ ] T050 [US1] Handle the two address edge cases: a request naming no locale, including a
      bookmark from v2 such as `/tool/chunks`, resolves to the English equivalent (FR-057); a
      request naming an unsupported locale such as `/fr/tool/chunks` does not render a
      half-translated or empty interface (FR-058).
- [ ] T051 [US1] Manual validation: run [quickstart.md](./quickstart.md)'s Story 1 section —
      every string in the requested language; switching language keeps the pasted document and
      the completed analysis with no repeated model load (FR-055, FR-056, and the point of
      T038–T040); the English-only notice legible without interaction in both locales; a Spanish
      document read under the Spanish interface warned about in Spanish; unsupported and
      unlocalised addresses both handled.

**Checkpoint**: The application is bilingual and honest about what it analyses. Shippable alone.

---

## Phase 4: User Story 2 - Learn what the tool measures and how to act on it (Priority: P2)

**Goal**: A documentation page that teaches RAG, each tool, a diagnostic path, and the concepts
underneath — in both languages.

**Independent Test**: Open the documentation in each language; a reader who has never used Aguja
can say what each tool measures, work an example, and follow the troubleshooting path in order
without consulting anything else.

- [ ] T052 [US2] Define the content shape in `src/features/documentation/content/types.ts`: the
      `DocSectionId` union (primer, one per tool, troubleshooting, concepts), the `DocSection`
      type, and a single exported ordered list of ids that both locales render from. Order lives
      outside the content, so two files cannot disagree about it, and
      `Record<DocSectionId, DocSection>` makes a missing section a compile error rather than a
      review miss (FR-069, SC-025).
- [ ] T053 [US2] Check the RAG primer's material against current sources before writing it — web
      search, not memory. Recorded as an assumption in spec.md and an open item in research.md:
      knowledge of the retrieval field carries a training cutoff earlier than this feature, and
      the primer is the one place where writing from memory risks shipping something quietly out
      of date. Note what was checked and when.
- [ ] T054 [US2] Write `src/features/documentation/content/en.ts`: the primer (FR-065); one
      section per tool stating what it measures, how to read its output, and a worked example with
      specific values (FR-066); the troubleshooting path starting from a passage not being
      retrieved, giving an ordered sequence of checks each naming the tool that answers it
      (FR-067); and the concepts section covering embeddings, cosine similarity, the 256-token
      truncation limit and its consequence for long chunks, and why the model is English-only
      (FR-068).
- [ ] T055 [P] [US2] Write `src/features/documentation/content/es.ts` with the same sections. The
      type guarantees none is missing; nothing guarantees the Spanish says what the English says,
      so read them against each other (quickstart.md, Owed before this is done).
- [ ] T056 [US2] Build `src/app/[locale]/docs/page.tsx` and the section rendering in
      `src/features/documentation/ui/`, driving order from T052's exported list. Long-form reading
      layout — this page is prose, not a tool, and should not inherit the tool shell's split-pane
      density.
- [ ] T057 [US2] Manual validation: run quickstart.md's Story 2 section — the primer readable
      cold, every tool section carrying a worked example, the troubleshooting path complete with a
      named tool at each step, the concepts section explaining truncation, and the same sections
      in the same order in both languages.

**Checkpoint**: The tool teaches itself, in both languages.

---

## Phase 5: User Story 3 - Move around the site and see what it is built on (Priority: P3)

**Goal**: Grouped navigation to all four tools from anywhere, plus a footer carrying the privacy
guarantee and provenance.

**Independent Test**: From any page, open the tools menu and reach each of the four tools; the
footer states the privacy guarantee, names the model and stack with licences, and links the
repository.

- [ ] T058 [US3] Restructure `src/app/_components/Navbar.tsx`: a grouped "Tools" menu listing the
      four shipped tools, a documentation link, the locale switcher from T047, the theme toggle,
      and the primary call to action (FR-070, FR-071). The menu MUST open, move, and select by
      keyboard alone — quickstart.md's Story 3 checks this explicitly. Each tool link resolves in
      the language currently being read, via T037's helper.
- [ ] T059 [P] [US3] Build `src/app/_components/Footer.tsx` and mount it in
      `src/app/[locale]/layout.tsx`: the statement that all processing happens in the visitor's
      browser and no document leaves the device (FR-072); the embedding model and principal stack
      components named with their licences; and a link to `github.com/ttrotta/aguja` (FR-073). It
      MUST NOT repeat the tool navigation the Tools menu already provides (FR-074).
- [ ] T060 [US3] Manual validation: run quickstart.md's Story 3 section — all four tools reachable
      from any page in at most two interactions (SC-026), the menu operable by keyboard, and the
      footer carrying the privacy guarantee, provenance, and repository link without duplicating
      tool navigation.

**Checkpoint**: All three stories complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T061 Run `pnpm lint` and `pnpm typecheck` across the full changed set; fix any findings.
      `typecheck` is load-bearing here beyond the usual — it is what enforces documentation
      section parity (T052), so a green run is part of FR-069's evidence, not just hygiene.
- [ ] T062 Run the Impeccable design detector over every changed UI file:
      `node ~/.claude/skills/impeccable/scripts/detect.mjs --json <files>`. **Note the path** — the
      skill is installed at user level, not in the project. Feature 002's equivalent task (T032)
      was skipped after the script was looked for at the project-relative path tasks.md assumed
      and reported missing; it was there all along. Include the v2 UI files that never got this
      pass.
- [ ] T063 Run `pnpm test` (both Vitest projects, including T036's domain tests and T046's parity
      test) and `pnpm test:e2e` (full Playwright suite with T049's rewritten paths); both must be
      green. The constitution requires this before any task counts as complete, not only at the
      end.
- [ ] T064 Run quickstart.md's full manual pass end to end, including its three "Owed before this
      is done" items: the RAG primer checked against current sources (T053), the real worker
      confirmed to survive a locale switch rather than only the module-scope stand-in the probe
      used, and both languages read against each other for meaning rather than presence.
- [ ] T065 Update `CLAUDE.md`: project state moves from "v3 is specified but not built" to built,
      the feature list under `src/features/` gains `localization` and `documentation`, and the
      route description reflects the locale segment. The constitution requires CLAUDE.md be kept
      consistent with it.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T035)** — blocks everything; next-intl must exist before T042.
- **Foundational (T036–T041)** — blocks all three stories. T037 blocks T042, T047, T049, T058.
  T038–T040 are what make FR-056 achievable at all.
- **US1 (T042–T051)** — depends on Foundational. Blocks US2, because documentation ships in both
  languages and needs the message and routing infrastructure.
- **US2 (T052–T057)** — depends on US1. Blocks US3 only through T058's documentation link.
- **US3 (T058–T060)** — depends on US1 for the switcher and locale-aware links, and on US2 for the
  documentation link to point somewhere.
- **Polish (T061–T065)** — after all stories.

### Within Each Phase

- T036 before T037 — the test must be observed failing first (Principle II, non-negotiable).
- T038 before T039 — the store must exist before the provider reads from it.
- T044 before T045 and T046 — the English catalogue is the key set the others are checked against.
- T052 before T054 and T055 — the type must exist before content is written into it.
- T053 before T054 — check sources before writing the primer, not after.

### Parallel Opportunities

- T036 can start immediately alongside T038 — different files, no shared dependency.
- T045 and T047 run in parallel once T044 lands.
- T055 runs alongside T056 once T052 and T054 land.
- T059 runs alongside T058 — different files.

## Parallel Example: Foundational

```text
Together:  T036 (localization domain tests)
           T038 (session store)
Then:      T037 (implement domain)  |  T039 → T040 (rewire session, worker singleton)
Then:      T041 (verify nothing regressed)
```

## Parallel Example: User Story 1

```text
First:     T042 → T043 → T044
Together:  T045 (Spanish catalogue)
           T047 (locale switcher)
Then:      T046, T048, T049, T050
Finally:   T051 (manual validation)
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup
2. Phase 2: Foundational — **critical**, and the only place FR-056 is won or lost
3. Phase 3: User Story 1
4. **Stop and validate**: T051, `pnpm test:e2e` green
5. A bilingual interface that is honest about its English-only analysis is shippable on its own

### Incremental Delivery

1. Setup + Foundational → session survives remounts, locale functions tested; nothing visible yet
2. Add US1 → validate → the application is bilingual — MVP
3. Add US2 → validate → the documentation ships in both languages
4. Add US3 → validate → navigation and provenance
5. Polish → both compile-time parity guarantees proven, full suite green, CLAUDE.md consistent

### Notes

- [P] tasks touch different files with no dependency on incomplete work.
- T036 must be written, run, and observed failing before T037. Principle II is non-negotiable, not
  a style preference.
- T040's laziness is not an optimisation. Getting it wrong ships a 23 MB download to every landing
  page visitor.
- Commit after each checkpoint, not after each task — matching how features 001 and 002 were
  committed.
- Stop at any checkpoint to validate a story independently before continuing.
