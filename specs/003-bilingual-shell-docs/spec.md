# Feature Specification: Bilingual Shell and Documentation

**Feature Branch**: `003-bilingual-shell-docs`

**Created**: 2026-07-29

**Status**: Draft

**Input**: User description: "Navbar restructure with a grouped Tools menu and a Docs link; a new
footer carrying the privacy guarantee, model and stack credits, and the repository link; a
bilingual interface at `/es` and `/en`; and a new documentation page — a RAG primer, a section per
tool with worked examples, a troubleshooting path, and an embeddings concepts section — shipping in
both languages from the start."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read the interface in your own language without being misled about what it analyses (Priority: P1)

A Spanish-speaking developer opens Aguja. The whole interface — navigation, controls, results,
warnings — is available in Spanish, and in English for everyone else, each at its own address.
They can switch language from wherever they are without losing the document they pasted. At the
same time, and in the language they are actually reading, the interface says plainly that the
*analysis* is English-only: a Spanish document will still produce scores, and those scores are not
trustworthy.

**Why this priority**: It is the largest change in the feature and the only one carrying a
governance obligation. The constitution states that the interface MUST NOT imply the model handles
non-English text — and an interface translated entirely into Spanish implies precisely that unless
the limit is stated prominently and in that same language. It is also the foundation the
documentation rests on, since documentation ships in both languages from the start.

**Independent Test**: Can be fully tested with no other part of this feature built — visit the
Spanish and English addresses, confirm every visible string renders in the requested language,
confirm the language can be switched from any page while keeping the pasted document, and confirm
the English-only limit of the analysis is stated visibly rather than hidden behind a hover.

**Acceptance Scenarios**:

1. **Given** a visitor opens the Spanish address of any tool, **When** the page renders, **Then**
   every visible string is in Spanish and the English-only analysis limit is legible without
   hovering, expanding, or opening anything.
2. **Given** a visitor is on a Spanish tool page with a pasted document and a loaded model,
   **When** they switch the interface to English, **Then** they arrive at the equivalent English
   page, the pasted document and any completed analysis survive, and the model is not downloaded a
   second time.
3. **Given** a visitor requests the site without naming a language, **When** the page loads,
   **Then** they arrive at a valid language-specific page rather than an error or an untranslated
   one.
4. **Given** a visitor pastes a non-English document while reading the Spanish interface, **When**
   scores are shown, **Then** the interface states in Spanish that those scores are not
   trustworthy for that document.
5. **Given** a visitor requests a language the application does not support, **When** the request
   resolves, **Then** they are not shown a half-translated or empty interface.

---

### User Story 2 - Learn what the tool measures and how to act on it (Priority: P2)

Someone who has never debugged a retrieval system opens the documentation. They find a short,
current explanation of what RAG is and why chunking and retrieval decide whether a passage is
found. Then a section for each of the four tools: what it measures, how to read what it shows, and
a concrete worked example. Then a troubleshooting path that begins where real users begin — "the
passage is in my document and the search will not return it" — and names, in order, which tool
answers which question. Then the concepts underneath: embeddings, cosine similarity, the
truncation limit, and why the model is English-only. All of it in both languages.

**Why this priority**: The tools already surface findings that need interpretation — a similarity
figure, a rank spread across phrasings, a pair the retriever cannot separate. Without
documentation the visitor sees numbers and not meaning, and the product's whole claim is about
making invisible behaviour legible. It sits behind P1 because it ships in both languages and
therefore depends on the localisation being in place.

**Independent Test**: Open the documentation in each language and confirm that a reader who has
never used Aguja can, from the page alone, say what each tool measures, work through an example,
and follow the troubleshooting path in order without consulting anything else.

**Acceptance Scenarios**:

1. **Given** a reader with no retrieval background, **When** they read the opening primer,
   **Then** they can state what RAG is and why chunk boundaries affect whether a passage is
   retrieved.
2. **Given** a reader opens the section for any of the four tools, **When** they read it, **Then**
   they find what it measures, how to interpret its output, and at least one concrete worked
   example with specific values.
3. **Given** a reader whose passage is not being retrieved, **When** they follow the
   troubleshooting section, **Then** they are given an ordered sequence of checks, each naming the
   tool that answers it.
4. **Given** a reader on the documentation page, **When** they switch language, **Then** the
   equivalent content appears in the other language with the same sections in the same order.
5. **Given** a reader reaches the concepts section, **When** they read it, **Then** they can
   explain why a chunk longer than the model's input limit contributes nothing from its tail.

---

