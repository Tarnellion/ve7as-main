/**
 * Removes SESSION KV and IMAGES bindings from the generated dist/server/wrangler.json.
 * These bindings are auto-added by @astrojs/cloudflare but require Cloudflare account
 * resources we don't have set up (and don't need).
 */
import { readFileSync, writeFileSync } from 'fs';

const path = 'dist/server/wrangler.json';
const config = JSON.parse(readFileSync(path, 'utf8'));

config.kv_namespaces = [];
delete config.images;
if (config.previews) {
  config.previews.kv_namespaces = [];
  delete config.previews.images;
}

writeFileSync(path, JSON.stringify(config, null, 2));
console.log('Patched dist/server/wrangler.json: removed SESSION and IMAGES bindings');
