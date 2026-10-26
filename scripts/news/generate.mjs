#!/usr/bin/env node
/**
 * Ступень 3: подтверждённое событие → черновик материала на en и es.
 *
 *   node scripts/news/generate.mjs              # сухой прогон, НИЧЕГО не тратит
 *   node scripts/news/generate.mjs --live       # реальные вызовы API
 *   node scripts/news/generate.mjs --limit 1 --live
 *
 * Сухой прогон по умолчанию — не осторожность, а защита кошелька: случайный
 * запуск не должен стоить денег, а увидеть, что именно уйдёт в API и почём,
 * нужно до отправки, а не после. Сухой прогон складывает готовые запросы
 * в .pipeline/batch-preview/ и печатает смету.
 *
 * Работа идёт ПОФАЗНО, а не по событию целиком: сначала факты для всех
 * событий одним батчем, потом черновики для всех, и так далее. Внутри
 * события шаги строго последовательны (черновику нужны факты), а между
 * событиями независимы — батч экономит 50 % и не упирается в задержку.
 *
 * Бот пишет только черновики. Публикует человек — это решение владельца,
 * и ступень 3 не содержит кода публикации вообще.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { headers, sleep, POLITE_MS } from './http.mjs';
import {
  systemPrompt, extractFactsPrompt, draftPrompt, critiquePrompt,
  revisePrompt, translatePrompt, metaPrompt, FACTS_SCHEMA, META_SCHEMA,
} from './prompts.mjs';
import { postcheck, issuesToPrompt } from './postcheck.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PIPE = join(HERE, '..', '..', '.pipeline');
const OUT = join(PIPE, 'drafts');
const PREVIEW = join(PIPE, 'batch-preview');

const argv = process.argv.slice(2);
const LIVE = argv.includes('--live');
const LIMIT = Number((argv.find((a) => a.startsWith('--limit')) ?? '--limit=5').split('=')[1] ?? 5);

/** Цены $/1M токенов, прайс от 26.10.2026. Батч вдвое дешевле. */
const PRICES = {
  'claude-opus-5-5': { in: 4, out: 20 },
  'claude-sonnet-5-5': { in: 2, out: 10 },
  'claude-haiku-5-5': { in: 0.1, out: 0.5 },
};

/**
 * Роли моделей. Opus только там, где качество суждения превращается в деньги
 * на горизонте года: текст и адверсариальная критика. Извлечение фактов —
 * работа на точность внутри данного текста, Sonnet хватает. Мета механическая.
 */
const STEPS = {
  facts: { model: 'claude-sonnet-5-5', max_tokens: 3000, effort: 'medium' },
  draft: { model: 'claude-opus-5-5', max_tokens: 4000, effort: 'medium' },
  critique: { model: 'claude-opus-5-5', max_tokens: 3000, effort: 'high' },
  revise: { model: 'claude-opus-5-5', max_tokens: 4000, effort: 'medium' },
  translate: { model: 'claude-sonnet-5-5', max_tokens: 3500, effort: 'medium' },
  meta: { model: 'claude-haiku-5-5', max_tokens: 600, effort: 'low' },
};

const estimateTokens = (s) => Math.round(s.length / 3.5);
const sum = (a) => a.reduce((x, y) => x + y, 0);

/** Текст статьи из HTML без зависимостей: тела нужны только на этой ступени. */
function extractText(html) {
  const body = html
    .replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  const main = /<article[\s\S]*?<\/article>/i.exec(body)?.[0]
    ?? /<main[\s\S]*?<\/main>/i.exec(body)?.[0]
    ?? body;
  return main
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12_000);
}

/**
 * Догрузка исходников. Конвейер хранит только лид и хэши, поэтому тела
 * приходится забирать заново — зато лишь для событий, реально идущих
 * в работу: это два-три запроса на материал, а не на весь поток.
 */
async function fetchDocuments(event) {
  const docs = [];
  for (const m of event.members) {
    try {
      const res = await fetch(m.url, { headers: headers(), signal: AbortSignal.timeout(20_000) });
      if (!res.ok) { console.log(`    ! ${m.group}: HTTP ${res.status}`); continue; }
      const text = extractText(await res.text());
      if (text.length < 400) { console.log(`    ! ${m.group}: тело ${text.length} символов, пропускаю`); continue; }
      docs.push({ group: m.group, sourceType: m.sourceType, url: m.url, text });
      console.log(`    + ${m.group}: ${text.length} символов`);
    } catch (e) {
      console.log(`    ! ${m.group}: ${e.message}`);
    }
    await sleep(POLITE_MS);
  }
  return docs;
}

/** Параметры одного запроса. Общие для батча и для сухого прогона. */
function buildParams(step, messages, schema) {
  const s = STEPS[step];
  return {
    model: s.model,
    max_tokens: s.max_tokens,
    system: systemPrompt(),
    messages,
    output_config: { effort: s.effort, ...(schema ? { format: schema } : {}) },
  };
}

