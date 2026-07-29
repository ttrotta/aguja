import type { DocContent } from "./types";

/**
 * English documentation.
 *
 * The RAG primer and the concepts section were checked against current sources
 * rather than written from memory (T053) — the figures on chunking's effect on
 * recall, on typical token ceilings, and on how often truncation bites in
 * practice all come from 2026 material, not recollection.
 */
export const en: DocContent = {
  "rag-primer": {
    title: "What retrieval actually does",
    blocks: [
      {
        kind: "paragraph",
        text: "Retrieval-augmented generation means answering a question with text you looked up rather than text the model memorised. The lookup step is the part that decides whether the answer can be right at all: if the passage holding the answer never comes back, no amount of model quality downstream will recover it.",
      },
      {
        kind: "paragraph",
        text: "That lookup does not search your document. It searches pieces of your document. Before anything is retrievable it has to be cut into chunks, each chunk is turned into a vector, and your question is turned into a vector too. What comes back is whichever chunks sit closest to your question in that vector space. So the cut decides what can be found.",
      },
      {
        kind: "callout",
        tone: "note",
        text: "Chunking choice can move recall by around 9% on the same corpus — a larger effect than swapping the embedding model. It is the highest-leverage decision in most retrieval systems and the least visible one.",
      },
      {
        kind: "paragraph",
        text: "That invisibility is the problem Aguja exists for. A bad chunk boundary does not raise an error. It produces a plausible ranked list that quietly omits the one passage you needed, and nothing in the output says which cut caused it. Every tool here makes one part of that hidden process visible.",
      },
      {
        kind: "list",
        items: [
          "Chunk Inspector — where the cuts land, and what each chunk contains.",
          "Strategy Comparison — how two different ways of cutting change the ranking.",
          "Query Sensitivity — whether the ranking survives asking the same thing differently.",
          "Confusable Chunks — which pieces the retriever cannot tell apart.",
        ],
      },
      {
        kind: "callout",
        tone: "note",
        text: "Everything runs in your browser. The document you paste is never uploaded, and there is no account and no API key. You can verify that by watching the network panel while you work.",
      },
    ],
  },

  "tool-chunks": {
    title: "Chunk Inspector",
    blocks: [
      {
        kind: "paragraph",
        text: "Shows where your document is cut, and what each resulting chunk contains. This is the ground truth every other tool builds on: if the boundaries are wrong here, every ranking you see afterwards is a consequence of that, not of the query.",
      },
      {
        kind: "paragraph",
        text: "Pick a strategy on the left and the document redraws immediately. Dashed underlines mark chunk boundaries; a solid violet underline marks the chunk you have selected. Where two chunks cover the same text — which the overlap strategy does deliberately — the underline is heavier.",
      },
      {
        kind: "list",
        items: [
          "Fixed size — cuts every N characters, ignoring where sentences end.",
          "Fixed size with overlap — the same, but each chunk repeats the last N characters of the one before, so a passage split across a boundary still appears whole somewhere.",
          "Paragraphs — cuts on blank lines, which respects the document's own structure but produces wildly uneven chunk sizes.",
          "By tokenization units — cuts on the model's own tokens rather than characters. This one needs the tokenizer to finish downloading; the other three work immediately.",
        ],
      },
      {
        kind: "example",
        caption: "A 900-character policy section, cut at fixed size 500",
        rows: [
          { label: "Chunk 0", value: "characters 0–500, ends mid-sentence on \"…regardless of the original\"" },
          { label: "Chunk 1", value: "characters 500–900, begins with \"payment method or the refund's…\"" },
          { label: "What breaks", value: "A query about the original payment method matches neither chunk well — the phrase exists in the document but in neither piece intact." },
        ],
      },
      {
        kind: "paragraph",
        text: "Run a query from the same panel and every chunk comes back ranked, with no top-N cut. Seeing the chunk you expected sitting at rank 14 is more informative than not seeing it at all, which is why nothing is hidden.",
      },
    ],
  },

  "tool-compare": {
    title: "Strategy Comparison",
    blocks: [
      {
        kind: "paragraph",
        text: "Runs the same query against the same document cut two different ways, side by side. Use it when you suspect the chunking is the reason something is not being retrieved, and you want evidence rather than a hunch.",
      },
      {
        kind: "paragraph",
        text: "Selecting a passage on either side selects the same passage on the other. Because the two strategies cut the document differently, that is not the same chunk number on both sides — it is whichever chunk covers that position in the text. The header then tells you what rank that passage reached under each strategy.",
      },
      {
        kind: "example",
        caption: "One query, two strategies, over the same refund policy",
        rows: [
          { label: "Fixed size 500", value: "the passage lands at rank 9, score 0.612" },
          { label: "Fixed size 500 with overlap 100", value: "the same passage lands at rank 2, score 0.808" },
          { label: "Reading", value: "The passage was being split by a boundary. Overlap repaired it, and the ranking moved seven places on a change that touched no model and no query." },
        ],
      },
      {
        kind: "callout",
        tone: "note",
        text: "Two strategies at a time, deliberately. Three columns would turn a comparison into a dashboard, and the question this tool answers is always \"does this specific change help?\"",
      },
    ],
  },

  "tool-queries": {
    title: "Query Sensitivity",
    blocks: [
      {
        kind: "paragraph",
        text: "Asks the same question several ways and shows how much each chunk's rank moves between them. Real users do not phrase things the way your test query does, and a retrieval setup that only works for one phrasing is not working.",
      },
      {
        kind: "paragraph",
        text: "Enter between two and five phrasings of one question and run it. Every chunk is listed with the rank it reached under each phrasing, and with its spread — the distance between its best and its worst rank. The list is ordered by spread, so the most phrasing-sensitive chunks come first.",
      },
      {
        kind: "example",
        caption: "Three phrasings of one question about refund timing",
        rows: [
          { label: "\"how long do refunds take\"", value: "chunk 4 → rank 1" },
          { label: "\"when will I get my money back\"", value: "chunk 4 → rank 6" },
          { label: "\"refund processing period\"", value: "chunk 4 → rank 2" },
          { label: "Spread", value: "5 (#1–#6). The chunk holds the answer, but one ordinary way of asking pushes it out of the top five — which is where most systems cut off." },
        ],
      },
      {
        kind: "paragraph",
        text: "A large spread does not mean the chunk is bad. It means the chunk's retrievability depends on wording, and that is worth knowing before it depends on a user's wording in production.",
      },
    ],
  },

  "tool-confusable": {
    title: "Confusable Chunks",
    blocks: [
      {
        kind: "paragraph",
        text: "Finds pairs of chunks the retriever cannot separate: chunks so close in vector space that which one comes back first is close to arbitrary. It reports each pair with two numbers and both chunks' actual text.",
      },
      {
        kind: "list",
        items: [
          "Similarity — how close the two chunks sit in vector space, on the same 0–1 scale as every other score here.",
          "Shared wording — how much literal vocabulary the two chunks have in common.",
        ],
      },
      {
        kind: "callout",
        tone: "warning",
        text: "This tool never calls a pair a duplicate, because the numbers cannot support that claim. Measured: two sentences differing only in \"must\" versus \"must not\" score 0.96 similarity and 0.86 shared wording — the same profile as a genuine duplicate. High on both can mean redundancy, or it can mean a live contradiction. Only the text tells you which, which is why the text is shown.",
      },
      {
        kind: "example",
        caption: "Two pairs surfaced from one policy document",
        rows: [
          { label: "chunk 0 ↔ chunk 1", value: "sim 0.994, overlap 0.90 — the same clause reworded. Harmless redundancy." },
          { label: "chunk 2 ↔ chunk 3", value: "sim 0.934, overlap 0.86 — \"thirty days\" against \"fourteen days\". A contradiction, and it looks almost identical to the pair above." },
          { label: "Reading", value: "The numbers cannot separate these two cases. Reading the two chunks takes seconds and separates them completely." },
        ],
      },
      {
        kind: "paragraph",
        text: "Raise the threshold to see only the closest pairs, lower it to see more. On a large document only the first several hundred chunks are compared, and the interface says so when that happens rather than quietly comparing a subset.",
      },
    ],
  },

  troubleshooting: {
    title: "A passage is not being retrieved. What now?",
    blocks: [
      {
        kind: "paragraph",
        text: "The passage is in your document, your query is reasonable, and the search does not return it. Work through these in order — each step rules out one cause, and the earlier causes are both more common and cheaper to fix.",
      },
      {
        kind: "steps",
        items: [
          {
            tool: "Chunk Inspector",
            check: "Find the passage in the document view and look at where the boundaries fall around it. Is it split across two chunks? A passage cut in half matches neither half well, and this is the single most common cause.",
          },
          {
            tool: "Chunk Inspector",
            check: "Check the size of the chunk holding it. If it is over roughly 1,000 characters, the tail was cut before embedding and may never have been part of the score at all. Ranked results mark such chunks as truncated.",
          },
          {
            tool: "Strategy Comparison",
            check: "If a boundary is the suspect, put your current strategy against one with overlap. If the passage jumps up the ranking, the boundary was the cause and you have your fix.",
          },
          {
            tool: "Query Sensitivity",
            check: "If the chunk looks intact and still ranks low, try three phrasings of the question. A large spread means the chunk is retrievable but only for some wordings — a vocabulary mismatch between your document and your users, not a chunking problem.",
          },
          {
            tool: "Confusable Chunks",
            check: "If the passage ranks well but the wrong chunk keeps winning, check whether the two are confusable. If they are, the retriever is not choosing between them on merit, and no query change will reliably fix that — the document needs to disambiguate them.",
          },
        ],
      },
      {
        kind: "callout",
        tone: "note",
        text: "If all five come back clean, the likely cause is outside chunking: the wording of your document and the wording of your query may simply have little in common, which no boundary change repairs.",
      },
    ],
  },

  concepts: {
    title: "What is happening underneath",
    blocks: [
      {
        kind: "paragraph",
        text: "An embedding is a list of numbers — 384 of them, for the model Aguja runs — produced from a piece of text. Texts that mean similar things end up with similar lists. Nothing about this is exact: the numbers encode a rough sense of meaning learned from training data, not the text itself.",
      },
      {
        kind: "paragraph",
        text: "Similarity between two embeddings is measured by cosine similarity: the angle between them, ignoring their length. It runs from -1 to 1 in the mathematics; Aguja displays it rescaled to 0–1, matching every other score on screen. All vectors here are normalised to unit length first, which is standard practice and makes the comparison a straightforward dot product.",
      },
      {
        kind: "callout",
        tone: "warning",
        text: "The model reads at most 256 tokens — roughly 1,000 characters. Anything past that is cut before the text is embedded, so the tail contributes nothing to the chunk's score. That is on the low side even among older models, which typically stop at 512; newer ones reach several thousand. Aguja marks truncated chunks everywhere they appear rather than letting them look like ordinary results.",
      },
      {
        kind: "paragraph",
        text: "This matters more than it sounds. In practice something like 8 to 15 percent of real documents hit a model's ceiling, and those that do commonly lose 40 to 50 percent of their tokens. A chunk whose second half was silently discarded still produces a confident-looking score.",
      },
      {
        kind: "paragraph",
        text: "The model is English-only, and that is a deliberate trade. It was chosen because it downloads in about 23 MB, which is what makes running entirely in your browser tolerable on a first visit. A multilingual model would have cost roughly five times that and halved the token ceiling. Text in other languages still produces scores; those scores are not trustworthy, and the interface says so wherever they appear.",
      },
      {
        kind: "paragraph",
        text: "Finally, nothing here is persisted. The document lives in the page for as long as the page does. Reloading discards it, which is a privacy property rather than a missing feature — there is nowhere for it to have been stored.",
      },
    ],
  },
};
