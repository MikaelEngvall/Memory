import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/ditt-repo-namn/", // Ersätt med namnet på ditt GitHub repository
});
