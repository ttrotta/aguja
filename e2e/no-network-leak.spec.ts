import { test, expect } from "@playwright/test";

// The verifiable form of the constitution's strongest claim (Principle V):
// nothing the user pastes or types ever leaves the device. If this test
// ever fails, treat it as a stop-the-line defect ahead of anything else in
// flight (tasks.md).
test("no request during a full session carries document or query text (SC-009, FR-013)", async ({
  page,
}) => {
  test.setTimeout(150_000);
  const DOCUMENT_MARKER = "UNMISTAKABLE_DOCUMENT_MARKER_0xA6";
  const QUERY_MARKER = "UNMISTAKABLE_QUERY_MARKER_0xB7";

  const leaks: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    const postData = request.postData() ?? "";
    for (const marker of [DOCUMENT_MARKER, QUERY_MARKER]) {
      if (url.includes(marker) || postData.includes(marker)) {
        leaks.push(`${request.method()} ${url}`);
      }
    }
  });

  await page.goto("/tool/chunks");

  // Paste.
  await page
    .getByLabel("Document")
    .fill(`${DOCUMENT_MARKER} — a paragraph of text to be chunked.\n\n${DOCUMENT_MARKER} again.`);

  // Chunk: exercise every model-free strategy.
  const select = page.getByRole("combobox");
  await select.selectOption("fixed-size");
  await select.selectOption("fixed-size-overlap");
  await select.selectOption("paragraphs");
  await select.selectOption("fixed-size");

  // Query.
  await page.getByPlaceholder("What are you trying to find?").fill(QUERY_MARKER);
  await page.waitForFunction(
    () => {
      const btn = [...document.querySelectorAll("button")].find((b) => b.textContent === "Search");
      return btn !== undefined && !btn.disabled;
    },
    undefined,
    { timeout: 120_000 },
  );
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByText(/results?, ranked by similarity/)).toBeVisible({ timeout: 20_000 });

  expect(leaks).toEqual([]);
});