### User Story 3 - Move around the site and see what it is built on (Priority: P3)

A visitor on any page can reach any of the four tools from the main navigation without going back
to the landing page, can find the documentation, can change language, and can switch theme. At the
bottom of the page a footer states that everything runs in their own browser and that no document
leaves their device, names the model and the main pieces of the stack with their licences, and
links the source repository.

**Why this priority**: This is chrome. It makes the site navigable and its claims checkable, but
the tools and the documentation are usable without it, and it depends on the documentation page
existing before it can link to it.

**Independent Test**: From any page, open the tools menu and reach each of the four tools; confirm
the footer states the privacy guarantee, names the model and stack with licences, and links the
repository.

**Acceptance Scenarios**:

1. **Given** a visitor on any page, **When** they open the tools menu, **Then** all four shipped
   tools are listed and each one navigates to that tool in the language currently being read.
2. **Given** a visitor on any page, **When** they reach the footer, **Then** it states that all
   processing happens in their browser and that no document leaves the device.
3. **Given** a visitor reading the footer, **When** they look for provenance, **Then** the
   embedding model and the principal stack components are named with their licences and the source
   repository is linked.
4. **Given** the main navigation, **When** it renders, **Then** it offers the documentation, the
   language switch, the theme control, and the primary call to action.

---

### Edge Cases

- A visitor requests an unsupported language (for example a French address). The interface must
  not render half-translated or empty.
- A translated string is missing in one language. Silent fallback to the other language is a
  defect, because it produces a page that is mostly Spanish with stray English and gives the
  reader no signal that anything is wrong.
- A visitor switches language mid-session holding a pasted document, a loaded model, and a
  completed analysis. Losing that work without warning contradicts the existing decision that the
  visitor must be warned before work is lost.
- A visitor follows a bookmark from the previous version, whose address carries no language
  segment.
- A documentation section exists in one language and not the other.
- The interface language is Spanish and the pasted document is Spanish — the case where the
  mismatch between interface language and analysis language is most likely to mislead, and
  therefore the case the warning exists for.
- The tools menu is operated by keyboard only, or on a narrow viewport.
- The repository link is followed while offline, or the repository is unavailable.

## Requirements *(mandatory)*

### Functional Requirements

**Localisation**

- **FR-054**: The interface MUST be available in Spanish and in English, each reachable at its own
  distinct address.
- **FR-055**: Visitors MUST be able to switch the interface language from any page and arrive at
  the equivalent page in the other language, not at a generic entry point.
- **FR-056**: Switching the interface language MUST preserve the current session — the pasted
  document, the loaded model, and any analysis already produced — and MUST NOT cause the model to
  be downloaded again. Where preservation proves impossible, the visitor MUST be warned before the
  work is lost rather than losing it silently.
- **FR-057**: A request that names no language MUST resolve to a valid language-specific page,
  including addresses bookmarked from the previous version.
- **FR-058**: A request naming an unsupported language MUST NOT render a partially translated or
  empty interface.
- **FR-059**: Every visible interface string MUST exist in both languages. No visible string may
  appear in only one. **This supersedes FR-035**, which required all interface copy to be English.
- **FR-060**: Analysis behaviour MUST be identical in both languages. Chunking, scoring, ranking,
  and ordering MUST NOT vary with the interface language.

**Honest scope of the analysis**

- **FR-061**: The interface MUST state, in the language being read, that the analysis is
  English-only and that scores for non-English documents are not trustworthy.
- **FR-062**: That statement MUST be legible without hovering, expanding, or opening anything,
  wherever a document is accepted or scores are shown. It MUST NOT be presented only as a tooltip.
  This replaces the current tooltip presentation of FR-026 and does not weaken it.
- **FR-063**: The interface MUST NOT imply that changing the interface language changes what the
  analysis supports.

**Documentation**

- **FR-064**: The application MUST provide a documentation page, reachable from the main
  navigation, in both languages.
- **FR-065**: The documentation MUST open with a primer on what RAG is and what it is used for,
  understandable without prior retrieval knowledge.
- **FR-066**: The documentation MUST contain one section per shipped tool, each stating what the
  tool measures, how to read its output, and at least one concrete worked example.
- **FR-067**: The documentation MUST contain a troubleshooting path that starts from a passage not
  being retrieved and gives an ordered sequence of checks, naming the tool that answers each.
- **FR-068**: The documentation MUST explain embeddings, cosine similarity, the input truncation
  limit and its consequence for long chunks, and why the model is English-only.
