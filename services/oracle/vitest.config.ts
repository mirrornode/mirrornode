import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    reporters: ["default", "json"],
    outputFile: {
      // Machine-readable results for downstream reporting (e.g. Merlin).
      json: "./test-results/results.json",
    },
  },
});
