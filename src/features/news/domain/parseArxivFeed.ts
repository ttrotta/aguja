import type { ResearchPaper } from "./types";

/**
 * arXiv's Atom feed wraps every field's text across several lines with
 * leading indentation, so a plain tag-content match still needs the entities
 * decoded and the whitespace collapsed before it reads as a sentence.
 */
function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function extractTag(entry: string, tag: string): string {
  const match = entry.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return match ? collapseWhitespace(decodeEntities(match[1])) : "";
}

/**
 * Parses arXiv's Atom query response into papers. A regex extraction rather
 * than an XML/DOM parser: the feed shape is small and fixed (one flat set of
 * tags per `<entry>`), and Node's domain test environment has no DOMParser to
 * reach for.
 */
export function parseArxivFeed(atomXml: string): ResearchPaper[] {
  const entries = atomXml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];

  return entries
    .map((entry) => {
      const id = extractTag(entry, "id");
      return {
        id,
        title: extractTag(entry, "title"),
        summary: extractTag(entry, "summary"),
        url: id,
        publishedAt: extractTag(entry, "published"),
      };
    })
    .filter((paper) => paper.id !== "" && paper.title !== "");
}
