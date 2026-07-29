import { test, expect } from "@playwright/test";
import { routes } from "./routes";

const THREE_PARAGRAPH_DOC =
  "First paragraph here, with a decent number of words in it to pad things out nicely.\n\n" +
  "Second paragraph follows right after a blank line, again with several words for padding.\n\n" +
  "Third and final paragraph closes things off, once more padded with extra words for length.";

test.describe("chunk visualization (US1 — P1)", () => {
  test("pasting a document shows chunk boundaries, each labeled with index and length (SC-001)", async ({
    page,
  }) => {
    await page.goto(routes.chunks());
    await page.getByLabel("Document").fill("x".repeat(3000));
    await page.getByRole("combobox").selectOption("fixed-size");
    await page.getByLabel("Size (characters)").fill("500");

    await expect(page.getByText("6 chunks")).toBeVisible();
    const chunkButtons = page.getByRole("button", { name: /^#\d+ · \d+ chars$/ });
    await expect(chunkButtons).toHaveCount(6);
    await expect(chunkButtons.first()).toHaveText("#0 · 500 chars");
  });

  test("changing a parameter redraws without re-pasting (SC-002)", async ({ page }) => {
    await page.goto(routes.chunks());
    await page.getByLabel("Document").fill("x".repeat(3000));
    await page.getByRole("combobox").selectOption("fixed-size");

    await page.getByLabel("Size (characters)").fill("500");
    await expect(page.getByText("6 chunks")).toBeVisible();

    await page.getByLabel("Size (characters)").fill("1000");
    await expect(page.getByText("3 chunks")).toBeVisible();
  });

  test("redraws a maximum-size document well within budget (SC-002)", async ({ page }) => {
    await page.goto(routes.chunks());
    await page.getByLabel("Document").fill("x".repeat(50_000));
    await page.getByRole("combobox").selectOption("fixed-size");
    await page.getByLabel("Size (characters)").fill("500");
    await expect(page.getByText("100 chunks")).toBeVisible();

    const start = Date.now();
    await page.getByLabel("Size (characters)").fill("1000");
    await expect(page.getByText("50 chunks")).toBeVisible();
    // SC-002's 100ms budget is for the redraw itself; this end-to-end
    // assertion also pays for Playwright's own round trip, so it checks a
    // generous outer bound rather than the 100ms figure directly.
    expect(Date.now() - start).toBeLessThan(1000);
  });

  test("all four strategies are offered, and the three model-free ones work with no model loaded (SC-003)", async ({
    page,
  }) => {
    await page.goto(routes.chunks());
    await page.getByLabel("Document").fill(THREE_PARAGRAPH_DOC);

    const select = page.getByRole("combobox");
    await expect(select.locator("option")).toHaveCount(4);

    await select.selectOption("paragraphs");
    await expect(page.getByText("3 chunks")).toBeVisible();

    await select.selectOption("fixed-size");
    await expect(page.getByText(/^\d+ chunks?$/)).toBeVisible();

    await select.selectOption("fixed-size-overlap");
    await expect(page.getByText(/^\d+ chunks?$/)).toBeVisible();
  });

  test("a document with no blank lines under paragraph chunking yields one chunk, explained (SC-010)", async ({
    page,
  }) => {
    await page.goto(routes.chunks());
    await page
      .getByLabel("Document")
      .fill("Just one long paragraph with no breaks at all, only sentences here.");
    await page.getByRole("combobox").selectOption("paragraphs");

    await expect(page.getByText("1 chunk")).toBeVisible();
    await expect(page.getByText(/no blank lines/i)).toBeVisible();
  });
});
