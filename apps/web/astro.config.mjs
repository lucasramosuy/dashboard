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
  // Publicado en lucasramos.uy/panel (Worker de Cloudflare, ver wrangler.jsonc)
  site: "https://lucasramos.uy",
  base: "/panel",
  output: "server",
  adapter: cloudflare({ imageService: "passthrough" }),
  // Tipografía del brand kit (Space Grotesk + DM Mono), autoalojada por Astro en el build.
  fonts: [
    {
      name: "Space Grotesk",
      cssVariable: "--font-space-grotesk",
      provider: fontProviders.fontsource(),
      weights: [400, 500, 600, 700],
      styles: ["normal"],
      subsets: ["latin", "latin-ext"],
    },
    {
      name: "DM Mono",
      cssVariable: "--font-dm-mono",
      provider: fontProviders.fontsource(),
      weights: [400, 500],
      styles: ["normal"],
      subsets: ["latin", "latin-ext"],
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
