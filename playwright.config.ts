import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // Several specs do a real ~23 MB model download and WASM session init per
  // test (retrieval.spec.ts, no-network-leak.spec.ts) — Playwright's default
  // worker count oversubscribes CPU/bandwidth badly on that kind of load,
  // which was observed to blow SC-006's 15s post-ready budget under
  // contention alone, not as an app regression (T054).
  workers: 4,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
