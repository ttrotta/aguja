# Decision log

Why Aguja is built the way it is. This records reasoning that would otherwise be lost — the
[specification](../specs/001-rag-chunking-debugger/spec.md) says *what* the tool does, this
says *why this and not something else*.

Entries are append-only. If a decision is reversed, a new entry supersedes the old one rather
than editing it away.

---

## D-001 — Build a retrieval debugger, not a prompting game

**Date**: 2026-07-25 · **Status**: Accepted

**Context.** The first concept for this project was a "prompt golf" game: reach a target model
output using the fewest tokens, with a public leaderboard. It had an obvious viral mechanic and
a clear scope.

Research into the space found the idea already occupied. [promptgolf.app](https://promptgolf.app/about)
implements exactly that mechanic — token minimization, target outputs, global leaderboard — and
is actively maintained. It is not alone: Promptle, PromptHeist, ChatJitsu, Gandalf and Prompt
Ninja form an established genre, mature enough that
[comparison articles between them](https://prompt-eval.com/en/blog/prompt-engineering-games)
already exist.

**Decision.** Drop the game. Build a debugger for chunking and retrieval instead — a space with
no comparable tool.

**Why.** The purpose of this project is to serve as portfolio work. Shipping the eighth entry in
a saturated genre produces the wrong story: "I cloned an existing site." Retrieval internals are
both unoccupied and closer to what the work actually demands.

**Consequences.** Narrower audience — this is a tool for people who build retrieval systems, not
for a general audience. Accepted deliberately: fewer users, but they are the ones who matter for
this project's purpose.

---

## D-002 — Run inference in the browser, accept zero API cost as a hard constraint

**Date**: 2026-07-25 · **Status**: Accepted

**Context.** The tool needs embeddings to rank chunks against a query. Two options: call a
hosted embeddings API, or run a small model locally via Transformers.js.

**Decision.** Run in the browser. No API key, no server-side inference.

**Why.** Three reasons compounding:

1. **Cost.** A hosted API means either paying per user — untenable for a public project with no
   budget — or asking users for their own key, which kills adoption for a tool someone tries
   once out of curiosity.
2. **Privacy.** Users paste their own documents in. Not transmitting them at all is a stronger
   guarantee than any privacy policy, and it is verifiable by anyone inspecting network traffic.
3. **Determinism.** Local inference with fixed parameters gives identical scores across runs.
   This matters more than it looks — it makes the retrieval logic testable with plain assertions
   instead of tolerance ranges.

**Consequences.** A model download on first visit, which must be surfaced as explicit progress
rather than an unexplained wait. Embedding quality is below what a large hosted model provides —
acceptable, since the tool exists to explain *relative* ranking behavior, not to be the best
retriever. Large documents are bounded by what a browser can process in reasonable time, which
is why the specification caps document size.

---

## D-003 — Include retrieval, not chunking visualization alone

**Date**: 2026-07-25 · **Status**: Accepted

**Context.** The narrower version of this project shows only how a document is split, with no
querying.

**Decision.** Include the retrieval half — query, ranked results, scores.

**Why.** Chunk visualization alone is a diagram. It shows what happened but not what it cost
you. The question users actually arrive with is "why is my passage not being found," and
answering it requires showing the ranking. The retrieval half is what makes this a debugging
tool rather than an illustration.

**Consequences.** More scope inside a 6-day budget, and it is what pulls in the embedding
dependency and therefore D-002. Mitigated by priority ordering in the specification: chunk
visualization is P1 and ships alone if the deadline tightens.

---

## D-004 — Screaming architecture with exactly one rule from Clean Architecture

**Date**: 2026-07-25 · **Status**: Accepted

**Context.** Screaming architecture and Clean Architecture are commonly framed as alternatives.
They are not — the first is about how folders are named and grouped, the second about which
direction dependencies point. Both were on the table.

**Decision.** Adopt screaming architecture fully: top-level folders under `src/features/` are
named for the problem domain (`chunking`, `retrieval`, `documents`), never for technical roles.
Adopt exactly one rule from Clean Architecture: **no `domain/` folder may import a framework.**
Domain code takes plain data and returns plain data.

Explicitly *not* adopted: interfaces at every boundary, mappers between layers, dependency
injection containers.

**Why.** The single dependency rule buys nearly all the value. The chunking strategies and
similarity scoring are the logic worth testing, and keeping them framework-free means testing
them needs no mocks, no test database, and no render harness. That is what makes the project's
test-first principle cheap rather than a tax.

The remaining Clean Architecture ceremony costs days that a 6-day solo project does not have,
and pays back only when multiple people are defending a boundary from each other.

**Consequences.** Some coupling between the application layer and the framework, accepted
knowingly. If this ever grows past one person, the boundaries would need tightening.

---

## D-005 — Paste-only input and no persistence in v1

**Date**: 2026-07-25 · **Status**: Accepted

**Context.** Two obvious features were considered and cut: uploading files (PDF, Word,
Markdown), and keeping work across page reloads.

**Decision.** Neither ships in v1. Plain text pasting only, session-scoped state.

**Why.** File upload looks like a small feature and is not — PDF text extraction is a source of
endless edge cases (columns, ligatures, scanned pages) and would consume a meaningful fraction
of a 6-day budget without teaching the user anything new about chunking. Persistence requires
storage and a state model that the core value does not depend on.

**Consequences.** Users must paste, and reloading loses work — the specification requires
warning before that happens. If the tool proves useful, file upload is the first thing to add,
and it is why the document is modeled as content plus length rather than as a file.

---

## D-006 — Use all-MiniLM-L6-v2, and accept an English-only tool

**Date**: 2026-07-25 · **Status**: Accepted

**Context.** D-002 committed the project to in-browser inference but never named a model. Three
candidates were realistic for Transformers.js: `all-MiniLM-L6-v2` (~23 MB quantized, 384
dimensions, English, 256-token input limit), `bge-small-en-v1.5` (~33 MB, better ranking quality
and a 512-token limit, still English), and `paraphrase-multilingual-MiniLM-L12-v2` (~120 MB,
50+ languages, 128-token limit).

**Decision.** Ship `Xenova/all-MiniLM-L6-v2`, quantized. Aguja is an English-only tool in v1.

**Why.** The first-visit download is the single worst moment in the product — the user has pasted
nothing yet and is already waiting. D-002 accepted that cost but requires it be kept small and
made visible, and 23 MB is the smallest credible option. Multilingual support would have cost
five times the download to serve a case that is not the target user's; the target user is a
developer debugging retrieval over technical documentation, which is overwhelmingly English.

Quality mattered less than it appears. Aguja exists to show *relative* ranking behavior — how the
order changes when the chunking strategy changes. A better model would move every score somewhat
but would not change the lesson, and D-002 already accepted embedding quality below a large
hosted model.

**Consequences.** Non-English documents will produce scores that look plausible and are not
trustworthy, which the interface must say outright rather than leave the user to discover — the
specification carries this as FR-026.

The 256-token input limit is the sharper consequence. A chunk larger than roughly 1,000 characters
will be silently truncated before embedding, meaning its tail contributes nothing to its score.
This is precisely the class of invisible failure the tool exists to expose, so it must be surfaced
as a first-class finding rather than hidden (FR-017). Choosing `bge-small` would have doubled that
ceiling; if truncation warnings turn out to dominate real usage, that is the trade to revisit.

---

## D-007 — Pin the WASM execution backend, buying determinism with speed

**Date**: 2026-07-25 · **Status**: Accepted

**Context.** Transformers.js can execute on WebGPU where available and fall back to WASM
otherwise. WebGPU is substantially faster. The default behavior is to pick by capability
detection.

**Decision.** Pin the WASM backend with a fixed thread count. WebGPU stays off in v1.

**Why.** D-002 justified local inference partly on determinism: identical scores across runs are
what let the retrieval logic be tested with plain assertions instead of tolerance ranges, and the
constitution turned that into a hard rule. Capability detection quietly destroys it. The two
backends round differently, so the same document and query would score differently on two
machines — and worse, on the *same* machine after a browser update enabled WebGPU. A regression
test written on Monday would fail on Friday for no reason the developer could see.

The thread count matters for the same reason. Thread partitioning fixes the reduction order
inside matrix multiplication, so deriving it from `navigator.hardwareConcurrency` would
reintroduce exactly the device dependence this decision removes.

The speed is affordable. Quantized MiniLM over short chunks runs in the low tens of milliseconds
per chunk on WASM, putting a 100-chunk document comfortably inside the 15-second budget the
specification sets. WebGPU would be faster than a requirement that is already met.

**Consequences.** Determinism holds for a given browser and build, not across browsers — the
specification should not be read as promising more. Very large documents will feel slower than
they need to. If the 15-second budget is missed on real hardware, this is the decision to
revisit, and revisiting it costs the cross-run guarantee, so the trade must be measured rather
than assumed.

---

## D-008 — Enforce the 256-token ceiling explicitly, rather than trust the tokenizer's default

**Date**: 2026-07-27 · **Status**: Accepted

**Context.** D-006 states the model truncates at 256 tokens, and FR-017 depends on that number
being right — it is what `truncated`/`tokenCount`/`totalTokens` are computed against. Implementing
T039, the model repo's own `tokenizer_config.json` was checked directly: it declares
`model_max_length: 512`, inherited from the underlying `bert-base-uncased` tower, not 256. The 256
figure is a `sentence-transformers` library convention (`all-MiniLM-L6-v2`'s own encode default),
which the Xenova ONNX conversion does not carry over — nothing in the converted model's own files
enforces it.

Transformers.js's tokenizer, called with `truncation: true` and no `max_length`, defaults to the
tokenizer's own `model_max_length`. Left alone, that would have silently truncated at 512 tokens,
not 256 — quietly contradicting D-006 and CLAUDE.md's own stated ground truth, and making FR-017's
`truncated` flag wrong for any chunk between 256 and 512 tokens.

**Decision.** Pass `max_length: 256` explicitly on every tokenizer call in `embedder.worker.ts`
(both the truncated encode used for embedding and the count used to compute `totalTokens`), rather
than rely on the tokenizer's own default.

**Why.** D-006 is the source of truth for this number, not the model repo's tokenizer config —
the config reflects the base BERT tower's architectural limit, not the sentence-embedding
convention D-006 was written against. Hardcoding 256 in the worker is what makes the two agree.

**Consequences.** If `all-MiniLM-L6-v2` is ever swapped for a model with a genuinely different
intended ceiling, this constant has to move with it — it is not derived from anything the model
repo publishes, so nothing will fail loudly if it drifts out of sync with a future model swap.

---

## D-009 — Cap Playwright's worker count for the real-model e2e specs

**Date**: 2026-07-27 · **Status**: Accepted

**Context.** `retrieval.spec.ts` and `no-network-leak.spec.ts` each do a real ~23 MB model download
and WASM session init per test, against the live Hugging Face CDN — no mocking, per this project's
own practice of verifying the worker pipeline for real rather than trusting fixtures. Running the
full e2e suite with Playwright's default worker count (roughly half the machine's logical cores —
8, on the 16-core box this was validated on) oversubscribes both CPU and bandwidth badly: 8
simultaneous real downloads plus 8 simultaneous WASM compiles starve each other. During T054's
full-suite validation run, this alone was enough to blow SC-006's 15-second post-model-ready
budget (observed ~49s) on a query over a 6-chunk document that completed in ~6s when the same spec
ran with `--workers=1`. This was contention, not a product regression — the same test passed
comfortably once concurrency was reduced.

**Decision.** Cap `workers: 4` in `playwright.config.ts`.

**Why.** SC-006's budget is a real product contract, and loosening the assertion's threshold to
paper over contention would hide a genuine future regression along with today's false one. The
correct fix is matching test concurrency to what the machine can actually sustain for this kind of
work, not weakening what is being measured. Four concurrent real downloads left the suite
consistently green across repeated runs on this hardware; the chunking-only specs, which need no
network, remain effectively free to parallelize regardless.

**Consequences.** The e2e suite takes proportionally longer on machines with fewer cores than this
one, and a CI runner with less CPU/bandwidth than a developer's desktop could still see this
budget missed for reasons unrelated to the app. If that happens, the honest fix is a
resource-aware `workers` value (or a separate low-concurrency project just for these two specs),
not a larger millisecond threshold — the number in the spec is the number to defend.

---

## D-010 — Open v2 as a tool suite, bounded by what embeddings alone can answer

**Date**: 2026-07-28 · **Status**: Accepted

**Context.** v1 shipped as a single debugger answering one question: *why doesn't my retrieval
find this passage?* The landing page's tool dial already reserves two unnamed slots, and the
stated direction for the project is tools for people who build retrieval systems — not one tool
that happens to have several views.

That raised the real question: *which* tools. The obvious candidates from the RAG ecosystem —
answer generation, groundedness and faithfulness scoring, automatic query rewriting,
cross-encoder reranking — all require generative or second-model inference. Principle V forbids
a server and an API key, and the only model loaded is `all-MiniLM-L6-v2`, which produces
embeddings and nothing else. Shipping any of them means either breaking Principle V or
downloading a second, far larger model on first visit, which D-006 already rejected on the
grounds of first-visit weight.

Filtering the candidates by what embeddings and the tokenizer can actually compute left a
smaller, honest set. Two were selected: analysing how a chunk's rank moves across several
phrasings of the same question, and mapping near-duplicate chunks against each other.

Two further candidates were considered and not taken. A *top-k threshold explorer* is a view
over data the existing ranked list already computes, not a separate tool. A *token budget*
planner would report counts from MiniLM's WordPiece tokenizer, which does not match the BPE
tokenizers of the models users actually send context to; presenting those numbers as a context
budget would be precisely the kind of quiet inaccuracy this project exists to expose. A
*strategy sweep* across a range of chunk sizes remains out: it is "comparing more than two
strategies at once", which is already an explicit Out entry.

**Decision.** Open v2. `/tool` becomes a suite navigated by a sidebar, with the existing
debugger at `/tool/chunks` and pairwise comparison promoted from a checkbox to its own route.
Two tools are added: **Query Sensitivity**, which ranks chunks across several phrasings of one
question and reports each chunk's rank spread, and **Redundancy Map**, which surfaces chunk
pairs whose similarity exceeds a measured threshold.

Tools are sibling routes under a shared layout. That layout owns the pasted document, the
embedder, and a cache of chunk embeddings keyed by chunk text, all for the lifetime of the
session only.

**Why.** Sharing the embedder across tools is a requirement, not an optimization: it holds a
worker and a roughly 25 MB first-visit download, and mounting one per tool would either
re-download the model or run several workers against the same text. Sibling routes under one
layout are what makes a single shared instance natural in the App Router, and they keep each
tool independently addressable, which a state-switched single page would not.

The two selected tools were chosen because each exposes a failure that is currently invisible
and that the existing domain primitives already support. Phrasing brittleness is the failure
where retrieval passes the author's own test query and then misses in production because a real
user asked differently. Redundancy is the failure where a top-k of five returns two distinct
facts and three restatements, silently spending the context window that the retrieval existed
to fill.

The rejected candidates were rejected on the same standard, not on effort. A tool that cannot
be honest about its own numbers is worse than no tool, given Product Principle 2.

**Consequences.** The Technology Constraints scope section moves beyond v1, which is a MINOR
constitution amendment (1.0.0 → 1.1.0). The generative-inference exclusion becomes explicit
there rather than implied by Principle V, so a future contributor does not have to re-derive it.

The compare-mode checkbox is removed in favour of a route. Comparing more than two strategies at
once remains out, so the sidebar must not grow into a workaround for it.

The redundancy computation is O(n²) in chunk count: a 50,000-character document at small chunk
sizes reaches several million pairs. It runs in the worker behind an explicit, surfaced cap —
never a silent truncation — and the interface presents ranked pairs, never a full matrix.

The near-duplicate threshold is a real number that must be measured against this model rather
than assumed; MiniLM's cosine similarities are compressed enough that unrelated English text
still scores well above zero. The value chosen, and the measurement behind it, belong in the
specification.

The determinism contract extends unchanged: identical inputs produce identical output, ties
break by ascending chunk index, and pair ordering is fully specified rather than left to sort
stability.

Interface language unifies to English across the whole application, resolving a mix that had
accumulated between the tool and its newer chrome.

---

## D-011 — Report confusable chunks, not duplicates, because cosine cannot tell them apart

**Date**: 2026-07-28 · **Status**: Accepted

**Context.** D-010 specified a redundancy map: surface chunk pairs whose embeddings exceed a
near-duplicate similarity threshold, so a user can see whether their top-k is spending slots on
restatements of one fact. FR-045 required that the threshold be measured against
`all-MiniLM-L6-v2` rather than assumed. Measuring it produced a result that invalidated the
design rather than calibrating it.

Cosine similarity between chunks that genuinely share text is lower than expected. Adjacent
chunks produced by 75%-overlap chunking — three quarters of their characters literally identical
— score 0.643 to 0.760. Paraphrases of one fact score 0.567 to 0.742.

Chunks that state opposite versions of one fact score far higher:

| Pair | Cosine |
|---|---|
| "Free shipping applies to orders over $50." / "…over $100." | 0.9300 |
| "The API rate limit is 1000 requests per hour." / "…100 requests…" | 0.9567 |
| "Sessions expire after 24 hours of inactivity." / "…after 15 minutes…" | 0.9375 |
| "You must enable two-factor authentication." / "You must **not** enable…" | 0.9545 |

Negation barely registers: `must` and `must not` differ by 0.045. Every contradiction outscores
every true duplicate, so no threshold separates them. A tool ranking pairs by similarity and
calling the top ones near-duplicates would put contradictions first and describe them as
identical content — false in precisely the cases a retrieval debugger exists to catch.

**Decision.** Reframe the tool. It surfaces **confusable chunks** — pairs the retriever cannot
tell apart — rather than duplicates, and reports lexical overlap alongside cosine similarity. High
similarity with high shared wording is duplication; high similarity with little shared wording is
confusion. The interface may not call a pair duplicated on similarity alone (FR-045). The sidebar
entry is "Confusable Chunks".

**Why.** The measurement did not reveal a bad threshold, it revealed that similarity alone does
not carry the meaning the original framing assigned to it. Shipping the original framing would
have violated Product Principle 2 in the sharpest possible way: a corpus containing both "you must
enable 2FA" and "you must not enable 2FA" is a catastrophic retrieval failure, and the tool would
have reported it as harmless repetition.

Under the new framing the same computation becomes more valuable rather than less. Two chunks at
0.95 that a reader would never confuse mean the retriever's judgement between them is close to
arbitrary — invisible today, and exactly what this project exists to expose. Lexical overlap is
the cheapest signal that separates the two cases: deterministic, framework-free, and computable
from text already in hand without a second model.

**Consequences.** FR-043 through FR-051 and User Story 3 are rewritten in the v2 specification;
determinism requirements move to FR-052 and FR-053. The tool gains a second reported measure per
pair, so its results carry two numbers rather than one.

The default threshold must be chosen against the confusable framing, not the duplicate one, and
sits below the contradiction band rather than above the duplication band.

A separate measurement corrected the cost risk recorded in D-010. Comparing every pair is roughly
1 second for 2,000 chunks and 2.4 seconds for 3,000, while embedding that many chunks takes
minutes. The chunk cap therefore exists to bound embedding work, not pair comparison; D-010's
framing of the O(n²) comparison as the performance risk was wrong.

---

## D-012 — Lexical overlap separates paraphrase from duplication, not contradiction from duplication

**Date**: 2026-07-28 · **Status**: Accepted

**Context.** D-011 reframed the confusable-chunks tool around two numbers — similarity and lexical
overlap — on the claim that high similarity with high shared wording means duplication, and high
similarity with little shared wording means a dangerous confusion the retriever cannot resolve
(spec.md User Story 3). Before implementing `lexicalOverlap`, that claim was checked against the
same four sentence pairs D-011 measured, using token-set Jaccard:

| Pair | Jaccard |
|---|---|
| "you must enable 2FA" / "you must **not** enable 2FA" | 0.857 |
| "orders over $50" / "orders over $100" | 0.750 |
| "1000 requests per hour" / "100 requests per hour" | 0.800 |
| "we refund to the card you paid with…" / "refunds go back to your original payment method…" (paraphrase) | 0.100 |

Every single-word contradiction scores *high* lexical overlap, not low — the sentences are
identical except for one token, so nearly every other word matches. Only the genuine paraphrase,
which reuses almost no literal wording, scores low. This inverts D-011's claim for exactly the
case that claim was written to catch: a contradiction differing by one word is structurally
indistinguishable, by any whole-text overlap measure, from a true duplicate produced by chunk
overlap — both share the great majority of their tokens. Character n-gram overlap has the same
problem for the same reason: the fraction of the text that changed is small regardless of which
unit it's measured in.

**Decision.** Drop the categorical claim. Lexical overlap distinguishes **paraphrase from literal
duplication** reliably (confirmed above: 0.10 vs. 0.75–0.86) — that pairing stands. It does **not**
reliably distinguish a single-word contradiction from a true duplicate; both present as high
similarity and high overlap. The tool's job is therefore to surface the pair and both numbers, not
to classify it. `ConfusablePairs` (the results UI) additionally shows each pair's chunk text
alongside the two numbers, so the one case the numbers cannot resolve — is this a duplicate or a
one-word contradiction? — is resolved by the reader looking at the actual words, not by an
automated label. spec.md User Story 3 and FR-044 are corrected to say this rather than the
stronger, now-known-false claim.

**Why.** Shipping the original claim risked the opposite failure D-011 already fixed once: telling
a user "these are duplicates" about a pair that is actually a live contradiction, on the strength
of a number that cannot tell the difference. Product Principle 2 — never hide a failure this tool
exists to expose — argues the same way here it did in D-011: don't launder an unresolved case
through a confident-sounding label.

**Consequences.** FR-044 gains a requirement to show chunk text alongside the two numbers.
`ConfusablePair`/`ConfusabilityRun` in data-model.md need no field change — chunk text is already
reachable from `chunks[pairIndex].text` in the caller, so this is a UI requirement, not a domain
contract change. `lexicalOverlap`'s implementation and tests are unaffected; token-set Jaccard is
still the chosen measure, just described accurately.

---

## D-013 — Ship a bilingual interface over an English-only analysis

**Date**: 2026-07-29 · **Status**: Accepted · **Supersedes**: FR-035 (spec 002)

**Context.** FR-035 requires that "all interface copy across the application MUST be in English",
and feature 002 implemented it — the last Spanish strings on the landing page were translated in
its final phase (T029–T030). The request now is the opposite: serve the interface at `/es` and
`/en`, with a switcher.

The conflict is not only with FR-035. D-006 chose `all-MiniLM-L6-v2` and accepted an English-only
*tool*, reasoning that the target user debugs "overwhelmingly English" technical documentation;
FR-026 requires the interface to say that non-English documents produce untrustworthy scores.
Today that statement is a tooltip on a small "i" button in `ModelStatus`. That is adequate while
every other word on screen is also English, because the user has no particular reason to expect
otherwise.

A fully Spanish interface removes that reason. Someone landing on `/es` sees their own language
everywhere and draws the obvious inference: this tool works in Spanish. It does not. Translating
the interface and changing nothing else would manufacture precisely the misunderstanding FR-026
exists to prevent.

**Decision.** Separate the two ideas explicitly: **interface language and analysis language are
different things.** The interface ships in Spanish and English; the analysis stays English-only,
on the same model D-006 chose. FR-035 is superseded — interface copy MUST be available in both
locales rather than English-only.

The English-only notice stops being a tooltip. It becomes visible, first-class copy wherever a
document is accepted or scores are shown, written in the reader's own language, and it is most
prominent on `/es`, where the gap between interface language and analysis language is real.

**Why.** The user this serves was always in scope: a Spanish-speaking developer debugging English
technical documentation. Their interface language and their corpus language were never the same
thing. D-006's rationale is about the corpus — the documents the target user pastes — not about
what language that person prefers to read a button in. Nothing in D-006 is reversed here; it is
read for what it actually claims.

Product Principle 2 — never hide a failure this tool exists to expose — forces the second half.
Aguja's entire argument is that invisible retrieval failures should be made visible. Shipping an
interface that implies Spanish support while quietly producing untrustworthy Spanish scores would
be exactly that kind of failure, introduced by us, inside the product built to expose it.

**Consequences.** FR-035 is replaced in spec 003. FR-026's notice must be upgraded from a tooltip
to visible copy, and must itself be translated — a warning about untrustworthy non-English scores
that only ever appears in English is self-defeating.

Every route moves under a locale segment (`/[locale]/tool/…`), which breaks the twelve hardcoded
paths in `e2e/` and every internal `<Link>`. That cost is mechanical but real, and it argues for a
shared route helper rather than twelve literal edits repeated on every future locale change.

The multilingual model (`paraphrase-multilingual-MiniLM-L12-v2`, ~120 MB, 128-token limit) was
reconsidered here and rejected again. It would make the analysis genuinely multilingual, but at
roughly five times the download D-002 worked to keep small, and with half the current token
ceiling — worsening the truncation failure FR-017 exists to surface. Making the analysis
multilingual remains a constitution amendment and its own decision, never a side effect of
translating the interface.

---

## D-014 — Add next-intl rather than hand-rolling the message layer

**Date**: 2026-07-29 · **Status**: Accepted

**Context.** D-013 commits to a bilingual interface. CLAUDE.md declares the stack "Fixed —
substituting anything here needs a constitution amendment plus a new decision entry". Adding a
library is an addition rather than a substitution, so no amendment is required, but it is still a
dependency the project did not have and therefore comes through the decision log.

Both options were credible. A hand-rolled message layer — two typed objects and a small lookup
hook — needs no dependency at all and would comfortably cover the current surface, which is about
ten components carrying visible copy. `next-intl` brings locale routing, message loading, ICU
formatting, and typed message keys for the App Router.

**Decision.** Use `next-intl`.

**Why.** The deciding factor is the Docs page, not the buttons. Feature 003 adds long-form
documentation — a RAG primer, a section per tool with worked examples, a troubleshooting guide,
and embeddings concepts — in both languages from the start. A hand-rolled dictionary is fine for
forty short strings and becomes a liability for prose: nothing catches a key that exists in one
locale and not the other, plurals and interpolation get hand-written, and locale routing has to be
maintained against App Router conventions by hand. The maintenance burden would land exactly where
the content is heaviest and hardest to eyeball.

Typed keys are the specific win. With two locales and a large body of documentation, the failure
mode that matters is silent drift — Spanish text that quietly falls back to English, or a section
that exists in one language only. Catching that at compile time is worth one dependency.

**Consequences.** `next-intl` joins the stack; CLAUDE.md's stack section is updated to name it.
Route structure follows its conventions, which is what drives the `/[locale]/…` restructure in
D-013's consequences. The e2e suite's paths change with it, and a shared route helper keeps that
from recurring.

This is a UI-layer dependency only. Principle III still forbids any framework import under a
`domain/` folder, and nothing about message formatting belongs there — the domain keeps taking
plain data and returning plain data, and no chunking or similarity code becomes locale-aware.
