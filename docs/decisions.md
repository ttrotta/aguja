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

---

## D-015 — Give the landing a dot field shaped by the needle, not a map

**Date**: 2026-07-30 · **Status**: Superseded by D-016

**Context.** `DESIGN.md` lists "never a flat single-plane background" as a Key Characteristic of
the visual system, but the landing had been exactly that flat plane since it shipped. The reference
image that prompted fixing this rendered its dot texture as a world map — a recognisable, low-effort
way to make a dotted background feel intentional.

**Decision.** Add a dot-matrix background to the landing page only, shaped by the needle-and-thread
motif (a soft clearing where the thread passes through the field) rather than by any
representational silhouette. Excluded from the tool suite, which the design system governs as an
Operate-mode surface where "the task always outranks the atmosphere," and from the documentation
and research pages, reasoned as Read-mode surfaces where texture behind sustained prose works
against comprehension (spec 004 research.md R-006).

**Why.** A world map means nothing here — Aguja is a retrieval debugger, nothing about it is
geographic, and a map would be the only element on the page that carries no meaning. The product
already owns a motif with meaning; shaping the field with it costs no more than sourcing a
silhouette asset while actually saying something true. The tool and reading-surface exclusions
followed directly from principles the design system had already committed to elsewhere, not new
reasoning invented for this feature.

**Consequences.** Implemented as a single repeating `radial-gradient`, dot alpha 0.06, applied via a
`.dot-field` class scoped to the landing's `<main>`. A companion correction was required first: the
light theme's secondary text measured below WCAG AA against every one of its surfaces, independent
of this feature, and the field would have buried that defect further rather than exposing it —
`--color-text-muted`'s light-theme alpha was raised 0.62 → 0.72 before the field shipped.

Shipped complete — field, clearing, tests, both themes — and rejected on sight by the user once
rendered. Superseded below the same day, before this entry could describe anything still true of
the codebase.

---

## D-016 — Take the dot field site-wide, bigger and irregular, drop the clearing

**Date**: 2026-07-30 · **Status**: Accepted · **Supersedes**: D-015

**Context.** D-015 shipped, passed every automated check, and was rejected on sight: the user found
the clearing unconvincing and the dots too small to register, in either theme. Separately, and in
the same conversation, they asked for the field to reach the tool suite, the documentation, and the
research pages — reversing D-015's own exclusions — "quiero que tenga impacto."

**Decision.** Three changes, made together:

1. Revert the clearing entirely. `BigNeedle` carries no clearing element; the needle-and-thread
   motif is exactly what it was before this feature touched it.
2. Redraw the field as an irregular, hand-placed pattern of circles of varying radius (an inline
   SVG tile, not a uniform `radial-gradient` grid), at roughly three times the previous opacity
   (0.06 → 0.18).
3. Move the field from a landing-scoped `.dot-field` class to the `body` element directly, so every
   route carries it. Within the tool suite specifically, this means only `page-bg` — the margin
   around the tool's floating panel — carries the field; the panel itself and everything inside it
   (already opaque `panel-bg`/`panel-inset-bg` surfaces) continue to occlude it fully, which is what
   keeps Operate mode's "task outranks atmosphere" true for the surface where the actual work
   happens. Only where page-bg was already visible, and already meant nothing, does it now carry
   texture.

**Why.** The clearing's rejection was a craft judgement made from looking at it rendered, not a
requirement anyone could have specified in advance — recorded here rather than re-litigated. The
scope reversal is different in kind: D-015's tool and reading-surface exclusions were this
feature's own reasoning (R-006), not a constitution-level rule, and the user weighed that reasoning
against wanting visual presence across the product and chose presence. Scoping the field to
`page-bg` within `/tool` rather than reverting the exclusion outright was this session's proposal,
not the user's explicit instruction — it is the version of "reach the tool suite" that adds
visual identity without touching the instrument panel Operate mode is actually protecting, and nothing
about the panel's own restraint changes.

The heavier field (0.18 alpha, larger dots) still had to clear the WCAG floor its own predecessor
established: measured up to roughly 0.20 before secondary text sitting on a dot pixel drops below
4.5:1 in either theme, so 0.18 ships with real, verified margin rather than a value chosen by eye
and hoped to be safe.

**Consequences.** `--color-dot-clear` and the `.dot-field` class are removed as dead code; the field
lives in `globals.css`'s `body` rule via a new `--dot-pattern` token (one hand-authored SVG data URI
per theme, colour baked in to match `--color-dot` exactly — the two must be kept in sync by hand if
either changes, which is recorded as a comment at the token, not only here). `spec.md`'s FR-085,
FR-086, and SC-036 are marked superseded in place by FR-103–FR-107 rather than deleted, so the
document still shows what was originally specified and why it changed. The `theme` test project's
C-3 and C-6 invariants were re-verified against the new alpha before it shipped, not after.

---

## D-017 — Halftone grid, not scattered positions: dot randomness is size, not placement

**Date**: 2026-07-30 · **Status**: Accepted · **Supersedes**: D-016 on pattern technique only

**Context.** D-016 shipped a hand-placed SVG of circles at irregular positions *and* irregular
sizes — the most literal reading of "random pattern" available at the time. Rejected again, the
same day, against a second reference image: a halftone-style texture where dots sit on a visibly
regular, aligned grid and only their radius varies, producing rounded blob shapes against a field
of small uniform dots. The user's own words made the distinction explicit: *"que los puntos estén
alineados... no sea random [la posición]... pero que hagas formas random jugando con los tamaños."*
D-016's site-wide scope reversal (FR-103, FR-104) is untouched by this entry — only the pattern
technique changes.

