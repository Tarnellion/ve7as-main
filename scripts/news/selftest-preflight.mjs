#!/usr/bin/env node
/**
 * Проверка предполётной проверки на моке Sanity и Anthropic. Главное, что здесь
 * доказывается: недействительный токен или опечатка в режиме останавливают прогон
 * ДО платной генерации, а мелкий сбой сети проверку не роняет.
 *
 *   node scripts/news/selftest-preflight.mjs
 */
import http from 'node:http';
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
let failed = 0;
const ok = (cond, label, detail = '') => { console.log(`  ${cond ? '✓' : '✗'} ${label}${!cond && detail ? ` — ${detail}` : ''}`); if (!cond) failed++; };

let sanityStatus = 200, anthropicStatus = 200;
const server = http.createServer((req, res) => {
  res.setHeader('content-type', 'application/json');
  if (req.url.includes('/users/me')) { res.statusCode = sanityStatus; return res.end(JSON.stringify({ id: 'u1', error: sanityStatus === 200 ? undefined : { description: 'denied' } })); }
  if (req.url.startsWith('/v1/models')) {
    res.statusCode = anthropicStatus;
    return res.end(JSON.stringify(anthropicStatus === 200 ? { data: [], has_more: false, first_id: null, last_id: null } : { type: 'error', error: { type: 'authentication_error', message: 'invalid' } }));
  }
  res.statusCode = 404; res.end('{}');
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const host = `http://127.0.0.1:${server.address().port}`;

const run = (env = {}) => new Promise((resolve) => {
  const child = spawn('node', [join(HERE, 'preflight.mjs')], {
    env: { PATH: process.env.PATH, SANITY_PROJECT_ID: 'proj', SANITY_DATASET: 'ds', SANITY_WRITE_TOKEN: 'sanity-secret-token',
      SANITY_API_HOST: host, ANTHROPIC_API_KEY: 'anthropic-secret-key', ANTHROPIC_BASE_URL: host, ...env },
  });
  let out = '';
  child.stdout.on('data', (c) => (out += c)); child.stderr.on('data', (c) => (out += c));
  child.on('close', (code) => resolve({ code, out }));
});

console.log('\nВсё в порядке');
sanityStatus = 200; anthropicStatus = 200;
const good = await run();
ok(good.code === 0 && /Готово к запуску/.test(good.out), 'код 0 и «готово к запуску»', good.out.slice(-250));
ok(!/sanity-secret-token|anthropic-secret-key/.test(good.out), 'значения секретов не печатаются');

console.log('\nОстанов ДО платных вызовов');
ok((await run({ NEWS_PUBLISH_MODE: 'yolo' })).code === 1, 'неизвестный режим: код 1');
const noTok = await run({ SANITY_WRITE_TOKEN: '' });
ok(noTok.code === 1 && /SANITY_WRITE_TOKEN/.test(noTok.out), 'нет токена Sanity: код 1 с названием причины');
const noProj = await run({ SANITY_PROJECT_ID: '' });
ok(noProj.code === 1, 'нет идентификатора проекта: код 1');
sanityStatus = 401;
ok((await run()).code === 1, 'Sanity ответил 401: код 1 (токен недействителен)');
sanityStatus = 200; anthropicStatus = 401;
ok((await run()).code === 1, 'Anthropic ответил 401: код 1 (ключ неверен)');
anthropicStatus = 403;
ok((await run()).code === 1, 'Anthropic ответил 403: код 1');

console.log('\nСбой сервиса не равен отказу в доступе');
sanityStatus = 500; anthropicStatus = 200;
const flaky = await run();
ok(flaky.code === 0 && /проверить токен Sanity не удалось/.test(flaky.out), 'Sanity ответил 500: предупреждение, а не остановка', flaky.out.slice(-250));
sanityStatus = 200;

console.log('\nОпечатки в числах не ослабляют защиту');
const typo = await run({ NEWS_RUN_BUDGET: '2,5', NEWS_AUTO_MIN_GROUPS: '2' });
ok(typo.code === 0 && /NEWS_RUN_BUDGET="2,5" недопустимо/.test(typo.out) && /NEWS_AUTO_MIN_GROUPS="2" недопустимо/.test(typo.out),
  'обе опечатки названы в логе, прогон продолжается на значениях по умолчанию', typo.out.slice(0, 400));
ok(/голосов для auto \(не ниже 3\): 3/.test(typo.out) && /потолок трат прогона, \$: 4/.test(typo.out), 'эффективные значения — безопасные (3 и $4)');

server.close();
console.log(failed ? `\nПРОВАЛЕНО: ${failed}\n` : '\nВсе проверки пройдены.\n');
process.exit(failed ? 1 : 0);
