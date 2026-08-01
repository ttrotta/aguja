import { test, expect } from "@playwright/test";
import en from "../src/messages/en.json";
import es from "../src/messages/es.json";
import { routes } from "./routes";

/**
 * The hero headline (US1 — P1).
 *
 * Asserted end-to-end rather than as a component test because FR-077 is about
 * the reader getting their own language at their own address, which depends on
 * locale routing — something a component rendered in isolation cannot prove.
 */
test.describe("landing hero headline (US1 — P1)", () => {
  test("the largest text names the product category, not the brand (FR-076)", async ({ page }) => {
    await page.goto(routes.landing());

    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toHaveText(en.landing.heroTitle);

    // The specific regression this guards: the hero used to be the wordmark,
    // which told a first-time visitor nothing about what the tool does.
    await expect(heading).not.toHaveText("Aguja");
  });

  test("the product name is still present, carried by the navbar (FR-080)", async ({ page }) => {
    await page.goto(routes.landing());

    // Removing the wordmark from the hero must remove a repetition, not the
    // identity. The navbar logo is what makes that true.
    await expect(page.getByRole("banner").getByRole("link", { name: /aguja/i })).toBeVisible();
  });

  test("each locale gets its own heading, with no fallback (FR-077)", async ({ page }) => {
    await page.goto(routes.landing("es"));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(es.landing.heroTitle);

    await page.goto(routes.landing("en"));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(en.landing.heroTitle);
  });

  test("the heading comes from the catalogue, not a hardcoded literal (FR-077)", async ({
    page,
  }) => {
    // Reverting to a literal would make both locales render the same string.
    // This only proves anything while the two catalogue values differ, so
    // guard that assumption rather than let the test quietly become a no-op.
    test.skip(
      en.landing.heroTitle === es.landing.heroTitle,
      "en and es heroTitle are identical, so this test cannot distinguish catalogue from literal",
    );

    await page.goto(routes.landing("es"));
    await expect(page.getByRole("heading", { level: 1 })).not.toHaveText(en.landing.heroTitle);
  });

  test("the supporting line adds information rather than restating it (FR-078)", async ({
    page,
  }) => {
    // Both catalogues, not just the default one. The subhead used to open with
    // "A debugger for retrieval" / "Un debugger para retrieval", which the
    // heading now says on its own in each language.
    for (const [locale, catalogue] of [
      ["en", en],
      ["es", es],
    ] as const) {
      expect(
        catalogue.landing.heroBody.toLowerCase(),
        `${locale} heroBody restates heroTitle`,
      ).not.toContain(catalogue.landing.heroTitle.toLowerCase());

      await page.goto(routes.landing(locale));
      await expect(page.getByText(catalogue.landing.heroBody)).toBeVisible();
    }
  });

  test("the longer heading stays inside the viewport at 360px (FR-079)", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto(routes.landing());

    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();

    // Scoped to the heading on purpose. The page as a whole *did* overflow at
    // this width when the hero's right-hand component was the Tool Dial's
    // fixed `w-[520px] shrink-0`; the dial was since replaced by a fluid,
    // width-capped tool-panel replica (ToolPanelPreview, D-029), but this test
    // guards the heading — which is what FR-079 is about — so whole-page
    // overflow is still deliberately out of scope here.
    const box = await heading.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(360);
  });
});
