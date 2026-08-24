/**
 * Санитайзер конфига, который @astrojs/cloudflare генерирует в
 * dist/server/wrangler.json. Запускается между `npm run build` и
 * `wrangler deploy` (см. .github/workflows/deploy.yml).
 *
 * Зачем: адаптер безусловно объявляет KV-биндинг SESSION (для Astro sessions),
 * но без `id` — такой биндинг нельзя задеплоить, воркер падает с Error 1101.
 * Сессии в проекте не используются (`grep -rn "Astro.session" src/` пусто),
 * поэтому placeholder-биндинг вырезаем.
 *
 * Принцип: вырезаем только биндинги без `id` (то есть заведомо нерабочие
 * заглушки), а про всё остальное, что требует ресурсов в аккаунте Cloudflare
 * (D1, R2, Durable Objects, очереди...), громко предупреждаем. Раньше это был
 * чёрный список из двух ключей: новый биндинг от адаптера проходил молча и
 * ронял деплой уже на стороне Cloudflare, где причина не видна.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Путь считаем от файла скрипта, а не от cwd: скрипт должен работать
// одинаково и из корня репозитория, и из любой другой директории.
const configUrl = new URL('../dist/server/wrangler.json', import.meta.url);
const configPath = fileURLToPath(configUrl);

/**
 * Биндинги, которым нужен заранее заведённый ресурс в аккаунте Cloudflare.
 * Значение — что именно придётся создать, чтобы деплой прошёл.
 */
const RESOURCE_BINDINGS = {
  kv_namespaces: 'KV namespace',
  r2_buckets: 'R2 bucket',
  d1_databases: 'D1 database',
  durable_objects: 'Durable Object namespace',
  queues: 'Queue',
  vectorize: 'Vectorize index',
  hyperdrive: 'Hyperdrive config',
  services: 'Service binding (другой воркер)',
  analytics_engine_datasets: 'Analytics Engine dataset',
  dispatch_namespaces: 'Dispatch namespace',
  mtls_certificates: 'mTLS certificate',
  pipelines: 'Pipeline',
  secrets_store_secrets: 'Secrets Store secret',
  send_email: 'Email routing binding',
  workflows: 'Workflow',
  browser: 'Browser Rendering binding',
  images: 'Images binding',
  ai: 'Workers AI binding',
};

function fail(message, hint) {
  console.error(`patch-wrangler: ${message}`);
  if (hint) console.error(`  ${hint}`);
  process.exit(1);
}

let raw;
try {
  raw = readFileSync(configPath, 'utf8');
} catch (error) {
  if (error.code === 'ENOENT') {
    fail(
      `не найден ${configPath}`,
      'Сначала соберись: `npm run build`. Скрипт правит артефакт сборки, не исходники.',
    );
  }
  fail(`не смог прочитать ${configPath}: ${error.message}`);
}

let config;
try {
  config = JSON.parse(raw);
} catch (error) {
  fail(
    `${configPath} — невалидный JSON: ${error.message}`,
    'Похоже, сборка оборвалась на полпути. Удали dist/ и пересоберись.',
  );
}

/**
 * Убирает из списка биндингов заглушки без `id` — задеплоить их нельзя.
 * Возвращает имена вырезанных биндингов.
 */
function stripPlaceholders(list) {
  if (!Array.isArray(list)) return { kept: list, removed: [] };
  const removed = [];
  const kept = list.filter((entry) => {
    const hasResource = typeof entry?.id === 'string' && entry.id.length > 0;
    if (!hasResource) removed.push(entry?.binding ?? '<без имени>');
    return hasResource;
  });
  return { kept, removed };
}

const removedBindings = [];

// 1. KV без id (это и есть SESSION от адаптера) — в основном конфиге и в previews.
for (const scope of [config, config.previews]) {
  if (!scope?.kv_namespaces) continue;
  const { kept, removed } = stripPlaceholders(scope.kv_namespaces);
  scope.kv_namespaces = kept;
  removedBindings.push(...removed.map((name) => `kv_namespaces:${name}`));
}

// 2. Легаси: раньше адаптер добавлял `images`. Сейчас не добавляет
//    (imageService: 'passthrough' в astro.config.mjs), но если вернётся —
//    ресурса под него нет, убираем.
for (const scope of [config, config.previews]) {
  if (scope?.images === undefined) continue;
  delete scope.images;
  removedBindings.push('images');
}

/**
 * Всё, что осталось непустым и требует ресурсов, — повод предупредить:
 * либо ресурс реально заведён (тогда всё в порядке), либо деплой упадёт.
 */
const suspicious = [];
for (const [key, label] of Object.entries(RESOURCE_BINDINGS)) {
  const value = config[key];
  if (value === undefined || value === null) continue;

  // Формы в конфиге разные: массив, {bindings: []}, {producers/consumers: []}.
  let entries = [];
  if (Array.isArray(value)) {
    entries = value;
  } else if (typeof value === 'object') {
    entries = Object.values(value)
      .filter(Array.isArray)
      .flat();
  }
  if (entries.length === 0) continue;

  const names = entries.map((e) => e?.binding ?? e?.name ?? '<без имени>');
  suspicious.push(`  - ${key} (${label}): ${names.join(', ')}`);
}

writeFileSync(configPath, JSON.stringify(config, null, 2));

if (removedBindings.length > 0) {
  console.log(`patch-wrangler: вырезаны биндинги-заглушки без id: ${removedBindings.join(', ')}`);
} else {
  console.log('patch-wrangler: биндингов-заглушек не найдено, конфиг оставлен как есть');
}

if (suspicious.length > 0) {
  console.warn(
    '\npatch-wrangler: ВНИМАНИЕ — в конфиге остались биндинги, которым нужен ресурс в аккаунте Cloudflare:',
  );
  console.warn(suspicious.join('\n'));
  console.warn(
    '\nЕсли ресурс не заведён, деплой упадёт на стороне Cloudflare (обычно Error 1101,\n' +
      'причина в ответе не видна). Либо создай ресурс и пропиши id в wrangler.toml,\n' +
      'либо разберись, кто добавил биндинг, и убери его на уровне astro.config.mjs.\n',
  );
}