**Decision.** Rebuild the SVG tile as a regular grid (22×11 cells, 12px spacing) where every dot
sits at a fixed grid position and only its radius varies — computed from proximity to four fixed
"seed" points using a distance falloff, so radius grows smoothly toward each seed and shrinks to a
1.7px floor away from all of them. This is what produces the rounded, halftone-style blobs; a
purely random per-cell radius would read as static, not shape.

**Why.** Two rejections in one day are not two unrelated misses — they share a root cause: neither
this session nor the first amendment separated "randomness" into its two independent components,
position and size, and defaulted to varying both at once because that was the more literal reading
of the request. The user's correction on the second pass made the actual distinction explicit,
and it holds up on inspection of both reference images: what reads as organic in a halftone texture
is the *size* gradient, not scattered placement — the grid alignment is part of what makes it read
as a controlled effect rather than noise.

**Consequences.** `--dot-pattern`'s two SVGs (dark/light) are regenerated; tile size grows from
120×120 (14 hand-placed circles) to 264×132 (242 grid-computed circles), and `background-size` in
`globals.css`'s `body` rule changes to match. `--color-dot`'s alpha moves 0.18 → 0.19 — a value
computed for the new pattern, not carried over from the old one, though it lands close by
coincidence. The ~0.20 contrast ceiling from D-016 required no re-derivation: it is a function of
alpha alone, not of dot radius or position, which was verified rather than assumed before this
shipped. `spec.md`'s FR-105 and part of SC-036 are marked superseded in place by FR-108, the same
pattern D-016 used against D-015 — the document keeps showing what was tried and rejected, not only
what remains true.

---

## D-018 — Irregular coastlines instead of radial blobs; disclose the byte cost

**Date**: 2026-07-30 · **Status**: Accepted · **Supersedes**: D-017 on blob shape; FR-087's byte
claim (spec 004)

**Context.** D-017's halftone grid — regular dot positions, radius driven by distance from four
fixed points — was liked in principle on the same day it shipped: grid alignment and size variation
were both confirmed as right. What wasn't right was the shape math itself. Distance-based falloff
from a point is radially symmetric by construction, so every landmass comes out a soft circle. The
user asked for something "freestyle," like invented continents rather than real ones, and separately
said the field still read as a visibly repeating tile.

**Decision.** Two changes:

1. Replace radial falloff with an angle-dependent coastline: each landmass's edge radius is
   perturbed by a small sum of sine harmonics varying with angle, not a constant distance from
   center. This is what produces bays, peninsulas, and asymmetric edges instead of a circle.
2. Grow the tile and the landmass count — 22×11 cells (6 landmasses) to 34×17 cells (6 more varied
   landmasses, no two sharing a harmonic set) — so repetition is not obvious at normal viewport and
   scroll distances, without abandoning tiling itself (an infinite, non-repeating canvas would need
   either a fetched asset, which FR-087 rules out, or runtime generation, ruled out earlier on cost
   and determinism grounds).

Measured, not assumed: the resulting SVGs are 578 circles each, ~20KB raw per theme. Checked against
`globals.css`'s actual gzip size before shipping — ~9.4KB compressed for both themes' patterns
combined, which is what a browser actually transfers.

**Why.** The angle-perturbation technique is the standard way to draw an irregular blob outline
without abandoning a closed, fillable shape — it stays a strict function of angle, so it is exactly
as cheap to compute per grid cell as the radial version it replaces, at the cost of six numbers
(three harmonics × frequency/amplitude/phase) per landmass instead of one radius. The size and
variety increase is aimed at a specific complaint — "no quiero que haya un patrón" — read as being
about a small motif obviously repeating, not about tiling as a mechanism; FR-087's constraints
already rule out the alternatives that would make the field truly non-repeating.

Disclosing the byte cost, rather than letting SC-031's original "same bytes" claim quietly become
false, follows the same practice already applied to the contrast defect (D-011 predecessor spec)
and the scope reversal (D-016): a claim that turns out untrue on measurement gets corrected in the
document, not left standing because nobody re-checked it.

**Consequences.** `spec.md` gains FR-109 (irregular coastline), FR-110 (repetition-avoidance
rationale), and FR-111 (byte disclosure), and marks FR-087 and SC-031 superseded in place on their
byte claims specifically — "no additional requests" is untouched and still holds. `globals.css`'s
`--dot-pattern` tile grows from 264×132 to 408×204; `--color-dot`'s alpha (0.19) and the ~0.20
contrast ceiling both carry over unchanged, since neither depends on shape or tile size. `theme`
project (63 tests), full suite (188 tests), typecheck, and lint were all re-verified against this
version before it shipped.

---

## D-019 — Fewer landmasses, real size contrast, genuine empty space

**Date**: 2026-07-30 · **Status**: Accepted · **Supersedes**: D-018 on landmass count and sizing

**Context.** D-018's six landmasses sat close enough in size (radius 2.6–4.6 cells) and were spread
widely enough that their influence zones covered most of the tile — measured afterward at over 95%
of grid cells carrying some size bump. Rejected on sight: "veo como muchas manchas." The complaint
was density and contrast, not shape — D-018's coastline technique itself was not revisited.

