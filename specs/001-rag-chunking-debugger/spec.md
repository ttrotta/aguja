# Feature Specification: RAG Chunking Debugger

**Feature Branch**: `001-rag-chunking-debugger`

**Created**: 2026-07-25

**Status**: Draft

**Input**: Retrieval debugger — visualize how a document is split into chunks across four
strategies, and rank those chunks against a query so the user can see why a passage is or is not
retrieved.

## Overview

Retrieval-augmented systems fail quietly. A passage sits in the document, the search does not
return it, and nothing explains why. The cause is normally invisible: a chunk boundary cut the
passage in half, the chunk is so large that the relevant sentence is diluted, or the paragraph
split produced one chunk for the entire file.

Aguja makes that visible. It is a debugger, not a retriever — its job is to explain *relative*
ranking behavior, never to be the best search engine.

Governing decisions: [D-002](../../docs/decisions.md) (browser-only inference),
[D-003](../../docs/decisions.md) (retrieval included, not visualization alone),
[D-005](../../docs/decisions.md) (paste-only, no persistence).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See where the cuts land (Priority: P1)

A developer pastes a document, picks a chunking strategy, adjusts its parameters, and sees the
document redrawn with every chunk boundary marked — where each chunk starts, where it ends, how
large it is. Switching strategy or changing a parameter moves the boundaries immediately.

**Why this priority**: This is the irreducible core. It answers "what did my splitter actually do
to my document," which no current tool shows. Per the constitution it MUST remain independently
shippable: if the budget collapses, this ships alone and is still useful.

**Independent Test**: Paste a document, cycle through all four strategies, and confirm the
rendered boundaries match the chunk list. Requires no query and no ranking.

**Acceptance Scenarios**:

1. **Given** an empty editor, **When** the user pastes 3,000 characters of plain text and selects
   "fixed size by characters" with size 500, **Then** the document renders with 6 chunks marked,
   each labeled with its index and character length.
2. **Given** a rendered document under "fixed size by characters", **When** the user changes the
   size from 500 to 1,000, **Then** the boundaries redraw to show 3 chunks without the user
   re-pasting the document.
3. **Given** a rendered document, **When** the user switches to "fixed size with overlap" with
   size 500 and overlap 100, **Then** the regions shared between consecutive chunks are visually
   distinguished from non-overlapping regions.
4. **Given** a document containing no blank lines, **When** the user selects "by paragraphs",
   **Then** the view shows exactly one chunk spanning the whole document, and a notice explains
   that the strategy found no paragraph separators.
5. **Given** any rendered chunking, **When** the user selects a chunk, **Then** that chunk's exact
   text, character range, and character count are shown.

---

### User Story 2 - Ask why a passage is not found (Priority: P2)

The developer types the query that fails against their real system. Aguja embeds each chunk and
the query locally, then lists the chunks ranked by similarity, each with its score and its
position in the document. The developer can see that the passage they expected sits at rank 7
with a low score, and why.

**Why this priority**: This is what makes Aguja a debugger rather than an illustration (D-003).
It depends on P1 being in place, and it is what gets cut first if the budget tightens.

**Independent Test**: With a chunked document, submit a query and confirm the ranking is ordered
by descending score and that scores are reproducible across repeated runs.

**Acceptance Scenarios**:

1. **Given** a chunked document and a loaded model, **When** the user submits a query, **Then**
   every chunk appears in a list ordered by descending similarity score, each showing its score
   and its document position.
2. **Given** a ranked result list, **When** the user selects a result, **Then** the corresponding
   chunk is highlighted in the document view.
3. **Given** a query has been run, **When** the user runs the identical query again on the
   identical document and strategy, **Then** the scores are identical.
4. **Given** two chunks with identical similarity scores, **When** results are ordered, **Then**
   the chunk appearing earlier in the document is ranked first.
5. **Given** the user opens Aguja for the first time, **When** the model begins downloading,
   **Then** labeled progress is shown stating what is being downloaded and how far along it is.
6. **Given** a chunk longer than the model's input limit, **When** it is embedded, **Then** the
   chunk is flagged in the results as truncated, showing how much of it was ignored.

---

### User Story 3 - Compare two strategies side by side (Priority: P3)

The developer suspects a different chunking strategy would rank their passage higher. They pick
two strategies, and Aguja shows the same document and the same query scored under both, so the
difference in rank for a given passage is directly visible.

**Why this priority**: It turns the tool from "shows you a problem" into "shows you which fix
works." Valuable, but P1 and P2 each deliver standalone value without it.

