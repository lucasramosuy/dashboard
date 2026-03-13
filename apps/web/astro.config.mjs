import { defineConfig, fontProviders } from "astro/config";
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
      proxy: {
        "/api": {
          target: "http://localhost:8787",
          changeOrigin: true,
          cookieDomainRewrite: {
            // Reescribe el dominio de las cookies de localhost:8787 → localhost (sin puerto)
            // para que el browser las acepte desde localhost:4321
            "localhost": "localhost",
            "*": "",
          },
        },
      },
      watch: {
        ignored: ["**/apps/api/data/**"],
      },
    },
  },
});