const spend = [];
function account(step, usage) {
  const p = PRICES[STEPS[step].model];
  const cost = ((usage.input_tokens ?? 0) * p.in + (usage.output_tokens ?? 0) * p.out) / 1e6 / 2;
  spend.push({ step, ...usage, cost });
  return cost;
}

/**
 * Один батч на фазу. Опрос статуса здесь неизбежен: Batch API асинхронный
 * по устройству, SLA 24 часа, фактически минуты.
 */
async function runBatch(client, step, requests) {
  if (!requests.length) return new Map();
  console.log(`\n  фаза ${step}: ${requests.length} запросов (${STEPS[step].model})`);
  let batch;
  try {
    batch = await client.messages.batches.create({
      requests: requests.map(({ custom_id, params }) => ({ custom_id, params })),
    });
  } catch (e) {
    if (e?.status === 401 || e?.status === 403) {
      console.error('\nAPI отказал в доступе. Варианты подключения:');
      console.error('  • ключ рабочего пространства:  export ANTHROPIC_API_KEY=sk-ant-...');
      console.error('  • профиль для локальной работы: ant auth login');
      console.error('  • из GitHub Actions — федерация удостоверений, без хранения секрета');
      process.exit(2);
    }
    throw e;
  }
  process.stdout.write(`    батч ${batch.id}, жду`);
  let status = batch;
  while (status.processing_status !== 'ended') {
    await sleep(10_000);
    status = await client.messages.batches.retrieve(batch.id);
    process.stdout.write('.');
  }
  console.log(' готово');

  const out = new Map();
  for await (const r of client.messages.batches.results(batch.id)) {
    if (r.result.type !== 'succeeded') {
      console.log(`    ! ${r.custom_id}: ${r.result.type}`);
      continue;
    }
    const msg = r.result.message;
    const cost = account(step, msg.usage);
    const text = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
    out.set(r.custom_id, { text, cost, stopReason: msg.stop_reason });
  }
  return out;
}

/** Сухой прогон: те же запросы, но на диск и в смету. */
function previewBatch(step, requests) {
  if (!requests.length) return new Map();
  mkdirSync(PREVIEW, { recursive: true });
  writeFileSync(join(PREVIEW, `${step}.json`), JSON.stringify(requests, null, 1) + '\n');
  const p = PRICES[STEPS[step].model];
  const inTok = sum(requests.map((r) =>
    estimateTokens(JSON.stringify(r.params.system)) + estimateTokens(JSON.stringify(r.params.messages))));
  const outTok = requests.length * STEPS[step].max_tokens * 0.45;
  const cost = (inTok * p.in + outTok * p.out) / 1e6 / 2;
  console.log(`  ${step.padEnd(10)} ${String(requests.length).padStart(2)} запр · вход ~${inTok.toLocaleString('ru')} · выход ~${Math.round(outTok).toLocaleString('ru')} · ~$${cost.toFixed(3)}`);
  spend.push({ step, estimated: true, cost });
  return new Map(requests.map((r) => [r.custom_id, { text: `[сухой прогон: ${step}]`, cost: 0 }]));
}

const run = (client, step, requests) => (LIVE ? runBatch(client, step, requests) : previewBatch(step, requests));

// ─────────────────────────────────────────────────────────────────────────

const eventsFile = join(PIPE, 'events.json');
if (!existsSync(eventsFile)) {
  console.error('Нет .pipeline/events.json — сначала ступень 2: node scripts/news/cluster.mjs');
  process.exit(2);
}
const { events } = JSON.parse(readFileSync(eventsFile, 'utf8'));
const queue = events.filter((e) => e.publishable).slice(0, LIMIT);

console.log(`\nСтупень 3 · ${LIVE ? 'БОЕВОЙ ПРОГОН (тратит деньги)' : 'сухой прогон, трат нет'}`);
console.log(`Событий к публикации: ${events.filter((e) => e.publishable).length}, беру ${queue.length}\n`);

if (!queue.length) {
  console.log('Пригодных событий нет. Это нормально: правило 2+ независимых подтверждений');
  console.log('отсекает около 85 % потока, а журнал — то, о чём уже писали.\n');
  process.exit(0);
}

/**
 * Доступ к API. Способов несколько, и проверять только ANTHROPIC_API_KEY
 * нельзя: SDK разрешает учётные данные по цепочке — переменная с ключом,
 * ANTHROPIC_AUTH_TOKEN, профиль `ant auth login`, федерация удостоверений
 * (короткоживущие OIDC-токены, которые выдаёт GitHub Actions). Жёсткая
 * проверка на ключ запретила бы федерацию, то есть ровно тот способ,
 * которым этот конвейер должен ходить в API из CI, когда туда переедет.
 *
 * Поэтому здесь не запрет, а подсказка: явных признаков нет — предупреждаем
 * и всё равно пробуем, вдруг на диске лежит профиль. Отказ по аутентификации
 * ловится при первом же батче и объясняется словами.
 */