**Independent Test**: Configure two strategies, run one query, and confirm both ranked lists are
shown against the same document and query.

**Acceptance Scenarios**:

1. **Given** a document and a query, **When** the user selects two strategies to compare, **Then**
   both rankings are displayed simultaneously with their scores.
2. **Given** a side-by-side comparison, **When** the user selects a passage of the source text,
   **Then** the rank and score of the chunk containing that passage is indicated on both sides.
3. **Given** a comparison is active, **When** the user looks for a way to add a third strategy,
   **Then** the interface does not offer one.

---

### User Story 4 - Share the finding (Priority: P4)

The developer produces a single image summarizing what they found — the strategy, its parameters,
and the resulting ranking — to paste into an issue or a message.

**Why this priority**: Distribution, not diagnosis. Nothing else depends on it.

**Independent Test**: Produce the image from a completed query and confirm it contains the
strategy, its parameters, and the top-ranked chunks with scores.

**Acceptance Scenarios**:

1. **Given** a completed query, **When** the user requests a summary image, **Then** an image file
   is generated containing the strategy name, its parameters, the query, and the top-ranked
   chunks with their scores.
2. **Given** a summary image is generated, **When** it is produced, **Then** it is created on the
   user's device and never uploaded.

---

### Edge Cases

**Document input**

- Empty document: strategies produce zero chunks; the interface states that nothing has been
  pasted rather than rendering an empty result.
- Document shorter than one chunk size: yields exactly one chunk spanning the whole text.
- Document exceeding the size cap: input is refused at the cap, showing current and maximum
  character counts; the document is never silently truncated.
- Whitespace-only document: treated as empty.
- Document with no blank lines under "by paragraphs": one chunk, with an explanatory notice. This
  is a headline failure mode the tool exists to expose.
- Document with runs of consecutive blank lines: runs collapse to a single separator; empty
  chunks are never produced.

**Parameters**

- Overlap greater than or equal to chunk size: rejected before chunking, since it either
  duplicates content indefinitely or fails to advance.
- Chunk size of zero or negative: rejected.
- Chunk size larger than the document: one chunk.

**Retrieval**

- Query submitted before the model has finished loading: queued and run on completion, or the
  control is disabled with the reason stated — never silently ignored.
- Empty query: not submittable.
- Model download fails, or the user is offline on first visit: an explicit error explains that the
  model could not be retrieved and that chunk visualization still works for the three strategies
  that need no model.
- Chunk exceeding the model's token limit: embedded truncated, and flagged as such.
- Ties in similarity score: broken by ascending chunk position.

**Session**

- Page reload or tab close with a document present: the user is warned that work will be lost
  (D-005 — there is no persistence by design).

## Requirements *(mandatory)*

### Functional Requirements

**Document input**

- **FR-001**: System MUST accept plain text pasted directly into the interface.
- **FR-002**: System MUST NOT offer file upload of any kind in v1 (D-005).
- **FR-003**: System MUST enforce a maximum document size and display the current character count
  against that maximum at all times.
- **FR-004**: System MUST warn the user before the page is unloaded while a document is present,
  since no work is persisted.

**Chunking**

- **FR-005**: System MUST provide exactly four chunking strategies: fixed size by characters,
  fixed size with overlap, by paragraphs, and by tokenization units.
- **FR-006**: System MUST render the source document with the boundaries of the active strategy
  drawn over it, each chunk identified by index and character length.
- **FR-007**: System MUST recompute and redraw boundaries when the strategy or any parameter
  changes, without requiring the document to be re-entered.
- **FR-008**: System MUST visually distinguish overlapping from non-overlapping regions under the
  overlap strategy.
- **FR-009**: System MUST validate strategy parameters before chunking and reject invalid
  combinations with a message naming the constraint violated.
- **FR-010**: For every strategy without overlap, concatenating the produced chunks in order MUST
  reproduce the source document exactly. This is the correctness property proving no text was
  lost at a boundary.
- **FR-011**: Chunking under the three non-tokenizer strategies MUST work before, and
  independently of, any model loading.

**Retrieval**

- **FR-012**: System MUST compute an embedding for every chunk and for the query entirely within
  the user's browser (D-002).
- **FR-013**: System MUST NOT transmit document text, query text, or derived embeddings to any
  server or third-party service.
- **FR-014**: System MUST rank all chunks against the query by similarity, displaying each chunk's
  score and its position within the document.
- **FR-015**: System MUST order tied scores by ascending chunk position, so ordering is fully
  deterministic.
