import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
    // Real database tests require explicit opt-in and an isolated URI in tests/database.
    env: { NODE_ENV: "test" },
    restoreMocks: true,
  },
});
