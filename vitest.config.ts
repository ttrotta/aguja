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
    ],
  },
});
