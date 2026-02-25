import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import node from "@astrojs/node";

export default defineConfig({
  integrations: [react()],
  output: "server",
  adapter: node({ mode: "standalone" }),
  vite: {
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:8787",
          changeOrigin: true,
        },
      },
      watch: {
        ignored: ["**/apps/api/data/**"],
      },
    },
  },
});
