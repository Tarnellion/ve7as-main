#!/usr/bin/env node
/**
 * Чтение Google Search Console: Search Analytics и URL Inspection.
 *
 * Зачем скрипт, а не готовый MCP-сервер или плагин: данные GSC нужны не
 * разово в чате, а в репозитории рядом с `baseline-*.csv`, чтобы недельный
 * ритм фазы 5 сравнивался с прошлым срезом, а не с памятью. Плюс сторонние
 * обёртки над GSC требуют отдать им доступ к ресурсу — здесь ключ остаётся
 * на машине владельца.
 *
 * Зависимостей нет намеренно, как в `verify-lottery-data.mjs`: подпись
 * сервис-аккаунта — это RS256 над двумя base64url-строками, ради чего тянуть
 * `googleapis` (сотни пакетов) в проект, где больше ничего от Google нет,
 * незачем.
 *
 * Ключ сервис-аккаунта НЕ лежит в репозитории: репозиторий публичный, а JSON
 * сервис-аккаунта — это приватный ключ. Путь берётся из GSC_SA_KEY, по
 * умолчанию ~/.config/ve7as/gsc-sa.json.
 *
 * usage:
 *   node scripts/seo/gsc.mjs snapshot [--days 28]    срез в docs/seo/gsc/*.csv
 *   node scripts/seo/gsc.mjs queries [--days 28]     запросы в stdout
 *   node scripts/seo/gsc.mjs pages   [--days 28]     страницы в stdout
 *   node scripts/seo/gsc.mjs dates   [--days 28]     динамика по дням
 *   node scripts/seo/gsc.mjs inspect <url>           статус индексации URL
 */
import { createSign } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Ресурс типа «домен», а не префикс URL: именно так он заведён в GSC. */
const SITE_URL = 'sc-domain:ve7as.com';
const KEY_PATH = process.env.GSC_SA_KEY || join(homedir(), '.config', 've7as', 'gsc-sa.json');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * `webmasters.readonly` покрывает и Search Analytics, и URL Inspection.
 * Права на запись (отправка sitemap, запрос индексации) не берём: скрипт
 * читает, а всё, что меняет состояние ресурса, остаётся ручным действием.
 */
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

const b64url = (buf) => Buffer.from(buf).toString('base64url');

/**
 * Обмен подписанного JWT на access-токен. Google выдаёт его на час, скрипт
 * живёт секунды — кэшировать нечего.
 */
async function accessToken() {
  let key;
  try {
    key = JSON.parse(readFileSync(KEY_PATH, 'utf8'));
  } catch (e) {
    fail(
      `Ключ сервис-аккаунта не прочитан: ${KEY_PATH}\n` +
        `  ${e.code === 'ENOENT' ? 'файла нет' : e.message}\n` +
        `  Положите JSON вне репозитория и укажите путь в GSC_SA_KEY.`,
    );
  }
  if (!key.client_email || !key.private_key) fail(`${KEY_PATH}: это не ключ сервис-аккаунта (нет client_email/private_key)`);

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: key.client_email,
    scope: SCOPE,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(claim));
  const sig = createSign('RSA-SHA256').update(`${head}.${body}`).end().sign(key.private_key);
  const jwt = `${head}.${body}.${b64url(sig)}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const json = await res.json();
  if (!res.ok) fail(`Google не выдал токен (${res.status}): ${json.error_description ?? JSON.stringify(json)}`);
  return json.access_token;
}

async function api(token, url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (res.status === 403) {
    fail(
      `403 от Search Console. Чаще всего это значит, что сервис-аккаунт не добавлен\n` +
        `  в ресурс: Settings → Users and permissions → Add user → e-mail сервис-аккаунта.\n` +
        `  Ответ: ${JSON.stringify(json.error?.message ?? json)}`,
    );
  }
  if (!res.ok) fail(`${url} → ${res.status}: ${JSON.stringify(json.error?.message ?? json)}`);
  return json;
}

/**
 * Search Analytics. `dataState: 'all'` включает ещё не финализированные
 * последние дни: для недельного обзора свежесть важнее стабильности цифры,
 * а расхождение финализации на молодом домене исчисляется единицами показов.
 */
async function searchAnalytics(token, { dimensions, days, rowLimit = 1000 }) {
  const end = new Date(Date.now() - 2 * 864e5); // GSC отстаёт на ~2 суток
  const start = new Date(end - (days - 1) * 864e5);
  const iso = (d) => d.toISOString().slice(0, 10);
  const { rows = [] } = await api(
    token,
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`,
    { startDate: iso(start), endDate: iso(end), dimensions, rowLimit, dataState: 'all' },
  );
  return { rows, startDate: iso(start), endDate: iso(end) };
}

