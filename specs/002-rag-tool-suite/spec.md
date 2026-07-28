# Feature Specification: RAG Tool Suite

**Feature Branch**: `002-rag-tool-suite`

**Created**: 2026-07-28

**Status**: Draft

**Input**: Open v2 as a suite of retrieval-analysis tools sharing one document and one loaded model per session, adding phrasing-sensitivity analysis and a near-duplicate map. Governed by D-010 and constitution 1.1.0.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Move between tools without losing your work (Priority: P1)

Someone debugging a retrieval system pastes a document once and then examines it from several
angles. They look at where the chunk boundaries fall, then want to check something else about the
same document. Today that means one screen with a mode checkbox; they need a list of tools they
can move between, keeping the document and the loaded model in place.

**Why this priority**: Every other story depends on it, and it delivers value alone. Even with
only the two capabilities that already exist — inspecting chunks and comparing two strategies —
splitting them into separately addressable tools with a visible list is a real improvement over a
checkbox that silently reconfigures the screen. It is also the story that establishes whether
sharing the document and the model across tools works at all, which is the expensive thing to get
wrong.

**Independent Test**: Paste a document, inspect its chunks, move to strategy comparison, and
return. The document is still there, the model does not download again, and each tool was
reachable by its own address.

**Acceptance Scenarios**:

1. **Given** a pasted document and a loaded model, **When** the user moves from one tool to
   another, **Then** the document is still present and no model download begins.
2. **Given** the user is in any tool, **When** they look at the tool list, **Then** the tool they
   are currently using is distinguishable from the others.
3. **Given** the user has moved between three tools, **When** they use the browser's back
   control, **Then** they return to the previous tool rather than leaving the suite.
4. **Given** a tool's address, **When** it is opened directly in a new tab, **Then** that tool
   opens, with no document, since nothing survives a reload.
5. **Given** the user opens the suite without naming a tool, **When** the page loads, **Then**
   they land on chunk inspection.
6. **Given** the user is comparing strategies, **When** they look for a way to add a third,
   **Then** none exists.

---

### User Story 2 - Find out whether retrieval survives rephrasing (Priority: P2)

Someone has a retrieval system that finds the right passage when they ask their own test
question. They suspect — but cannot see — that a real user asking the same thing differently
would miss it. They write the question several ways and want to know which chunks hold their
position and which collapse.

**Why this priority**: This is the most common silent failure in a retrieval system that appears
to work. It is invisible today, and nothing in the existing tool reveals it: a single query
produces a single ranking, which always looks decisive. It is second because it depends on the
shared-document foundation from Story 1.

**Independent Test**: Paste a document, enter the same question in three phrasings, and see each
chunk's rank under each phrasing plus how far it moved. Delivers the answer to "is my retrieval
brittle?" without any other tool.

**Acceptance Scenarios**:

1. **Given** a chunked document and three phrasings of one question, **When** the user runs the
   analysis, **Then** every chunk shows its rank under each phrasing and how far its rank moved
   between the best and worst case.
2. **Given** results are shown, **When** the user scans them, **Then** the chunks whose rank
   moved most appear first.
3. **Given** the user has entered only one phrasing, **When** they try to run the analysis,
   **Then** it is refused with a statement that comparing phrasings needs at least two.
4. **Given** a chunk whose text was cut short before embedding, **When** it appears in the
   results, **Then** that fact is visible, because its ranking was decided without its tail.
5. **Given** the same document and the same phrasings in the same order, **When** the analysis is
   run twice, **Then** the output is identical.

---

### User Story 3 - Find out which chunks your retriever cannot tell apart (Priority: P3)

Someone has two passages in their corpus that a reader would never confuse — one says the refund
window is 30 days, the other says 14 — but their retriever scores them as nearly the same thing.
Whichever comes back for a question about refunds is close to arbitrary. They want the pairs
their retriever cannot separate, so they can see where its judgement is unreliable.

The same view answers the redundancy question, because true duplicates also score high: chunks
produced with overlap, and paraphrases of one fact, both show up. What distinguishes the two
cases is whether the pair shares wording, so the analysis reports lexical overlap alongside
similarity. High similarity with high shared wording is duplication — wasted context. High
similarity with little shared wording is confusion — the retriever cannot tell two different
statements apart, which is the more dangerous of the two.

**Why this priority**: A severe and completely invisible failure, but narrower than phrasing
brittleness, and the safest to build last once the suite's foundation is proven.

**Independent Test**: Paste a document containing two passages that state contradictory versions
of the same fact, run the analysis, and see them surfaced as a pair the retriever cannot
separate, marked as low shared wording rather than as duplicates.

**Acceptance Scenarios**:

1. **Given** a chunked document, **When** the user runs the analysis, **Then** chunk pairs at or
   above the similarity threshold are listed, most similar first.
2. **Given** a listed pair, **When** the user reads it, **Then** both the similarity and the
   shared wording between the two chunks are shown, so duplication is distinguishable from
   confusion.