**Decision.** Three landmasses instead of six: one dominant (radius 7.2 cells), one mid-sized (3.6),
one small (2.0), positioned so their influence zones don't tile the whole grid — large regions carry
only the 1.5px floor dot, no size influence at all. Measured at 63% of cells now genuinely empty,
against under 5% before.

Toroidal (wrapping) distance was added at the same time, not requested but required by the larger
dominant landmass: at radius 7.2 with harmonic amplitude summing to 0.65 in the worst case, its
coastline can reach nearly 12 cells from center in some direction, which is close enough to the
34-cell tile width that a non-wrapping distance calculation could clip it hard against a tile edge —
a visible seam every repeat. Wrapping the delta calculation for both axes fixes this regardless of
how future landmass placement or sizing changes; it costs nothing extra to compute.

**Why.** "Empty" is not the absence of a requirement — it is now one (FR-112), because the user's
complaint was specifically about the *ratio* of covered to uncovered space, which no earlier
requirement in this spec constrained. The size contrast (one dominant landmass against two much
smaller ones) is what makes "más grande en algunos lados... más vacío en otro" true simultaneously:
symmetric sizing cannot produce that effect no matter how the individual shapes are drawn.

**Consequences.** `spec.md` gains FR-112 and marks the "Dot field" Key Entity's position/size
attributes corrected — an earlier pass had left it reading "hand-arranged, not a grid," which
FR-108 had already made false. `globals.css`'s tile dimensions (408×204) and circle count (578) are
unchanged — only per-cell radius values differ, so raw/gzipped payload move by rounding error
(~20.0KB → ~19.95KB raw per theme; ~8.96KB gzipped combined, both themes, down from ~9.4KB). `theme`
project, full suite, typecheck, and lint re-verified; the served CSS was decoded and its circle
count and tile size confirmed against the generator's output, not assumed to match.

---

## D-020 — Grow the tile itself: the repeat, not the content, was the complaint

**Date**: 2026-07-30 · **Status**: Accepted · **Supersedes**: D-019 on tile dimensions

**Context.** D-015 through D-019 all iterated on what the tile *contains* — shape, size, contrast,
density. None touched the tile's own dimensions, which stayed at roughly 400×200px throughout. The
user's next report named the actual defect precisely: at a typical desktop viewport width (~1900px),
a 408px-wide tile repeats horizontally about five times, visible side by side as "5 columns" of
identical shapes — a complaint about the repeat interval, not about anything the earlier amendments
had touched.

