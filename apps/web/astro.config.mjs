import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import node from "@astrojs/node";
import sentry from "@sentry/astro";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  integrations: [
    react(),
    sentry({
      sourceMapsUploadOptions: {
        project: "javascript-astro",
        org: "lucass-space",
        authToken: process.env.SENTRY_AUTH_TOKEN,
      },
    }),
  ],
  output: "server",
  adapter: node({ mode: "standalone" }),
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ["recharts"],
    },
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