3. **Given** two chunks that state contradictory versions of one fact, **When** they score above
   the threshold, **Then** they are presented as chunks the retriever cannot separate, and never
   described as duplicates or as identical content.
4. **Given** the results, **When** the user adjusts the threshold, **Then** the listed pairs
   update to match the new value.
5. **Given** a document producing more chunks than the analysis will compare, **When** the user
   runs it, **Then** they are told the limit was reached and what was left out.
6. **Given** a document producing one chunk or none, **When** the user runs the analysis,
   **Then** they are told there are no pairs to compare rather than shown an empty result.
7. **Given** an analysis is running over many chunks, **When** it is in progress, **Then** the
   interface stays responsive and the user can tell work is happening.
8. **Given** the same document and threshold, **When** the analysis is run twice, **Then** the
   pairs appear in identical order.

---

### Edge Cases

- A tool that needs a document is opened directly by address with nothing pasted: the tool
  explains what it needs rather than showing an empty or broken analysis.
- The model is still downloading when the user moves to a tool that needs it: the tool reports
  the download's progress rather than appearing idle or failing.
- Two of the phrasings entered are identical: the analysis still runs, and identical phrasings
  necessarily produce identical rankings, which must not read as an error.
- A phrasing is left blank among several filled ones: it is ignored rather than treated as an
  empty query.
- Every chunk is truncated before embedding: the results remain valid, but the extent of the
  truncation is visible, since it affects every ranking shown.
- The document is not English: the existing warning that scores are not meaningful applies to
  these tools too, not only to the original query view.
- The user navigates away while an analysis is running: leaving is not blocked, and returning
  does not show a stale or half-finished result as if it were complete.
- The similarity threshold is set high enough that no pair qualifies: the tool states that
  nothing met the threshold rather than showing an empty list without explanation.
- Two chunks contradict each other on the same fact: they score very high and must appear as a
  pair the retriever cannot separate, never as duplicated content. This is the case the analysis
  exists to catch, not an error in it.
- Two chunks share almost all their wording because of overlap chunking: they appear with high
  shared wording, marking them as genuine duplication rather than confusion.

## Requirements *(mandatory)*

### Functional Requirements

Numbering continues from the v1 specification, which ends at FR-026, because product and
governance documents cite those identifiers directly.

**Suite and shared session**

- **FR-027**: The tool area MUST present a persistent list of the available tools, in which the
  currently active tool is visually distinguishable from the rest.
- **FR-028**: Each tool MUST be reachable at its own address, so it can be bookmarked, shared,
  and reached with browser back and forward controls.
- **FR-029**: Opening the tool area without naming a tool MUST lead to chunk inspection.
- **FR-030**: A document pasted in one tool MUST remain available in every other tool for the
  rest of the session, without being pasted again.
- **FR-031**: The embedding model MUST be downloaded and initialised at most once per session,
  regardless of how many times the user moves between tools.
- **FR-032**: An embedding already computed for a given chunk text MUST be reused rather than
  recomputed when another tool needs the embedding of identical text.
- **FR-033**: No part of the shared session — document, embeddings, or results — MAY survive a
  page reload, upholding the existing no-persistence decision.
- **FR-034**: Pairwise strategy comparison MUST become its own tool rather than a mode toggle
  inside chunk inspection, and the interface MUST NOT offer a third strategy.
- **FR-035**: All interface copy across the application MUST be in English.
- **FR-036**: A tool that requires a document or a loaded model, when opened without one, MUST
  state what is missing rather than present an empty or non-functional analysis.

**Query sensitivity**

- **FR-037**: Users MUST be able to enter between two and five phrasings of one question.
- **FR-038**: The system MUST rank every chunk against every entered phrasing.
- **FR-039**: For each chunk, the system MUST report its rank under each phrasing and its rank
  spread — the difference between its worst and best rank across the phrasings.
- **FR-040**: Results MUST be ordered by rank spread, largest first, so the most
  phrasing-sensitive chunks are seen without searching.
- **FR-041**: The system MUST refuse to run with fewer than two non-empty phrasings, and MUST
  state that comparing phrasings requires at least two.
- **FR-042**: Chunks whose text was truncated before embedding MUST be marked in the results, on
  the same grounds as the existing ranked view: their position was decided without their tail.

**Confusable chunks**

- **FR-043**: The system MUST compare every chunk against every other chunk and surface the pairs
  whose similarity reaches a threshold.
- **FR-044**: For every surfaced pair, the system MUST report both the similarity between the two
  chunks and the wording they share, so that duplication and confusion are distinguishable.
- **FR-045**: The system MUST NOT describe a surfaced pair as duplicated, identical, or repeated
  content on the strength of similarity alone. Measurement against the model in use shows that
  chunks stating contradictory versions of one fact score higher than chunks sharing most of
  their literal text, so a similarity-only claim of duplication would be false in exactly the
  cases that matter most.
- **FR-046**: The threshold MUST be adjustable by the user, and changing it MUST update which
  pairs are listed.
