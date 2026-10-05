import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/playwright",
  testMatch: "**/*.spec.js",
  fullyParallel: true,
  workers: 2,
  timeout: 30_000,
  retries: 0,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["json", { outputFile: "test-results/playwright.json" }],
  ],
  // APIRequestContext only: no browser downloads and no .env/production connections.
  use: { trace: "retain-on-failure" },
});
