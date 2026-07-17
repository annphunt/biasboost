import { defineConfig } from "vitest/config";

// JS/TS unit tests live in tests/ and run with `npm run test:web`.
// (Backend Python tests still run via `npm test` → pytest.)
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
