#!/usr/bin/env node
/**
 * Сбор корпуса кандидатов за последние N суток. Ничего не публикует.
 *
 * Здесь же работают первые две ступени каскада дедупа — самые дешёвые.
 * Порядок не случаен: к моменту, когда до кандидата дойдёт эмбеддинг (а тем
 * более LLM), больше половины потока уже отсеяно бесплатно.
 *
 *   Ступень 0 — точные хеши: канонизированный URL и нормализованный текст.
 *   Ступень 1 — SimHash-64 по словесным триграммам, дубль при Хэмминге <= 3.
 *
 * Ступень 1 ловит перестановку абзацев, разные врезки вокруг одного тела и
 * лёгкий рерайт. Пересказ другими словами она НЕ ловит — это работа ступени 2.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const PIPE = join(ROOT, '.pipeline');

const DAYS = Number(process.env.HARVEST_DAYS ?? 7);
const TIMEOUT_MS = 20_000;
/**
 * Порог SimHash. ИЗМЕРЕНО на реальном корпусе 26.08.2026, и результат
 * противоречит исходному плану: на кросс-издательском потоке эта ступень
 * почти не работает.
 *
 * Распределение расстояний по 20 503 парам — единое облако с пиком 28-35 и
 * минимумом 14, причём пара на 14 это две совершенно разные новости.
 * Отдельного кластера дублей нет. Любой порог, ловящий настоящую пару-дубль
 * (канадский регулятор, d=18), нахватает несвязанных.
 *
 * Синтетическая проверка объясняет почему: порог 3 ловит только побайтово
 * одинаковый текст. Перестановка абзацев даёт 8, добавленная врезка «18+» — 7,
 * лёгкий рерайт — 11.
 *
 * Поэтому ступень оставлена ровно для того, что она умеет: синдикация, когда
 * один и тот же текст перепечатан дословно. Смысловой дедуп целиком лежит на
 * ступени 2 (эмбеддинги), где порог 0.90 подтверждён на тех же данных.
 */
const SIMHASH_MAXD = 3;
const UA = 'Ve7asNewsBot/0.1 (+https://ve7as.com/en/about/; corpus harvest)';

const { sources } = JSON.parse(readFileSync(join(HERE, 'sources.json'), 'utf8'));

/** Ленты, признанные пробой негодными, не опрашиваем повторно. */
let skip = new Set();
if (existsSync(join(PIPE, 'probe.json'))) {
  const probe = JSON.parse(readFileSync(join(PIPE, 'probe.json'), 'utf8'));
  skip = new Set(probe.results.filter((r) => r.verdict !== 'live').map((r) => r.id));
  if (skip.size) console.log(`  пропускаю по результатам пробы: ${[...skip].join(', ')}\n`);
}

