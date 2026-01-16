import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.js",
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    },
    include: ["src/test/**/*.test.{js,jsx}", "src/test/**/*.spec.{js,jsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
    },
  },
});