const FEDERATION_VARS = [
  'ANTHROPIC_FEDERATION_RULE_ID', 'ANTHROPIC_ORGANIZATION_ID',
  'ANTHROPIC_SERVICE_ACCOUNT_ID',
];
const hasFederation = FEDERATION_VARS.every((v) => process.env[v])
  && (process.env.ANTHROPIC_IDENTITY_TOKEN_FILE || process.env.ANTHROPIC_IDENTITY_TOKEN);

let client = null;
if (LIVE) {
  const source = process.env.ANTHROPIC_API_KEY ? 'ANTHROPIC_API_KEY'
    : process.env.ANTHROPIC_AUTH_TOKEN ? 'ANTHROPIC_AUTH_TOKEN'
    : hasFederation ? 'федерация удостоверений'
    : null;
  if (source) console.log(`Доступ к API: ${source}`);
  else console.log('Доступ к API: явных переменных нет, рассчитываю на профиль `ant auth login`');

  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  client = new Anthropic();
}

console.log('Догружаю исходники (тела не хранятся, только хэши):');
const docs = new Map();
for (const e of queue) {
  console.log(`  ${e.id} ${e.title.slice(0, 60)}`);
  docs.set(e.id, LIVE || argv.includes('--fetch') ? await fetchDocuments(e) : []);
}

if (!LIVE) {
  console.log('\nСмета сухого прогона:');
  if (!argv.includes('--fetch'))
    console.log('  (без --fetch тела источников не скачаны, поэтому вход шага facts занижен)');
}

const facts = await run(client, 'facts', queue.map((e) => ({
  custom_id: e.id,
  params: buildParams('facts', extractFactsPrompt(e, docs.get(e.id) ?? []), FACTS_SCHEMA),
})));

const drafts = await run(client, 'draft', queue.map((e) => ({
  custom_id: e.id,
  params: buildParams('draft', draftPrompt(e, facts.get(e.id)?.text ?? '{}')),
})));

const critiques = await run(client, 'critique', queue.map((e) => ({
  custom_id: e.id,
  params: buildParams('critique', critiquePrompt(drafts.get(e.id)?.text ?? '', facts.get(e.id)?.text ?? '{}')),
})));

/** Замечания кода добавляются к замечаниям критика: правка идёт одним проходом. */
const revisions = await run(client, 'revise', queue.map((e) => {
  const draft = drafts.get(e.id)?.text ?? '';
  const check = postcheck(draft, 'en');
  const notes = [critiques.get(e.id)?.text ?? '', check.ok ? '' : issuesToPrompt(check.issues)]
    .filter(Boolean).join('\n');
  return { custom_id: e.id, params: buildParams('revise', revisePrompt(draft, notes, check.hint)) };
}));

const translations = await run(client, 'translate', queue.map((e) => ({
  custom_id: e.id,
  params: buildParams('translate', translatePrompt(revisions.get(e.id)?.text ?? '')),
})));

const metas = await run(client, 'meta', queue.flatMap((e) => [
  { custom_id: `${e.id}:en`, params: buildParams('meta', metaPrompt(revisions.get(e.id)?.text ?? '', 'en'), META_SCHEMA) },
  { custom_id: `${e.id}:es`, params: buildParams('meta', metaPrompt(translations.get(e.id)?.text ?? '', 'es'), META_SCHEMA) },
]));

mkdirSync(OUT, { recursive: true });
const report = [];
for (const e of queue) {
  const en = revisions.get(e.id)?.text ?? '';
  const es = translations.get(e.id)?.text ?? '';
  const checkEn = LIVE ? postcheck(en, 'en') : null;
  const checkEs = LIVE ? postcheck(es, 'es') : null;
  const record = {
    id: e.id,
    event: e.title,
    sources: e.members.map((m) => ({ group: m.group, url: m.url })),
    voices: e.voices,
    facts: facts.get(e.id)?.text ?? null,
    en: { text: en, meta: metas.get(`${e.id}:en`)?.text ?? null, check: checkEn },
    es: { text: es, meta: metas.get(`${e.id}:es`)?.text ?? null, check: checkEs },
    generatedAt: new Date().toISOString(),
    live: LIVE,
  };
  if (LIVE) writeFileSync(join(OUT, `${e.id}.json`), JSON.stringify(record, null, 1) + '\n');
  report.push({
    id: e.id,
    en: checkEn ? (checkEn.ok ? 'ок' : `${checkEn.issues.length} замечаний`) : '—',
    es: checkEs ? (checkEs.ok ? 'ок' : `${checkEs.issues.length} замечаний`) : '—',
  });
}

const total = sum(spend.map((s) => s.cost));
console.log(`\n${LIVE ? 'Потрачено' : 'Оценка'}: $${total.toFixed(3)} на ${queue.length} материалов ($${(total / queue.length).toFixed(3)} за материал)`);
if (LIVE) {
  console.table(report);
  console.log(`\nЧерновики: ${OUT}`);
  console.log('Публикация — ручная. Бот в Sanity не пишет.\n');
} else {
  console.log(`Запросы для инспекции: ${PREVIEW}`);
  console.log('Боевой прогон: node scripts/news/generate.mjs --live\n');
}
