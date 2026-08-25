// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://ve7as.com',
  output: 'server',
  adapter: cloudflare({ imageService: 'passthrough' }),
  redirects: {
    '/': '/en/',
  },
});
