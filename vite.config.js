import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: "all",
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./vitest.setup.js",
  },
});
