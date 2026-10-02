import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
    // Integration test cần MongoDB thật được đặt trong tests/integration và tự skip khi thiếu MONGODB_URI_TEST.
    env: { NODE_ENV: "test" },
    restoreMocks: true,
  },
});
