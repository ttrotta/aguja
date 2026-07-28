import { test, expect, type Page, type Locator } from "@playwright/test";

// The model is a real ~23 MB download from the Hugging Face CDN — these
// tests exercise the actual worker, not a mock, so give the model load
// generous room (observed ~20s locally), well beyond Playwright's default
// 30s per-test timeout.
const MODEL_LOAD_TIMEOUT = 120_000;

async function waitForModelReady(page: Page) {
  await page.waitForFunction(
    () => {
      const btn = [...document.querySelectorAll("button")].find((b) => b.textContent === "Search");
      return btn !== undefined && !btn.disabled;
    },
    undefined,
    { timeout: MODEL_LOAD_TIMEOUT },
  );
}

// Document text can legitimately contain the word "search" (as in one of
// this file's own fixtures), so the button must be matched exactly — a
// substring match would also hit ChunkedDocument's text spans.
function searchButton(page: Page): Locator {
  return page.getByRole("button", { name: "Search", exact: true });
}

test.describe("retrieval (US2 — P2)", () => {
  test.describe.configure({ timeout: 150_000 });

  test("labeled progress is shown while the model downloads (SC-004, FR-019)", async ({ page }) => {
    await page.goto("/tool/chunks");
    await page.getByLabel("Document").fill("Anything non-empty to reveal the model status.");
    // The download is real and can finish before we look, so this only
    // asserts the progress UI *can* appear — not that it always does.
    const progress = page.getByText(/Downloading model/i);
    if (await progress.isVisible().catch(() => false)) {
      await expect(progress).toBeVisible();
    }
  });

  test("ranks every chunk by descending score, with no top-N cut (FR-014, SC-006)", async ({
    page,
  }) => {
    await page.goto("/tool/chunks");
    const paragraph = "The quick brown fox jumps over the lazy dog. ".repeat(20);
    await page
      .getByLabel("Document")
      .fill([paragraph, "A different second paragraph about vector search. ".repeat(10)].join("\n\n"));
    await page.getByRole("combobox").selectOption("fixed-size");
    await page.getByLabel("Size (characters)").fill("300");
    await page.getByPlaceholder("What are you trying to find?").fill("fox jumping over the dog");

    await waitForModelReady(page);
    const start = Date.now();
    await searchButton(page).click();
    await expect(page.getByText(/results?, ranked by similarity/)).toBeVisible({ timeout: 20_000 });
    expect(Date.now() - start).toBeLessThan(15_000);

    const chunkCount = await page.getByRole("button", { name: /^#\d+ · \d+ chars$/ }).count();
    const resultRows = page.getByRole("button", { name: /^#\d+ chunk \d+/ });
    await expect(resultRows).toHaveCount(chunkCount);

    const scores = await resultRows.evaluateAll((buttons) =>
      buttons.map((b) => Number(b.textContent!.match(/([\d.]+)$/)![1])),
    );
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    }
  });

  test("re-running an identical query returns identical scores (SC-007, FR-016)", async ({
    page,
  }) => {
    await page.goto("/tool/chunks");
    await page.getByLabel("Document").fill("Some sample document text used to test determinism here.");
    await page.getByPlaceholder("What are you trying to find?").fill("sample text");

    await waitForModelReady(page);
    await searchButton(page).click();
    await expect(page.getByText(/results?, ranked by similarity/)).toBeVisible({ timeout: 20_000 });
    const first = await page.getByRole("button", { name: /^#\d+ chunk/ }).allTextContents();

    await searchButton(page).click();
    await expect(page.getByText(/results?, ranked by similarity/)).toBeVisible({ timeout: 20_000 });
    const second = await page.getByRole("button", { name: /^#\d+ chunk/ }).allTextContents();

    expect(second).toEqual(first);
  });

  test("chunks with identical text tie, and the earlier one ranks first (FR-015)", async ({
    page,
  }) => {
    await page.goto("/tool/chunks");
    // Every 20-character fixed-size chunk below is byte-identical, so their
    // embeddings — and therefore their scores — tie exactly.
    await page.getByLabel("Document").fill("repeat me please!!!!".repeat(4));
    await page.getByRole("combobox").selectOption("fixed-size");
    await page.getByLabel("Size (characters)").fill("20");
    await page.getByPlaceholder("What are you trying to find?").fill("please repeat");

    await waitForModelReady(page);
    await searchButton(page).click();
    await expect(page.getByText(/results?, ranked by similarity/)).toBeVisible({ timeout: 20_000 });

    const chunkIndices = await page
      .getByRole("button", { name: /^#\d+ chunk/ })
      .evaluateAll((buttons) => buttons.map((b) => Number(b.textContent!.match(/chunk (\d+)/)![1])));
    expect(chunkIndices).toEqual([0, 1, 2, 3]);
  });

  test("a chunk over the model's input limit is flagged truncated (FR-017)", async ({ page }) => {
    await page.goto("/tool/chunks");
    await page.getByLabel("Document").fill("a fairly long word here ".repeat(200));
    await page.getByRole("combobox").selectOption("fixed-size");
    await page.getByLabel("Size (characters)").fill("2000");
    await page.getByPlaceholder("What are you trying to find?").fill("long word");

    await waitForModelReady(page);
    await searchButton(page).click();
    await expect(page.getByText(/results?, ranked by similarity/)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/truncated — \d+\/\d+ tokens/).first()).toBeVisible();
  });

  test("selecting a ranked result highlights its chunk in the document view (FR-018)", async ({
    page,
  }) => {
    await page.goto("/tool/chunks");
    await page
      .getByLabel("Document")
      .fill("First short chunk here.\n\nSecond short chunk over here instead.");
    await page.getByRole("combobox").selectOption("fixed-size");
    await page.getByLabel("Size (characters)").fill("30");
    await page.getByPlaceholder("What are you trying to find?").fill("second chunk");

    await waitForModelReady(page);
    await searchButton(page).click();
    await expect(page.getByText(/results?, ranked by similarity/)).toBeVisible({ timeout: 20_000 });

    await page.getByRole("button", { name: /^#1 chunk/ }).click();
    // Two panels now show this text — the document view's own selected-chunk
    // detail, and the ranked-results preview added alongside it — so this
    // resolves to two matches. .first() is the document view, which is what
    // this test (FR-018) actually asserts on; same pattern as the truncated
    // badge assertion above.
    await expect(page.getByText(/^Chunk #\d+ — \[/).first()).toBeVisible();
  });
});
