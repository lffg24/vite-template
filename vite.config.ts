import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: { outDir: "dist" },
  server: { host: "0.0.0.0", fs: { strict: false } },
  test: {
    environment: "jsdom",
    exclude: ["node_modules/**", "dist/**", "e2e/**"],
    setupFiles: "./src/test/setup.ts",
    globals: true,
  },
});