- **FR-069**: Every documentation section MUST exist in both languages. A section present in one
  and absent in the other is a defect.

**Navigation shell**

- **FR-070**: The main navigation MUST give access to all four shipped tools from any page,
  grouped under a single entry rather than listed flat.
- **FR-071**: The main navigation MUST offer the documentation, the language switch, the theme
  control, and the primary call to action.
- **FR-072**: The application MUST present a footer stating that all processing happens in the
  visitor's own browser and that no document leaves their device.
- **FR-073**: The footer MUST name the embedding model and the principal stack components with
  their licences, and MUST link the source repository.
- **FR-074**: The footer MUST NOT duplicate the tool navigation already offered by the main
  navigation.

**Preserved behaviour**

- **FR-075**: All behaviour specified in the previous two versions MUST survive this feature —
  paste-only input, session-scoped state, no persistence across reloads, no transmission of
  document or query text, and the shared document and model across tools within a session.

### Key Entities

- **Locale**: A supported interface language. Has a stable identifier used in addresses, a display
  name shown in the switcher, and exactly one complete set of interface copy. Two exist: Spanish
  and English.
- **Message catalogue**: The complete set of translatable interface strings for one locale. Two
  catalogues must stay in step with each other; a key present in one and missing from the other is
  the defect FR-059 forbids.
- **Documentation section**: A titled unit of documentation content — the primer, one per tool,
  the troubleshooting path, and the concepts section. Each exists once per locale and holds the
  same position in both.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-020**: Every visible interface string renders in the requested language on every page, in
  both languages, with zero strings falling back to the other language.
- **SC-021**: A visitor can switch language from any page, land on the equivalent page, and keep
  their pasted document and completed analysis, with no repeated model download.
- **SC-022**: The English-only limit of the analysis is legible without any interaction on every
  surface that accepts a document or displays scores, in both languages.
- **SC-023**: A reader with no retrieval background can, after reading the documentation,
  correctly state what each of the four tools measures.
- **SC-024**: A reader can follow the troubleshooting path from first check to last, with a named
  tool at every step and no gap requiring outside knowledge.
- **SC-025**: Every documentation section exists in both languages, in the same order.
- **SC-026**: Any of the four tools is reachable from any page in at most two interactions.
- **SC-027**: The footer states the privacy guarantee, names the model and stack components with
  licences, and links the repository.
- **SC-028**: Every behaviour verified before this feature still holds after addresses change,
  demonstrated by the existing automated checks passing unmodified in intent.

## Assumptions

- **Two languages only.** Spanish and English. A third is out of scope; nothing in the design
  should make one impossible, but none is specified here.
- **The analysis stays English-only.** Recorded in D-013, which reconsidered and again rejected
  the multilingual model on download size and a halved token ceiling. This feature translates the
  interface and nothing else.
- **English is the fallback language.** When a request names no language, or an unsupported one,
  the visitor is served English unless a better signal is available from their own browser
  preferences.
- **Previous-version addresses redirect rather than break.** Bookmarks with no language segment
  resolve to the same page in the fallback language.
- **Documentation is static prose kept in the repository.** It is not user-editable, not fetched
  at runtime, and not generated from the code.
- **The RAG primer must be written from current sources.** The material is time-sensitive and
  should be checked against current references during implementation rather than written from
  memory.
- **Desktop remains the target.** Mobile is not a target per the product definition, so navigation
  is specified desktop-first while remaining operable by keyboard.
- **The repository is public** and its address is known when the site is built.

## Dependencies

- **D-013** — supersedes FR-035 and establishes that interface language and analysis language are
  different things. FR-059 and FR-061…FR-063 exist because of it.
- **D-014** — adds the localisation library to a stack the constitution declares fixed. Required
  before implementation begins.
- **Constitution amendment — done (1.1.0 → 1.2.0).** The constitution enumerated scope as "In v1",
  "Added in v2", and "Out"; this feature appeared in none of them. Amended before planning began:
  the scope list gains "Added in v3", the fixed stack gains a localisation entry, and the
  English-only paragraph now states what satisfies it once the interface itself is translated.
- **FR-026 is tightened, not replaced.** Its requirement survives; FR-062 raises how prominently it
  must be met.

## Out of Scope

- A multilingual embedding model, or any change to what the analysis can handle.
- Any third language.
- Translating the decision log, the specifications, or other repository documentation. This
  feature concerns the interface and the user-facing documentation page.
- Persisting the chosen language across sessions, which would conflict with the existing
  no-persistence decision.
- Mobile-specific navigation patterns.