const sha = (s) => createHash('sha256').update(s).digest('hex');
const unwrap = (s) => (s ?? '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
const strip = (s) => unwrap(s).replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;|&#\d+;/gi, ' ').replace(/\s+/g, ' ').trim();

/**
 * Канонизация URL. Метки кампаний обязаны отлетать: один и тот же материал,
 * пришедший из двух лент с разными utm_source, иначе даст два кандидата и
 * пройдёт дальше как «две независимые публикации».
 */
const TRACKING = /^(utm_|fbclid|gclid|yclid|msclkid|mc_|ref|source$)/i;
function canonicalUrl(raw) {
  try {
    const u = new URL(raw.trim());
    u.hash = '';
    const keep = [...u.searchParams.entries()].filter(([k]) => !TRACKING.test(k)).sort(([a], [b]) => a.localeCompare(b));
    u.search = keep.length ? '?' + keep.map(([k, v]) => `${k}=${v}`).join('&') : '';
    if (u.pathname.length > 1) u.pathname = u.pathname.replace(/\/+$/, '');
    return u.toString();
  } catch { return raw.trim(); }
}

/** Нормализация текста для точного хеша: регистр, пунктуация, пробелы. */
const normalize = (s) => s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();

/** SimHash-64 по словесным триграммам. */
function simhash(text) {
  const words = normalize(text).split(' ').filter(Boolean);
  if (words.length < 3) return 0n;
  const v = new Array(64).fill(0);
  for (let i = 0; i + 2 < words.length; i++) {
    const h = BigInt('0x' + createHash('md5').update(words.slice(i, i + 3).join(' ')).digest('hex').slice(0, 16));
    for (let b = 0; b < 64; b++) v[b] += (h >> BigInt(b)) & 1n ? 1 : -1;
  }
  let out = 0n;
  for (let b = 0; b < 64; b++) if (v[b] > 0) out |= 1n << BigInt(b);
  return out;
}
const hamming = (a, b) => { let x = a ^ b, n = 0; while (x) { n += Number(x & 1n); x >>= 1n; } return n; };

/** Лид: первые 2-3 предложения. Эмбеддится именно он вместе с заголовком —
 *  тело целиком тянет за собой бойлерплейт «18+» и «играйте ответственно»,
 *  который поднимает косинус любой пары внутри раздела. */
function lead(text, max = 500) {
  const parts = text.split(/(?<=[.!?])\s+/);
  let out = '';
  for (const p of parts) { if ((out + ' ' + p).trim().length > max) break; out = (out + ' ' + p).trim(); if (out.length > max * 0.6) break; }
  return out || text.slice(0, max);
}

const field = (xml, tag) => {
  const m = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? m[1] : '';
};

async function harvest(src) {
  try {
    const res = await fetch(src.url, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return { id: src.id, items: [], error: `HTTP ${res.status}` };
    const xml = await res.text();
    const blocks = [...xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi), ...xml.matchAll(/<entry[\s>][\s\S]*?<\/entry>/gi)].map((m) => m[0]);

    const cutoff = Date.now() - DAYS * 86_400_000;
    const items = [];
    for (const b of blocks) {
      const link = strip(field(b, 'link')) || (b.match(/<link[^>]*href="([^"]+)"/i)?.[1] ?? '');
      const title = strip(field(b, 'title'));
      if (!link || !title) continue;
      const dateRaw = strip(field(b, 'pubDate')) || strip(field(b, 'published')) || strip(field(b, 'updated'));
      const date = dateRaw ? new Date(dateRaw) : null;
      if (date && !Number.isNaN(date.getTime()) && date.getTime() < cutoff) continue;

      const body = strip(field(b, 'content:encoded')) || strip(field(b, 'description')) || strip(field(b, 'summary'));
      const cu = canonicalUrl(link);
      items.push({
        source: src.id, group: src.independenceGroup, sourceType: src.sourceType,
        soleSourceAllowed: src.soleSourceAllowed, lang: src.lang,
        title, lead: lead(body), bodyLen: body.length,
        pubDate: date && !Number.isNaN(date.getTime()) ? date.toISOString() : null,
        canonicalUrl: cu, urlHash: sha(cu),
        contentHash: sha(normalize(`${title} ${body}`)),
        simhash: simhash(`${title} ${body}`).toString(16).padStart(16, '0'),
      });
    }
    return { id: src.id, items };
  } catch (e) { return { id: src.id, items: [], error: String(e?.message ?? e).slice(0, 100) }; }
}

console.log(`Сбор корпуса за ${DAYS} суток\n`);
const raw = [];
for (const src of sources) {
  if (skip.has(src.id)) continue;
  const r = await harvest(src);
  console.log(`  ${String(r.items.length).padStart(3)} зап.  ${r.id}${r.error ? '  ← ' + r.error : ''}`);
  raw.push(...r.items);
}

// ── Ступень 0: точные хеши ────────────────────────────────────────────────
const byUrl = new Map(), afterUrl = [];
for (const it of raw) if (!byUrl.has(it.urlHash)) { byUrl.set(it.urlHash, true); afterUrl.push(it); }
const byContent = new Map(), stage0 = [];
for (const it of afterUrl) if (!byContent.has(it.contentHash)) { byContent.set(it.contentHash, true); stage0.push(it); }

// ── Ступень 1: SimHash ────────────────────────────────────────────────────
const stage1 = [];
for (const it of stage0) {
  const h = BigInt('0x' + it.simhash);
  const dup = stage1.find((k) => hamming(BigInt('0x' + k.simhash), h) <= SIMHASH_MAXD);
  if (dup) { it.dupOf = dup.canonicalUrl; continue; }
  stage1.push(it);
}

const pct = (n, d) => d ? `${((1 - n / d) * 100).toFixed(0)}%` : '—';
console.log(`\n  сырых кандидатов:            ${raw.length}`);
console.log(`  после ступени 0 (хеши):      ${stage0.length}   отсеяно ${pct(stage0.length, raw.length)}`);
console.log(`  после ступени 1 (SimHash):   ${stage1.length}   отсеяно ещё ${raw.length ? ((stage0.length - stage1.length) / raw.length * 100).toFixed(0) : 0}%`);
console.log(`  итого бесплатный отсев:      ${pct(stage1.length, raw.length)}`);
console.log(`  живых групп в корпусе:       ${new Set(stage1.map((i) => i.group)).size}`);

mkdirSync(PIPE, { recursive: true });
writeFileSync(join(PIPE, 'candidates.json'), JSON.stringify({ at: new Date().toISOString(), days: DAYS, raw: raw.length, stage0: stage0.length, candidates: stage1 }, null, 2));
console.log(`\n  корпус: .pipeline/candidates.json`);