**Decision.** Grow the tile to 1720×500px (86×25 cells at 20px spacing, up from 408×204px at 12px
spacing), with seven landmasses — up from three — spread across the full width so the larger canvas
reads as genuinely varied rather than the same three shapes stretched apart. Real size contrast and
substantial empty space (D-019's requirement) are preserved: 77% of cells carry no size bump,
against D-019's 63%.

Measured before committing, not after: three tile-size/spacing candidates were gzip-tested with
synthetic circle data before any real landmass was designed, specifically to avoid shipping a payload
number nobody had checked. The chosen configuration (20px spacing, 1720px width) landed at roughly
double the prior gzip cost for a canvas over four times the area — an easy trade given the actual
number stayed in the tens of kilobytes, not hundreds.

**Why.** Every prior amendment optimized within a roughly 400px-wide box, which meant the fix could
never touch the actual complaint: a small tile repeats visibly wherever it's tiled, no matter how
good any single repeat looks in isolation. Widening the tile to approach real viewport widths is the
only change that can eliminate side-by-side repetition rather than dressing it up. Vertical
repetition is deliberately not held to the same bar (FR-113) — it is encountered only while
scrolling, never compared side by side in one view, and is a materially weaker cue than horizontal
tiling at typical page heights.

**Consequences.** `spec.md` gains FR-113 (tile width vs. viewport) and FR-114 (byte disclosure must
be re-measured on every tile-size change, not carried forward — a rule aimed at this decision log
itself, since D-016 through D-019 each restated a number without flagging that the *next* change
would invalidate it). SC-031 is corrected again: ~19.75KB gzipped total (`globals.css`), up from
~8.9KB. `--dot-pattern`'s circle count grows 578 → 2150 per theme. `theme` project, full suite,
typecheck, and lint re-verified; the served CSS was decoded and its circle count (2150) and tile
size (1720×500) confirmed against the generator's output before this was reported done.

---

## D-021 — Two tiers: the rich pattern stays landing-only, byte-splitting explicitly declined

**Date**: 2026-07-30 · **Status**: Accepted · **Supersedes**: D-016 on scope (partially)

**Context.** D-016 through D-020 took the dot field from landing-only to site-wide and iterated on
what it looked like. Once the field was actually good — the user's own words — the site-wide
decision itself was reconsidered: the rich pattern should stay exclusive to the landing, and every
other route (tool, docs, research) should fall back to something small and uniform that doesn't
compete with reading or working.

**Decision.** Two tiers. `body` carries a small, uniform `radial-gradient` — the exact technique
this feature started with, before any hand-authored SVG existed — as the default on every route.
A new class, `.dot-field-landing`, applied only to the landing's `<main>`, overrides that default
with the rich pattern (`--dot-pattern`, unchanged from D-020).

Reported first with a false claim, corrected before it shipped as fact: the assumption that scoping
the rich pattern to a class would also stop other routes from *downloading* it. Checked against the
actual served asset — `globals.css` compiles to one shared chunk, identical bytes, loaded by every
route regardless of which tier's class that route's markup uses. Next.js does not code-split global
CSS per route the way it does per-route JavaScript bundles or CSS Modules. Presented as an explicit
choice rather than silently accepted or silently "fixed": leave the shared bundle as-is (the cost is
paid once per browser session and cached, not repeated per page view), or move the rich pattern into
a route-scoped CSS Module to achieve real separation. The user chose to leave it — the visual result
was what mattered, not the download-splitting benefit this session had mistakenly promised alongside
it.

A second, real defect surfaced immediately after the first implementation: `.dot-field-landing` set
`background-image` but not `background-color`. Since `<main>` paints in front of `<body>` and the
rich pattern's empty regions are the majority of its area (63–77% across D-019/D-020), `body`'s own
small-dot gradient showed through those gaps — the two tiers visibly mixed on the landing, reported
directly by the user ("veo una mezcla"). Fixed by giving `.dot-field-landing` its own opaque
`background-color: var(--color-page-bg)`, matching `body`'s.

**Why.** Splitting "does it look different per route" from "does it download different bytes per
route" matters because they are genuinely different properties of the same CSS, and conflating them
is exactly the kind of unverified claim this project's whole practice this session has been to catch
before it ships, not after — this time it slipped through into an actual assistant message and had
to be corrected in the open rather than caught before printing it. The opacity defect is the same
kind of category error in miniature: `background-image` alone was assumed sufficient to "replace"
what's behind an element, when replacement requires blocking the layer beneath, not just adding a
layer in front of it.

**Consequences.** `spec.md` gains FR-115 (two-tier split), FR-116 (opacity requirement, closing the
mixing defect), and FR-117 (bundle-splitting is not assumed — verified false, and declining to fix
it is recorded as a choice, not an oversight). `globals.css`'s `body` rule reverts to a
`radial-gradient`, near the original pre-SVG implementation; `.dot-field-landing` is new, applied in
`src/app/[locale]/page.tsx`. Total file size is essentially unchanged (~19.5KB gzipped) since the
same two encoded SVGs still live in the same shared stylesheet — only *which routes render them* has
changed, not what ships to the browser. `theme` project, full suite, typecheck, lint, and the full
e2e suite were all re-verified; the served HTML was checked directly to confirm `.dot-field-landing`
appears only on `/en` and not on `/en/tool/chunks`, `/en/docs`, or `/en/news`, and the served CSS
chunk was confirmed byte-identical across all four routes.

---

## D-022 — Redesign the scroll cue, extend the Earned Glow Rule, and thread the scrollbar

**Date**: 2026-07-30 · **Status**: Accepted

**Context.** Three requests in one message: replace the pill-and-dot scroll cue with something more
distinctive that goes away after it's used, add a breathing glow along the hero's bottom edge to
reinforce the cue, and restyle the browser scrollbar to evoke the needle. The first two touch
`DESIGN.md`'s Earned Glow Rule directly — it currently reserves glow for the thread/needle motif and
the current selection, and an ambient glow-at-rest along a whole section edge is neither.

**Decision.**

1. **Scroll cue**: a floating violet arrow (`ScrollCue.tsx`, a new client component), animated with
   a gentle float, dismissed permanently on the visitor's first `scroll` event via a `{ once: true }`
   listener — no re-appearance on scrolling back to the top. The same "stops after first interaction,
   never resumes" rule the tool dial's auto-advance already follows.
2. **Hero glow**: a radial gradient anchored to the bottom-center of the hero, opacity breathing
   0.3–0.8 on a 4s cycle, built from the existing `--color-violet-glow` token. Extends the Earned
   Glow Rule explicitly — recorded here and in `DESIGN.md`, not silently treated as already covered.
3. **Thread scrollbar**: site-wide (not landing-scoped — this is chrome, like the navbar), a violet
   pill-shaped `::-webkit-scrollbar-thumb` carrying `thread-glow`'s same box-shadow treatment,
   `scrollbar-color` fallback for Firefox (colour only, no glow — the only tier that browser exposes).

Both new animations were added to the existing `prefers-reduced-motion` block; the old
`scroll-cue-dot` keyframes and class were deleted rather than left dead once nothing referenced them.

**Why.** A scrollbar cannot be shaped like a bent needle in CSS — the thumb is always a rectangle,
roundable but not bendable — so "make it look like a needle" is honestly satisfied by making it
*be* the thread (colour + glow), the same motif already expressed everywhere else violet appears,
rather than attempting a literal silhouette CSS cannot draw. The glow extension is scoped
deliberately narrow — one wayfinding moment at the fold, not a general licence — because the whole
point of the Earned Glow Rule was to keep glow meaning something; extending it everywhere a designer
later wants emphasis would undo that.

**Consequences.** `spec.md` gains FR-118–FR-122 and SC-038–SC-040 as a scope extension (not a
rejection-driven amendment — nothing here was shipped and disliked first). `DESIGN.md`'s Earned Glow
Rule, Landing layout description, and Components section are updated in place; a new "Thread
Scrollbar" component entry is added. New files: `src/app/_components/ScrollCue.tsx`. Removed:
`LandingHero.tsx`'s inline `ScrollCue` function and `globals.css`'s `scroll-cue-dot` keyframes/class.
`theme` project, full suite, typecheck, lint, and the full e2e suite re-verified; the served CSS was
checked directly for the scrollbar rules, the glow, and the arrow's presence in the landing HTML with
zero remaining references to the deleted dot cue.

---

## D-023 — Merge the glow into the scroll cue's own dismissal; fix a real animation bug

**Date**: 2026-07-30 · **Status**: Accepted · **Supersedes**: D-022 on glow shape/lifecycle only

**Context.** D-022 shipped the glow as a standalone element in `LandingHero.tsx`, breathing forever
regardless of scroll — the arrow dismissed itself, the glow never did. Asked to fix that, shrink the
glow's height, and widen its spread.

**Decision.** Moved the glow into `ScrollCue.tsx` as a second element sharing the same `dismissed`
state the arrow already tracks — one invitation, one dismissal, not two independently-timed ones.
Height `h-48` → `h-32`; gradient shape from an implicit `farthest-corner` ellipse to an explicit
`ellipse 92% 100% at 50% 100%`, spreading it visibly toward both edges instead of pooling centered.

A real bug surfaced immediately: adding a plain `opacity-0` utility class did not actually hide the
glow, because `.hero-glow`'s `animation` writes `opacity` every frame, and a running CSS animation
overrides a same-specificity non-animated declaration for the property it controls — the breathe
cycle kept winning. Fixed with `.hero-glow.is-dismissed { animation: none; opacity: 0; }`, two classes
of specificity beating `.hero-glow`'s one, declared after it in source order. A second instance of
the same class of bug was caught before shipping, not after: the `prefers-reduced-motion` block's
held frame uses `opacity: 0.55 !important`, which would have beaten `.is-dismissed`'s plain
`opacity: 0` forever for reduced-motion visitors — fixed by adding
`.hero-glow.is-dismissed { opacity: 0 !important; }` inside that same media block.

**Why.** Both bugs are the same mistake in miniature: assuming a plain utility class can override
something declared with more power (a running animation; an `!important` rule) just by existing.
Neither can, and the fix in both cases was the same shape — give the dismissed state real cascade
priority instead of adding a class and hoping.

**Consequences.** `src/app/_components/LandingHero.tsx` no longer renders the glow directly.
`ScrollCue.tsx` returns both elements from a `<>` fragment. `globals.css` gains `.is-dismissed` rules
in two places (base and reduced-motion). Re-verified: full suite (188 tests, one transient flake on
first run, clean on immediate re-run — not treated as a real regression since it did not reproduce),
typecheck, lint, full e2e suite, and the served CSS decoded to confirm the new ellipse shape, height,
and both `.is-dismissed` rules compiled correctly.

---

## D-024 — Drop the arrow, full-width glow only; suppress a Dark Reader hydration mismatch

**Date**: 2026-07-30 · **Status**: Accepted · **Supersedes**: D-023 on scroll cue composition

**Context.** Two unrelated requests together: the scroll cue's glow should reach the full width
(D-023 shipped it at 92%, visibly short of the edges), and the arrow above it should go — the glow
alone is the cue now. Separately, a hydration-mismatch console error on the navbar logo, diffing
`style={{color:"transparent"}}` against `style={{color:"transparent","--darkreader-inline-color":
"transparent"}}` — the `--darkreader-inline-color` property is the Dark Reader browser extension's
own signature, injected into inline styles before React hydrates.

**Decision.** `ScrollCue.tsx` now renders only the glow div; the arrow SVG, its float animation, and
`.scroll-arrow` are deleted, not left dead. The glow's gradient widens to `ellipse 100% 100% at 50%
100%` with `transparent 80%` (was 92%/75%), reaching the container's edges. Both `<Image>` logos in
`Navbar.tsx` get `suppressHydrationWarning` — the same treatment `layout.tsx` already gives the theme
pre-paint script's class mismatch, since this is the identical category of problem: content injected
by something outside the app, before React's first render, that can never match server-rendered HTML
and isn't supposed to.

**Why.** The Dark Reader mismatch is not a bug this project can fix in its own code — the extension
runs before React hydrates, on every page load, for any visitor who has it installed, regardless of
what Aguja renders. `suppressHydrationWarning` is the correct tool for exactly this: a known,
expected, harmless mismatch, not React silently swallowing a real one — it does not suppress
mismatches on children, only the element it's applied to.

**Consequences.** `globals.css` loses `@keyframes scroll-arrow-float`, `.scroll-arrow`, and the now-
empty reference to it in the reduced-motion block. `ScrollCue.tsx` returns a single element instead
of a fragment with two. Re-verified: full suite (188 tests), typecheck, lint, full e2e suite, a
source grep confirming zero remaining references to the deleted arrow, and the served CSS decoded to
confirm the widened ellipse.

---

## D-025 — The radial gradient was the wrong tool; use a linear one

**Date**: 2026-07-30 · **Status**: Accepted · **Supersedes**: D-024 on the glow's gradient technique

**Context.** D-024's widened ellipse (`100% 100%`) still didn't reach the edges — reported with a
screenshot showing visibly dark corners. The `hero-glow` box is a full section width but only 128px
tall. Computed the actual geometry rather than guessing again: from the gradient's origin
(bottom-centre), the farthest corner sits at ~653px, but the box's own horizontal edge sits at
~640px — 98% of that radius. Any colour stop low enough to look like a glow (75–80%) had already
faded out well before reaching that 98% mark, regardless of the explicit size percentage used. This
was the second attempt at the same wrong technique (D-023 at 92%, D-024 at 100%), not a tuning
problem a third percentage would have fixed.

**Decision.** Replace the radial gradient with `linear-gradient(to top, var(--color-violet-glow) 0%,
transparent 100%)`.

**Why.** A radial gradient's entire premise is distance-from-a-point, which is structurally opposed
to "uniform across the full width" — on a box this wide and this short, the corner-seeking default
sizing (and every percentage-based variant of it tried) always fades before reaching the horizontal
edges, because those edges sit almost as far from the center as the corners do. A linear gradient
in the vertical direction has no horizontal axis to vary across at all: every x-coordinate receives
the identical top-to-bottom fade, by construction, not by a percentage tuned to look close enough.
This is the second design bug found and fixed within this feature's glow specifically (after
D-023's animation-override bug) — worth noting because both stemmed from the same root cause,
reaching for CSS syntax that looked plausible without working out what it actually computes to on
this exact box shape.

**Consequences.** `globals.css`'s `.hero-glow` background declaration changes; the `hero-glow-breathe`
opacity animation is untouched. Re-verified: full suite (188 tests), typecheck, lint, and the served
CSS decoded to confirm the linear-gradient compiled as written.

---

## D-026 — The glow was still only as wide as the hero's own centred column

**Date**: 2026-07-30 · **Status**: Accepted · **Supersedes**: D-025 on the glow's horizontal containment

**Context.** D-025's full-width linear gradient still didn't reach the page edges — reported again,
this time with the actual cause named directly: `inset-x-0` makes an absolutely-positioned element
span its *containing block's* edges, and the containing block here is the hero's own
`max-w-7xl mx-auto` section, not the page. On any viewport wider than 1280px, that leaves a visible
gap on both sides between the section's edge and the true page edge — exactly what the screenshot
showed.

**Decision.** Break the glow out of the section with the standard technique for exactly this
situation: `left-1/2` (its left edge at the containing block's horizontal centre) + `w-screen`
(full viewport width) + `-translate-x-1/2` (shifted left by half its own width). Net effect: the
element's left edge lands at the viewport's own left edge, regardless of how narrow or offset its
actual containing block is — because that containing block is itself horizontally centred in the
viewport (`mx-auto`), the math cancels out exactly. `bottom-0` is untouched, so vertical placement
at the hero's fold — the one thing that genuinely does need to stay relative to the section, not the
whole page — is unaffected.

**Why documented at this length for a four-class change**: `w-screen` (100vw) is a known source of
spurious horizontal scrollbars, because `vw` units are defined against the initial containing block,
which on many browsers includes the scrollbar gutter the visible viewport doesn't have. Given this
exact project already shipped one real horizontal-overflow defect this session (`ToolDial`'s fixed
`520px` width, found and left unscoped-out during the 004 headline work), a second glow-shaped one
was worth ruling out rather than assuming away. Checked directly: `document.documentElement`'s
`scrollWidth` vs `clientWidth` at six viewport widths (1920 down to 390px) measured *identical*
overflow numbers with and without this change — confirmed by temporarily reverting to `inset-x-0`,
re-running the same check, and diffing. The overflow that exists at 1024px and narrower is entirely
the pre-existing `ToolDial` defect; this change contributes zero additional pixels of overflow at
any tested width.

**Consequences.** `ScrollCue.tsx`'s glow div's horizontal positioning classes change; `bottom-0`,
`h-32`, and the `is-dismissed`/transition logic are untouched. Re-verified: full suite (188 tests),
typecheck, lint, full e2e suite, the served HTML checked for the new classes, and the six-viewport
overflow comparison described above — the only verification in this feature's history run twice,
once against each version of the code, specifically to isolate cause from coincidence.

---

## D-027 — `100vw` was the actual bug; drop it for a normal-flow full-width sibling

**Date**: 2026-07-30 · **Status**: Accepted · **Supersedes**: D-026 on technique (not on intent)

**Context.** D-026's `left-1/2 w-screen -translate-x-1/2` breakout shipped, was checked for
horizontal overflow across six viewport widths, measured zero additional overflow at every one — and
still produced a real horizontal scrollbar, reported with a screenshot. The check that passed and the
bug that shipped are both explained by the same fact: `vw` units are defined against the browser's
initial containing block, which on many platforms includes the scrollbar gutter, while
`document.documentElement.clientWidth` (what the check measured) excludes it by definition. Once a
page is tall enough to need a vertical scrollbar — this one always is — `100vw` and the true available
width part ways by exactly that gutter's size, on any browser using a classic (space-reserving)
scrollbar. Playwright's headless Chromium did not reproduce it because it renders with an overlay
scrollbar that reserves no layout space, so in that specific environment there was nothing to detect.

**Decision.** Remove the `position:absolute` + `vw` breakout entirely. `ScrollCue` moves out of the
hero `<section>` and becomes a normal-flow sibling of it inside `<main>` (`src/app/[locale]/page.tsx`),
sized `w-full` — genuinely 100% of its parent's real content box, no viewport unit involved — and
pulled up over the hero's bottom edge with `-mt-24` (a negative top margin exactly matching its own
`h-24` height, so it visually overlaps the fold while claiming zero net space in the flow). Height
also reduced from 128px to 96px per the same request that surfaced the scrollbar.

**Why.** A block-level element at its default or `100%` width is, by CSS's own layout rules, always
exactly as wide as its containing block's content box — which is always scrollbar-gutter-excluded,
in every browser, without exception. This isn't a technique that happens to test well; it's
structurally incapable of the class of bug `vw` caused, which is why no further overflow measurement
was needed to trust it the way D-026's claim needed checking. The general lesson: a metric that
passed everywhere it was checked can still be measuring the wrong thing — `clientWidth` vs
`scrollWidth` is the right check for genuine content overflow, but it cannot see a unit that disagrees
with `clientWidth` about what "the viewport" even means in the first place.

**Consequences.** `LandingHero.tsx` no longer imports or renders `ScrollCue`. `page.tsx` renders it
directly inside `<main>`, immediately after `<LandingHero />`. `ScrollCue.tsx`'s glow div drops
`absolute`, `left-1/2`, `w-screen`, `-translate-x-1/2`, and `bottom-0` in favour of `w-full` and
`-mt-24`; `is-dismissed`/transition logic is untouched. Re-verified: full suite (188 tests),
typecheck, lint, full e2e suite, the served HTML checked for the new structure and classes, and the
same six-viewport overflow comparison as D-026 — identical numbers, confirming the pre-existing
`ToolDial` overflow is what remains and nothing new was added.

---

## D-028 — A separate, stronger glow token for the light theme

**Date**: 2026-07-30 · **Status**: Accepted

**Context.** The hero glow reused `--color-violet-glow` (light: `rgba(122, 63, 194, 0.35)`), the same
token the needle's `thread-glow` and the scrollbar thumb use. Reported as too faint in the light
theme specifically — not reported in dark, where the same token reads fine for all three uses.

**Decision.** New token, `--color-hero-glow`, declared per theme alongside `--color-violet-glow`:
dark keeps the identical value (`rgba(169, 112, 255, 0.45)`, unchanged), light raises the alpha to
`0.6` (`rgba(122, 63, 194, 0.6)`). `.hero-glow`'s linear-gradient reads this new token instead of
`--color-violet-glow`.

**Why.** A translucent violet wash gains most of its "glow" character from luminance contrast against
what's behind it, not from hue alone — the same alpha reads as a bright emission against near-black
and as a flat tint against linen, because the two backgrounds start at opposite ends of the
lightness scale. Raising `--color-violet-glow` itself would have fixed this but also intensified the
needle's `thread-glow` and the scrollbar thumb's box-shadow in light mode, neither of which was
reported as a problem — a shared token would have coupled an unrelated fix to a specific complaint.
A second, purpose-scoped token keeps the fix precisely where it was asked for.

**Consequences.** `globals.css` gains `--color-hero-glow` in both `:root` and `:root.light`.
`.hero-glow`'s background declaration is the only consumer changed. Re-verified: full suite (188
tests), typecheck, lint, full e2e suite, and the served CSS decoded to confirm both themes' values
compiled correctly (`#a970ff73` dark, `#7a3fc299` light — alpha ≈0.45 and ≈0.60 respectively).

---

## D-029 — Replace the hero's Tool Dial with a tilted replica of the tool panel

**Date**: 2026-08-01 · **Status**: Accepted

**Context.** The landing hero's right-hand component was the Tool Dial: a circular
component that cycled abstract previews of the four tools and auto-advanced until
first interaction. The dial's fixed `w-[520px]` also caused the hero's only
horizontal overflow at 360px (already documented in the FR-079 e2e test). Request
was to show the tools section as it *actually* looks — the real `/tool` panel —
instead of an abstract dial, slightly tilted, with the same violet glow the hero
already carries at its bottom fold.

**Decision.** `ToolDial` is replaced by `ToolPanelPreview` (`src/app/_components/`):
a faithful, miniature, static replica of the real `ToolLayout` — the shared
sidebar (Chunk Inspector active), the left input column (document, strategy,
query), the chunked-document canvas, and the ranked results — rebuilt from the
design tokens and the catalogue copy, not imported from the live tool (which is
bound to the session store and the embedder worker). The panel is tilted `-2°` on
desktop, anchored to the hero's bottom edge so it rests on the existing fold glow
(`ScrollCue`, unchanged), and gains its own breathing radial violet glow at its
bottom seam via a new `.tool-glow` class — an explicit, narrow extension of the
Earned Glow Rule (D-022) to this one composition. It is static (the needle and
thread remain the hero's only authored motion moment) and `aria-hidden`, since the
navbar's Tools menu already owns navigation. `ToolDial.tsx` is deleted.

**Why.** A debugger's landing should show the instrument, not an abstraction of it.
The miniature panel proves the product's core claim — visible chunk boundaries and
a ranked list — in one glance, using the same components' vocabulary (borders,
`panel-inset-bg`, the violet thread bars) the tool itself uses. Rebuilding it from
tokens keeps it vector-crisp at any DPI, theme-aware, and free of the fixed-width
overflow that caused the dial's 360px defect (FR-079 is now fully clean, not just
scoped around it). A screenshot would have been faster but pixelates on retina and
breaks in light theme; importing the live UI would drag session/embedder state and
a 23 MB model download into the landing.

