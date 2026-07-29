import { parseArxivFeed } from "./domain/parseArxivFeed";
import type { ResearchPaper } from "./domain/types";

const ARXIV_QUERY_URL =
  'https://export.arxiv.org/api/query?search_query=abs:"retrieval+augmented+generation"' +
  "&sortBy=submittedDate&sortOrder=descending&max_results=12";

/**
 * The only I/O in this feature — kept out of `domain/` so the Atom parsing
 * stays a plain, framework-free function testable without a network.
 * Revalidated hourly: new papers appear without a redeploy, and arXiv is not
 * hit on every single page view.
 */
export async function fetchLatestRagPapers(): Promise<ResearchPaper[]> {
  const response = await fetch(ARXIV_QUERY_URL, { next: { revalidate: 3600 } });
  if (!response.ok) throw new Error(`arXiv responded with ${response.status}`);
  return parseArxivFeed(await response.text());
}
