import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://masaspc.github.io',
  base: '/mobiles',
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
});