**Consequences.** `LandingHero.tsx` renders `ToolPanelPreview` instead of
`ToolDial`. New `ToolPanelPreview.tsx` (server component) hardcodes a synthetic
English refund-policy document and its fixed-size-500 chunk offsets, plus mock
rankings, all rendered through existing catalogue keys; the sample document is
English-only by the same rule as the evidence board's excerpt (D-013). `globals.css`
gains `.tool-glow` and its `prefers-reduced-motion` override. `docs/decisions.md`
grows this entry. DESIGN.md's "Tool Dial" component section is now stale and awaits
a follow-up edit; `specs/003-bilingual-shell-docs/plan.md`'s component-tree sketch
similarly lists `ToolDial`. Verified: full suite, typecheck, lint, full e2e suite,
and the served HTML/CSS inspected.

## D-030 — Rework the hero panel replica's composition

**Date**: 2026-08-01 · **Status**: Accepted

**Context.** D-029's `ToolPanelPreview` was bottom-anchored (`md:self-end md:mb-6`),
which let the panel cover the ScrollCue fold glow (`.hero-glow`), and wore a
bottom-seam radial glow of its own. The composition read as the panel sitting on
two competing lights, with the fold's own glow hidden behind it.

**Decision.** Recentre the replica vertically (drop `md:self-end`/`md:mb-6`) so the
hero's `items-center` centres it and the fold glow is no longer obscured; widen it
to 50% of the hero up to `max-w-[660px]`, with slightly wider grid columns
(`md:grid-cols-[160px_minmax(0,1fr)_184px]`). Remove the `EnglishOnlyNotice` strip
from the decorative mockup — the panel is illustration, and the English-only
disclosure already lives where the real tool explains it. Change `.tool-glow` from
a bottom-seam radial to a full all-around halo: the element is now
`-inset-4 rounded-[28px] blur-2xl` with a solid translucent
`--color-hero-glow` fill, so the same breathing keyframe wraps every edge instead
of one seam. Layer the `BigNeedle` above the panel (`relative z-10 md:-mr-20`),
overlapping its left edge, so the needle reads as stitching across the instrument.

