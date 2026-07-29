import { describe, expect, it } from "vitest";
import { parseArxivFeed } from "./parseArxivFeed";

const FEED = `<?xml version='1.0' encoding='UTF-8'?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>arXiv Query</title>
  <entry>
    <id>http://arxiv.org/abs/2607.25959v1</id>
    <updated>2026-07-28T16:43:56Z</updated>
    <published>2026-07-28T14:10:00Z</published>
    <title>Detecting Knowledge Inconsistencies
   Across Text, Tables, and Knowledge Graphs</title>
    <summary>  Retrieval-augmented generation relies on &quot;grounded&quot; evidence
   &amp; consistency across sources.
  </summary>
  </entry>
  <entry>
    <id>http://arxiv.org/abs/2607.11111v2</id>
    <published>2026-07-27T09:00:00Z</published>
    <title>A Second Paper</title>
    <summary>Short summary.</summary>
  </entry>
</feed>`;

describe("parseArxivFeed", () => {
  it("extracts one paper per entry, in feed order", () => {
    const papers = parseArxivFeed(FEED);
    expect(papers).toHaveLength(2);
    expect(papers[0].id).toBe("http://arxiv.org/abs/2607.25959v1");
    expect(papers[1].id).toBe("http://arxiv.org/abs/2607.11111v2");
  });

  it("collapses multi-line titles into one sentence", () => {
    const [paper] = parseArxivFeed(FEED);
    expect(paper.title).toBe(
      "Detecting Knowledge Inconsistencies Across Text, Tables, and Knowledge Graphs",
    );
  });

  it("decodes XML entities and trims surrounding whitespace in the summary", () => {
    const [paper] = parseArxivFeed(FEED);
    expect(paper.summary).toBe(
      'Retrieval-augmented generation relies on "grounded" evidence & consistency across sources.',
    );
  });

  it("uses the entry id as the paper url", () => {
    const [paper] = parseArxivFeed(FEED);
    expect(paper.url).toBe(paper.id);
  });

  it("reads the published date", () => {
    const [paper] = parseArxivFeed(FEED);
    expect(paper.publishedAt).toBe("2026-07-28T14:10:00Z");
  });

  it("returns an empty list for a feed with no entries", () => {
    expect(parseArxivFeed("<feed></feed>")).toEqual([]);
  });
});
