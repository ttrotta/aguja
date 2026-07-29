import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Two projects, not one, because "no DOM in domain/" (Constitution Principle
// III) has to be enforced by the test environment itself — ESLint catches
// the imports, this catches runtime reach-through (window, document, fetch)
// that only shows up when the code actually runs. See research.md R-007.
export default defineConfig({
  test: {
    // Setup passes with zero tests present. Real test files land starting
    // T007; once they exist this stops mattering.
    passWithNoTests: true,
    projects: [
      {
        test: {
          name: "domain",
          environment: "node",
          include: ["src/features/**/domain/**/*.test.ts"],
        },
      },
      {
        plugins: [react()],
        test: {
          name: "component",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          exclude: ["src/features/**/domain/**"],
        },
      },
      {
        // Catalogue parity is neither domain logic nor a component, but it is
        // the only thing enforcing FR-059 — typed keys cannot catch a key that
        // exists in one locale and not the other. Its own project keeps the
        // "domain" name meaning what Principle III says it means.
        test: {
          name: "messages",
          environment: "node",
          include: ["src/messages/**/*.test.ts"],
        },
      },
    ],
  },
});