**Why.** The panel is the hero's centrepiece; centring it and giving it a
surrounding glow makes it read as the instrument emitting light, while restoring
the fold glow to visibility. The overlap with the needle strengthens the motif's
story without new motion or dependencies.

**Consequences.** `ToolPanelPreview.tsx` drops the `EnglishOnlyNotice` import and
strip, widens to `max-w-[660px] md:w-[50%]`, and renders the halo
(`-inset-4 rounded-[28px] blur-2xl`) inside the `md:-rotate-2` wrapper, behind the
panel. `LandingHero.tsx`'s `BigNeedle` gains `relative z-10 md:-mr-20`.
`globals.css`'s `.tool-glow` swaps the radial background for a solid
`var(--color-hero-glow)` fill; its `prefers-reduced-motion` override is unchanged.
`ScrollCue.tsx` and `.hero-glow` were intentionally left untouched. Verified: full
suite, typecheck, lint, the e2e hero suite, and a dedicated e2e check of the halo
geometry, rotation, and viewport overflow.

## D-031 — Tilt the hero panel replica right, glow the border, let it float

**Date**: 2026-08-01 · **Status**: Accepted

**Context.** D-030 left the replica leaning left (`md:-rotate-2`) inside a full
all-around halo (`-inset-4 ... blur-2xl`) that read as light behind the whole
panel. The user wanted the lean mirrored to the right, the glow confined to the
panel's rounded border rather than a halo floating above everything, and — if
cheap — a gentle levitation so the instrument feels weightless.