- **FR-047**: The default threshold MUST be derived from measurement against the embedding model
  actually in use, and both the value and the measurement behind it MUST be recorded in this
  feature's documentation rather than left as an unexplained constant.
- **FR-048**: Results MUST be presented as a ranked list of pairs, never as a full matrix.
- **FR-049**: The number of chunks compared MUST be capped, and when a document exceeds the cap
  the user MUST be told the cap was reached and what was not compared. Silent truncation of the
  comparison is prohibited.
- **FR-050**: While the comparison is running, the interface MUST remain responsive and MUST
  indicate that work is in progress.
- **FR-051**: When no pair reaches the threshold, or the document yields fewer than two chunks,
  the system MUST say so explicitly rather than render an empty result.

**Determinism**

- **FR-052**: For both new tools, identical inputs MUST produce identical output on every run.
- **FR-053**: Ties MUST be broken deterministically and explicitly: chunk rankings by ascending
  chunk position as in v1; rank-spread ordering by ascending chunk position; and confusable pairs
  by descending similarity, then ascending first chunk position, then ascending second chunk
  position. Ordering MUST NOT depend on sort stability.

### Key Entities

- **Session**: What the user is working on right now — one pasted document, one initialised
  model, and the embeddings computed so far. Lives only until the page reloads. Shared by every
  tool; owned by none of them.
- **Tool**: One named analysis with its own address and its own working state. Reads the session;
  never writes to it beyond the embeddings it contributes.
- **Phrasing set**: Two to five alternative wordings of a single question, considered together.
  Order is stable, so results are reproducible.
- **Chunk rank profile**: For one chunk, its rank under each phrasing and the spread between its
  best and worst.
- **Chunk pair**: Two distinct chunks, the similarity between them, and the wording they share.
  Only pairs reaching the threshold are surfaced. The two measures together separate duplication
  (similar and sharing wording) from confusion (similar without sharing wording); similarity
  alone separates neither.

## Success Criteria *(mandatory)*

Numbering continues from the v1 specification, which ends at SC-010.

### Measurable Outcomes

- **SC-011**: With a document loaded and the model ready, moving from one tool to another
  presents the new tool ready for use within 1 second, and triggers no model download.
- **SC-012**: A user works across all four tools in one session while pasting their document
  exactly once.
- **SC-013**: With chunk embeddings already computed, a five-phrasing sensitivity analysis over a
  10,000-character document presents results within 5 seconds of submission.
- **SC-014**: A confusable-chunks analysis over a document at the chunk cap completes without the
  interface becoming unresponsive at any point, and reports progress throughout.
- **SC-015**: Running either new analysis twice on identical input produces identical output,
  100% of the time.
- **SC-016**: Every run that reaches the chunk cap tells the user it was reached and what was
  excluded — 100% of the time, with no silent case.
- **SC-017**: Given results from a five-phrasing analysis, a user can name the most
  phrasing-sensitive chunk within 10 seconds, without sorting or filtering anything themselves.
- **SC-018**: A user who opens any tool directly by address with nothing pasted understands what
  is missing without consulting documentation.
- **SC-019**: Given a document containing both an overlap-produced duplicate pair and a pair
  stating contradictory versions of one fact, a user can tell which is which from the results
  alone, without reading the two chunks in full.

## Assumptions

- **The chunk cap and the similarity threshold are measured, not assumed.** Both appear here as
  requirements to exist and be surfaced; their values come from measurement against the model
  actually in use, recorded in this feature's research. Guessing them would put an unexplained
  constant into the specification — and the measurement already overturned one assumption, since
  chunks sharing three quarters of their literal text score *lower* than chunks stating opposite
  versions of one fact.
- **The cost of comparing every chunk pair is not the constraint.** Measurement puts the
  comparison at roughly one second for two thousand chunks, while embedding that many chunks
  takes minutes. The cap therefore exists to bound embedding work, not pair comparison.
- **Similarity between chunks is reported on the same scale the existing ranked view uses.** The
  application already presents scores remapped to a 0–1 range rather than the raw range the
  calculation produces; the new tools follow that, so numbers stay comparable between screens.
- **Per-tool working state does not survive leaving a tool.** The document, the model, and
  computed embeddings are shared; a tool's own query text and results are not. Re-running is
  cheap once embeddings are cached, and sharing everything would make each tool's state depend on
  every other's.
- **Two to five phrasings is the useful range.** One cannot be compared. Beyond five, the result
  becomes a table nobody reads, and the point is to notice brittleness, not to benchmark.
- **The suite inherits every v1 constraint unchanged**: inference stays in the browser with no
  API key and no server; input is pasted plain text only; nothing persists across reloads; and
  the model remains English-only, with scores for other languages still marked as unreliable.
- **No new model is introduced.** Both new tools are computed from embeddings the existing model
  already produces, and from the tokenizer it already loads.
- **The existing chunk-inspection and comparison capabilities move without changing behaviour.**
  Their relocation into separate tools is a navigation change, not a redesign of what they do.
