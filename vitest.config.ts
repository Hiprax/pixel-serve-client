import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      exclude: ["src/assets/**", "src/types/**", "**/*.d.ts"],
      thresholds: {
        lines: 95,
        functions: 95,
        // Raised from 85 to 90 after the Task 14 test additions; the actual
        // branch coverage now sits above 93% with room for new edge-case
        // tests to push the bar higher without immediately tripping CI.
        branches: 90,
        statements: 95,
      },
    },
    include: ["src/**/*.test.ts?(x)"],
  },
});
