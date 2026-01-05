import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';

export default defineConfig({
  integrations: [react(), netlify()],
  // site: 'https://<your-netlify-site>.netlify.app', // opcional
});
