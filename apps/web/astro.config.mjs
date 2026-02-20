import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  output: 'static', // O 'server' si se decide usar SSR luego. Por ahora static es suficiente para el dashboard.
});
