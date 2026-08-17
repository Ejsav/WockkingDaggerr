import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
    globals: false,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      // `server-only` is a Next build-time guard with no runtime behaviour.
      // Stubbing it lets the same modules the server uses be unit-tested.
      "server-only": fileURLToPath(new URL("./tests/stubs/server-only.ts", import.meta.url)),
    },
  },
});