/**
 * URL Inspection. Отвечает на вопрос, который не виден в Search Analytics:
 * страница вообще просканирована или Google только знает о её существовании.
 * Квота — 2000 запросов в сутки на ресурс, поэтому вызывается точечно.
 */
async function inspect(token, pageUrl) {
  const { inspectionResult } = await api(token, 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
    inspectionUrl: pageUrl,
    siteUrl: SITE_URL,
    languageCode: 'ru',
  });
  const r = inspectionResult?.indexStatusResult ?? {};
  return {
    url: pageUrl,
    verdict: r.verdict ?? '—',
    coverage: r.coverageState ?? '—',
    lastCrawl: r.lastCrawlTime ?? 'не сканировалась',
    canonicalGoogle: r.googleCanonical ?? '—',
    canonicalUser: r.userCanonical ?? '—',
    robots: r.robotsTxtState ?? '—',
    indexing: r.indexingState ?? '—',
    sitemaps: (r.sitemap ?? []).join(' ') || '—',
  };
}

const csvCell = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replaceAll('"', '""')}"` : String(v));
const toCsv = (header, rows) => [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n') + '\n';

function table(rows, label) {
  if (rows.length === 0) return `${label}: пусто`;
  const lines = rows.map(
    (r) =>
      `  ${String(r.keys[0]).padEnd(52).slice(0, 52)}  ` +
      `${String(r.clicks).padStart(5)} кл  ${String(r.impressions).padStart(6)} пок  ` +
      `CTR ${(r.ctr * 100).toFixed(1).padStart(5)}%  поз ${r.position.toFixed(1).padStart(5)}`,
  );
  return `${label}:\n${lines.join('\n')}`;
}

function fail(msg) {
  console.error(`[gsc] ${msg}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const cmd = args[0] ?? 'snapshot';
const days = Number(args[args.indexOf('--days') + 1]) || 28;

// Аргументы разбираются до обращения к ключу: опечатка в команде не должна
// выглядеть как проблема с доступом.
if (!['snapshot', 'queries', 'pages', 'dates', 'inspect'].includes(cmd)) {
  fail(`неизвестная команда «${cmd}». Доступны: snapshot, queries, pages, dates, inspect`);
}
if (cmd === 'inspect' && !args[1]?.startsWith('http')) {
  fail('usage: gsc.mjs inspect https://ve7as.com/en/tools/');
}

const token = await accessToken();

if (cmd === 'inspect') {
  const url = args[1];
  const r = await inspect(token, url);
  for (const [k, v] of Object.entries(r)) console.log(`${k.padEnd(16)} ${v}`);
} else if (cmd === 'queries' || cmd === 'pages' || cmd === 'dates') {
  const dim = { queries: 'query', pages: 'page', dates: 'date' }[cmd];
  const { rows, startDate, endDate } = await searchAnalytics(token, { dimensions: [dim], days });
  console.log(`${startDate} … ${endDate}, строк: ${rows.length}`);
  console.log(table(rows, cmd));
} else if (cmd === 'snapshot') {
  const outDir = join(ROOT, 'docs', 'seo', 'gsc');
  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  for (const [name, dim] of [
    ['queries', 'query'],
    ['pages', 'page'],
    ['dates', 'date'],
  ]) {
    const { rows, startDate, endDate } = await searchAnalytics(token, { dimensions: [dim], days });
    const file = join(outDir, `${name}-${stamp}.csv`);
    writeFileSync(
      file,
      toCsv(
        [dim, 'clicks', 'impressions', 'ctr', 'position'],
        rows.map((r) => [r.keys[0], r.clicks, r.impressions, r.ctr.toFixed(4), r.position.toFixed(1)]),
      ),
    );
    console.log(`[gsc] ${name}: ${rows.length} строк за ${startDate}…${endDate} → ${file}`);
  }
}
