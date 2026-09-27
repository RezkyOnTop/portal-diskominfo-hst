import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "e2e"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["lib/**", "app/api/**"],
      exclude: [
        "lib/db.ts",
        "lib/auth.ts",
        "app/api/auth/**",
        "**/*.d.ts",
        "**/*.test.*",
      ],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
  resolve: {
    alias: {
      "@": root,
      // Vitest tidak bisa me-resolve paket server-only; arahkan ke stub.
      "server-only": fileURLToPath(new URL("./test/server-only.stub.ts", import.meta.url)),
    },
  },
});