**Decision.** Flip the tilt to `md:rotate-2` (Tailwind v4's `rotate-*` utilities
set the `rotate` property, so positive is clockwise). Replace the halo element
with an edge ring: `inset-0 rounded-lg` matching the panel's radius, a faint
`border-violet/30` line, and `.tool-glow` becomes transparent with
`box-shadow: 0 0 18px 2px var(--color-hero-glow)` — the glow hugs the border
instead of blooming behind the panel, keeping the same breathing keyframe. Add a
`hero-float` keyframe (translateY 0↔-10px, 6s ease-in-out infinite) on the
outermost wrapper so the replica drifts on every breakpoint while the tilt stays
desktop-only; `rotate` and `transform` are independent properties on separate
wrappers, so they compose without conflict.

**Why.** A soft luminous ring reads as the instrument emitting light at its
edges — the same violet glow language as the needle and fold — without the neon
hardness of a constant-intensity border, which light theme's violet-on-linen
would render as a flat tint (see the `--color-hero-glow` rationale). The float is
a new authored motion moment that shares the existing `prefers-reduced-motion`
guard.

**Consequences.** `ToolPanelPreview.tsx`'s outer wrapper gains `hero-float`, the
tilt wrapper flips to `md:rotate-2`, and the glow element becomes
`inset-0 rounded-lg border border-violet/30`. `globals.css`'s `.tool-glow` drops
its solid fill for `background: transparent` plus the edge box-shadow, gains the
`hero-float` keyframe/class, and its `prefers-reduced-motion` override is
extended to `.hero-float`. `docs/decisions.md` gains this entry. `ScrollCue.tsx`,
`.hero-glow`, and the landing e2e suite are untouched — that spec asserts heading
geometry only, never tilt or glow.
