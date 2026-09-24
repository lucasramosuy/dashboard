import { defineConfig, fontProviders } from "astro/config";
import react from "@astrojs/react";
import cloudflare from "@astrojs/cloudflare";
import sentry from "@sentry/astro";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  integrations: [
    react(),
    sentry({
      // En el server (Worker) Sentry lo inicializa @sentry/cloudflare en src/worker.ts.
      enabled: { client: true, server: false },
      sourceMapsUploadOptions: {
        project: "javascript-astro",
        org: "lucass-space",
        authToken: process.env.SENTRY_AUTH_TOKEN,
      },
    }),
  ],
  // Publicado en lucasramos.uy/dashboard (Worker de Cloudflare, ver wrangler.jsonc)
  site: "https://lucasramos.uy",
  base: "/dashboard",
  output: "server",
  adapter: cloudflare({ imageService: "passthrough" }),
  fonts: [
    {
      name: "Inter",
      cssVariable: "--font-inter",
      provider: fontProviders.fontsource(),
    },
    {
      name: "JetBrains Mono",
      cssVariable: "--font-jetbrains-mono",
      provider: fontProviders.fontsource(),
    },
  ],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ["recharts"],
    },
    server: {
      watch: {
        ignored: ["**/apps/api/data/**"],
      },
    },
  },
});
