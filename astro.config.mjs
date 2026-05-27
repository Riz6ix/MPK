// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  output: 'server', // Explicit SSR/Edge mode — required for Netlify adapter
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [react()],
  adapter: netlify()
});