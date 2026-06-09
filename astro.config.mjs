// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://ve7as.com',
  output: 'server',
  adapter: cloudflare({ imageService: 'passthrough' }),
  integrations: [sitemap()],
  redirects: {
    '/': '/ru/',
  },
});