- **FR-016**: System MUST produce identical scores for identical (document, strategy, parameters,
  query) inputs across runs.
- **FR-017**: System MUST identify any chunk whose content exceeded the model's input limit, and
  indicate how much of the chunk was not embedded.
- **FR-018**: System MUST link a selected result to its location in the document view.

**Model loading**

- **FR-019**: System MUST display labeled progress during the first-visit model download,
  identifying what is downloading and its completion state (D-002).
- **FR-020**: System MUST report a failed model load explicitly and state which functionality
  remains available.
- **FR-021**: System MUST NOT require an API key, an account, or any credential.

**Comparison**

- **FR-022**: System MUST support comparing exactly two strategies against the same document and
  query, and MUST NOT offer comparison of three or more.
- **FR-023**: System MUST indicate, for a user-selected passage, the rank and score of its
  containing chunk under each of the two compared strategies.

**Sharing**

- **FR-024**: System MUST generate a summary image containing the strategy, its parameters, the
  query, and the top-ranked chunks with scores.
- **FR-025**: The summary image MUST be generated on the user's device and MUST NOT be uploaded.

**Language**

- **FR-026**: System MUST state that the embedding model is English-only, and MUST NOT present
  scores for non-English documents as though they were meaningful.

### Key Entities

- **Document**: The pasted text. Modeled as content plus length — deliberately not as a file, so
  that adding file upload later does not require reshaping the model (D-005).
- **Chunk**: A contiguous span of the document. Carries its index, its start and end offsets in
  the source, its text, and its character length.
- **Chunking Strategy**: A named method plus its parameters, taking a document and producing an
  ordered list of chunks.
- **Embedding**: A fixed-length vector of numbers derived from a piece of text. Plain data, with
  no knowledge of how it was produced.
- **Query**: The user's search text, embedded the same way a chunk is.
- **Ranked Result**: A chunk paired with its similarity score against the query, its rank
  position, and whether it was truncated during embedding.
- **Comparison**: Two chunking strategies evaluated against one document and one query.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user who has never seen the tool can paste a document and see chunk boundaries
  without reading any instructions.
- **SC-002**: Changing a chunking parameter redraws boundaries in under 100 ms for a document at
  the maximum supported size.
- **SC-003**: Chunk visualization for the three non-tokenizer strategies is usable before any
  model has loaded.
- **SC-004**: On a first visit over a 10 Mbps connection, the model is ready for queries within 30
  seconds, with progress visible for the entire wait.
- **SC-005**: On repeat visits the model is served from the browser cache and requires no new
  download.
- **SC-006**: A query over a 100-chunk document returns a complete ranking within 15 seconds on a
  mid-range laptop.
- **SC-007**: Re-running an identical query on identical inputs returns identical scores, 100% of
  the time.
- **SC-008**: Concatenating the chunks of any non-overlap strategy reproduces the source document
  exactly, for every document tested.
- **SC-009**: Inspection of network traffic during a full session shows no request carrying
  document or query content.
- **SC-010**: A user who pastes a document with no blank lines and selects paragraph chunking can
  state why they got a single chunk, from the interface alone.

## Assumptions

Choices made where the source material did not specify. Each is a reasonable default, not a
settled decision — flag any that is wrong before planning begins.

- **Maximum document size is 50,000 characters.** D-002 requires a cap but does not set one. This
  is large enough for a realistic technical document and small enough that in-browser embedding
  stays within SC-006.
- **Default parameters** are 500 characters for fixed-size strategies, with 100 characters of
  overlap for the overlap strategy.
- **Paragraph separator** is one or more blank lines.
- **"Tokenization units"** means the tokenizer belonging to the embedding model, so displayed
  splits correspond to what the model actually sees. This strategy therefore depends on the model
  download, unlike the other three — see FR-011 and SC-003.
- **Similarity is cosine similarity** over normalized embeddings, reported on a 0–1 scale.
- **All chunks are ranked and displayed**, not a top-N cut. Seeing that the expected chunk ranked
  34th is the diagnosis; hiding it defeats the purpose.
- **Target users are developers building retrieval systems**, on desktop browsers. Mobile layout
  is not a v1 goal.
- **Documents are English.** The model is English-only by decision; non-English text is not
  blocked, but its scores are not trustworthy and the interface must say so (FR-026).
- **The summary image is downloaded**, not shared through any hosted service, which follows
  directly from Principle V.

## Dependencies

- An embedding model that runs in the browser, plus its tokenizer, retrieved on first visit and
  cached thereafter.
- No backend service, no database, no authentication provider.
