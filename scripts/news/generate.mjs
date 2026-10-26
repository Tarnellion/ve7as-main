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
 * Этот скрипт в Sanity НЕ пишет — ни черновики, ни тем более публикации.
 * Он складывает готовые записи в .pipeline/drafts/. Что с ними делать —
 * черновик для человека или публикация без него — решает deliver.mjs по
 * политике из policy.mjs, и именно там сосредоточены все гейты.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { headers, sleep, POLITE_MS } from './http.mjs';
import {
  systemPrompt, extractFactsPrompt, draftPrompt, critiquePrompt,
  revisePrompt, translatePrompt, metaPrompt, verifyPrompt,
  FACTS_SCHEMA, META_SCHEMA, VERIFY_SCHEMA,
} from './prompts.mjs';
import { makeClient } from './client.mjs';
import { intEnv, positiveEnv } from './env.mjs';
import { dequantize, cosine } from './vec.mjs';
import { SAME_EVENT } from './thresholds.mjs';
import { postcheck, issuesToPrompt, translationFidelity } from './postcheck.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
// NEWS_PIPE_DIR нужен самопроверке: она гоняет живой путь против мока в чужой папке.
const PIPE = process.env.NEWS_PIPE_DIR ?? join(HERE, '..', '..', '.pipeline');
const OUT = join(PIPE, 'drafts');
const PREVIEW = join(PIPE, 'batch-preview');

const argv = process.argv.slice(2);
const LIVE = argv.includes('--live');
/**
 * Синхронный режим: ответ за секунды, полная цена.
 *
 * Batch API оптимизирован на пропускную способность, а не на задержку.
 * Измерено 26.10.2026: батч из одного запроса Opus ждал больше 14 минут ради
 * экономии четырёх центов. Первоначально флаг считался отладочным, а в
 * расписании предполагался батч, — это было неверно для реального объёма.
 * Ежедневный прогон берёт 1-3 события, и скидка батча на них около девяти
 * долларов в месяц, тогда как цена — неопределённое ожидание (формально до
 * суток) и риск, что таймаут задания убьёт прогон между оплаченными фазами.
 * Поэтому в расписании работает --sync, а батч имеет смысл для разовых
 * массовых прогонов с десятком событий и больше.
 */
const SYNC = argv.includes('--sync');
// Флаг важнее переменной окружения: ручной запуск с --limit не должен зависеть
// от того, что выставлено в репозитории для расписания.
const limitFlag = argv.find((a) => a.startsWith('--limit'));
const LIMIT = limitFlag ? Number(limitFlag.split('=')[1]) : intEnv('NEWS_PER_RUN', 5, { min: 1, max: 20 });

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
/**
 * Потолки заданы С ЗАПАСОМ НА ДУМАНИЕ, и это не расточительство:
 * `max_tokens` — предел, а не предоплата, платим за фактический выход.
 *
 * Измерено на боевых прогонах 26.10.2026: у критики (Opus, effort high)
 * выход 5101 токен, из них 3039 — размышление, то есть текста замечаний
 * там меньше трети. Прижатый потолок режет не «лишнее», а ответ посередине
 * слова, причём каждый прогон сыплется в разном месте: при 3000 обрывало
 * критику, при 6000 — черновик. Запас дешевле, чем обрезанный черновик,
 * по которому потом идёт правка.
 */
const STEPS = {
  facts: { model: 'claude-sonnet-5-5', max_tokens: 10_000, effort: 'medium' },
  draft: { model: 'claude-opus-5-5', max_tokens: 12_000, effort: 'medium' },
  critique: { model: 'claude-opus-5-5', max_tokens: 12_000, effort: 'high' },
  revise: { model: 'claude-opus-5-5', max_tokens: 12_000, effort: 'medium' },
  verify: { model: 'claude-opus-5-5', max_tokens: 12_000, effort: 'high' },
  verifyEs: { model: 'claude-opus-5-5', max_tokens: 12_000, effort: 'high' },
  translate: { model: 'claude-sonnet-5-5', max_tokens: 10_000, effort: 'medium' },
  meta: { model: 'claude-haiku-5-5', max_tokens: 3000, effort: 'low' },
};

const estimateTokens = (s) => Math.round(s.length / 3.5);
const sum = (a) => a.reduce((x, y) => x + y, 0);

/**
 * Текст статьи из HTML без зависимостей. Разбор ЛИНЕЙНЫЙ намеренно: прежние
 * регулярные выражения с ленивым `[\s\S]*?` на странице с тысячами незакрытых
 * `<script` работали квадратично и могли подвесить задание. Источник —
 * чужой сайт, и от его вёрстки время работы зависеть не должно.
 */
function stripBlocks(html, open, close) {
  const low = html.toLowerCase();
  let out = '';
  let i = 0;
  for (;;) {
    const s = low.indexOf(open, i);
    if (s === -1) return out + html.slice(i);
    out += `${html.slice(i, s)} `;
    const e = low.indexOf(close, s);
    if (e === -1) return out; // незакрытый блок уходит до конца документа
    i = e + close.length;
  }
}

function stripTags(html) {
  let out = '';
  let inTag = false;
  for (let i = 0; i < html.length; i++) {
    const ch = html[i];
    if (ch === '<') inTag = true;
    else if (ch === '>' && inTag) { inTag = false; out += ' '; }
    else if (!inTag) out += ch;
  }
  return out;
}

const MAX_BODY = 1_500_000;

function extractText(raw) {
  let html = raw.slice(0, MAX_BODY);
  for (const tag of ['script', 'style', 'noscript', 'svg']) html = stripBlocks(html, `<${tag}`, `</${tag}>`);
  html = stripBlocks(html, '<!--', '-->');
  const low = html.toLowerCase();
  let main = html;
  for (const tag of ['article', 'main']) {
    const s = low.indexOf(`<${tag}`);
    const e = low.indexOf(`</${tag}>`, s);
    if (s !== -1 && e !== -1) { main = html.slice(s, e); break; }
  }
  return stripTags(main)
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12_000);
}

/**
 * Куда ходить можно. Ссылки на материалы берутся из лент чужих сайтов, то есть
 * из недоверенного ввода: без проверки лента могла бы направить задание на
 * внутренний адрес или файловую схему. IP-адреса и локальные имена отвергаются.
 * NEWS_ALLOW_LOCAL_FETCH нужен только самопроверке, которая поднимает мок на 127.0.0.1.
 */
function isSafeUrl(u) {
  try {
    const x = new URL(u);
    if (x.protocol !== 'https:' && x.protocol !== 'http:') return false;
    if (process.env.NEWS_ALLOW_LOCAL_FETCH === '1') return true;
    const h = x.hostname;
    return /^[a-z0-9.-]+$/i.test(h) && !/^[\d.]+$/.test(h) && h !== 'localhost' && !/\.(local|internal|localhost)$/i.test(h);
  } catch { return false; }
}

/** Читает тело не больше MAX_BODY: чужая страница не должна занимать память целиком. */
async function readCapped(res) {
  const reader = res.body.getReader();
  const chunks = [];
  let size = 0;
  while (size < MAX_BODY) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.length;
  }
  await reader.cancel().catch(() => {});
  return new TextDecoder().decode(Buffer.concat(chunks.map((c) => Buffer.from(c))).subarray(0, MAX_BODY));
}

/**
 * Признаки текста-инструкции в источнике: обращения к модели, которых в новости
 * быть не должно. Это не защита (текст всё равно идёт в рамке «недоверенные данные»),
 * а сигнал: такой материал не публикуется без человека.
 */
const INJECTION = /(ignore|disregard|forget)\s+(all\s+|any\s+)?(the\s+|your\s+)?(previous|prior|above|earlier|these)\s+(instructions|rules|prompts?)|system prompt|you are (now )?(an?|the) (ai|assistant|language model)|set\s+(ok|verdict)\s*=|<\s*\/?\s*(system|assistant|instructions?)\s*>|as an ai (language )?model|игнорируй\s+(все\s+)?(предыдущие|прежние)\s+(инструкции|правила)/i;

/**
 * Догрузка исходников. Конвейер хранит только лид и хэши, поэтому тела
 * приходится забирать заново — зато лишь для событий, реально идущих
 * в работу: это два-три запроса на материал, а не на весь поток.
 */
async function fetchDocuments(event) {
  const docs = [];
  for (const m of event.members) {
    try {
      if (!isSafeUrl(m.url)) { console.log(`    ! ${m.group}: адрес не прошёл проверку, пропускаю`); continue; }
      const res = await fetch(m.url, { headers: headers(), signal: AbortSignal.timeout(20_000) });
      if (!res.ok) { console.log(`    ! ${m.group}: HTTP ${res.status}`); continue; }
      if (!isSafeUrl(res.url)) { console.log(`    ! ${m.group}: редирект на недопустимый адрес, пропускаю`); continue; }
      const text = extractText(await readCapped(res));
      if (text.length < 400) { console.log(`    ! ${m.group}: тело ${text.length} символов, пропускаю`); continue; }
      const suspicious = INJECTION.test(text);
      if (suspicious) console.log(`    ! ${m.group}: в тексте есть похожее на инструкции модели — материал без человека не выйдет`);
      docs.push({ group: m.group, sourceType: m.sourceType, url: m.url, text, suspicious });
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

/**
 * Предохранитель: потолок трат одного прогона, по умолчанию $4.
 *
 * Обычный прогон на двух-трёх событиях стоит $1-2. Потолок не про экономию, а
 * про ошибку: цикл, повторивший запросы, или очередь, внезапно выросшая
 * в десять раз, за вечер съедают бюджет месяца, и ключ от этого не защищает.
 * Лимит в Console — внешняя защита, эта — внутренняя; она срабатывает раньше
 * и останавливает прогон с понятной причиной, а не отказом API по исчерпании.
 */
const RUN_BUDGET = positiveEnv('NEWS_RUN_BUDGET', 4, { max: 50 });

const spend = [];
function account(step, usage) {
  const p = PRICES[STEPS[step].model];
  // Скидка 50 % — свойство батча. В синхронном режиме платим полную цену.
  const discount = SYNC ? 1 : 2;
  const cost = ((usage.input_tokens ?? 0) * p.in + (usage.output_tokens ?? 0) * p.out) / 1e6 / discount;
  spend.push({ step, ...usage, cost });
  const total = sum(spend.map((s) => s.cost));
  if (total > RUN_BUDGET) {
    console.error(`\nПотолок трат прогона $${RUN_BUDGET} превышен ($${total.toFixed(2)}), останавливаюсь. ` +
      'Потолок задаётся NEWS_RUN_BUDGET; если очередь законно выросла, поднимите его осознанно.');
    process.exit(3);
  }
  return cost;
}

/**
 * Обычные вызовы по одному. Идут через stream().finalMessage(): при
 * max_tokens в тысячи токенов и включённом adaptive thinking нестриминговый
 * запрос рискует упереться в HTTP-таймаут раньше, чем модель договорит.
 */
async function runSync(client, step, requests) {
  if (!requests.length) return new Map();
  console.log(`\n  фаза ${step}: ${requests.length} запросов (${STEPS[step].model}, синхронно)`);
  const out = new Map();
  for (const { custom_id, params } of requests) {
    process.stdout.write(`    ${custom_id} `);
    const started = Date.now();
    let msg;
    try {
      msg = await client.messages.stream(params).finalMessage();
    } catch (e) {
      // Отказ по доступу объяснять ниже нечем и продолжать бессмысленно: все
      // следующие запросы получат то же. Всё остальное (перегрузка, сбой
      // сети после повторов SDK) — потеря одного события, а не прогона.
      if (e?.status === 401 || e?.status === 403) throw e;
      console.log(`! ошибка API ${e?.status ?? ''} ${e?.message?.slice(0, 120) ?? e}`);
      continue;
    }
    const cost = account(step, msg.usage);
    const text = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
    if (msg.stop_reason === 'max_tokens')
      console.log(`! упёрся в max_tokens (${STEPS[step].max_tokens}) — ответ обрезан`);
    else
      console.log(`${((Date.now() - started) / 1000).toFixed(0)} с · $${cost.toFixed(4)}`);
    out.set(custom_id, {
      text, cost, stopReason: msg.stop_reason,
      truncated: msg.stop_reason === 'max_tokens',
      usage: msg.usage,
    });
  }
  return out;
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
  // results() отдаёт Promise<JSONLDecoder>, а не готовый итератор: без await
  // `for await` получает сам промис и падает с «not async iterable».
  const stream = await client.messages.batches.results(batch.id);
  for await (const r of stream) {
    if (r.result.type !== 'succeeded') {
      console.log(`    ! ${r.custom_id}: ${r.result.type}`);
      continue;
    }
    const msg = r.result.message;
    const cost = account(step, msg.usage);
    const text = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
    /**
     * Обрыв по max_tokens рвёт и структурированный вывод: JSON приходит
     * незакрытым, и падение случается позже, на разборе, где причина уже
     * не видна. Поэтому ловим здесь, пока известно, какой это шаг.
     */
    if (msg.stop_reason === 'max_tokens')
      console.log(`    ! ${r.custom_id}: упёрся в max_tokens (${STEPS[step].max_tokens}) на шаге ${step} — ответ обрезан`);
    out.set(r.custom_id, { text, cost, stopReason: msg.stop_reason, truncated: msg.stop_reason === 'max_tokens' });
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

const run = (client, step, requests) =>
  !LIVE ? previewBatch(step, requests)
    : SYNC ? runSync(client, step, requests)
    : runBatch(client, step, requests);

// ─────────────────────────────────────────────────────────────────────────

const eventsFile = join(PIPE, 'events.json');
if (!existsSync(eventsFile)) {
  console.error('Нет .pipeline/events.json — сначала ступень 2: node scripts/news/cluster.mjs');
  process.exit(2);
}
const { events } = JSON.parse(readFileSync(eventsFile, 'utf8'));
// Берём `queue`, а не `publishable`: это разные решения. `publishable` —
// событие подтверждено двумя независимыми голосами или первичным документом
// регулятора. `queue` — оно вдобавок прошло фильтр значимости и не является
// корпоративным анонсом. Анонс выставки бывает безупречно подтверждён, и по
// `publishable` ступень 3 платила бы за него модели. Старое поле оставлено
// для совместимости со `events.json` прошлых прогонов.
const selectable = events.filter((e) => (e.queue ?? e.publishable));
const screened = events.filter((e) => e.publishable && e.queue === false).length;
// Порядок решает, кто попадёт в лимит, и от него зависит, увидим ли мы вообще
// автопубликацию: она требует трёх независимых групп, а `cluster` отдаёт
// события не по силе подтверждения. С лимитом 2 два события на двух группах
// вытеснили бы единственное на пяти. Сортировка устойчивая — внутри равных
// остаётся порядок кластеризатора.
// Сила считается по ГОЛОСАМ (после схлопывания синдикации), а не по группам: иначе событие с тремя
// перепечатками одного текста обошло бы настоящее на двух независимых изданиях.
const strength = (e) => Math.min(e.voices ?? 0, (e.confirmingGroups ?? e.groups ?? []).length) + (e.verdict === 'regulator-primary' ? 100 : 0);
selectable.sort((a, b) => strength(b) - strength(a));

/**
 * ДУБЛИ. Кластеризация не склеивает кросс-языковые пары: нидерландское сообщение KSA о штрафе и
 * английские публикации о нём имеют нижнюю пару 0.865 при полу 0.88, то есть это одно событие,
 * показанное редактору глазами. При ручной публикации редактор их склеит, при автоматической
 * вышли бы две статьи на один штраф. Здесь пара считается дублем при сходстве центроидов от
 * порога «то же событие»: событие, похожее на уже выбранное в этом прогоне или на уже
 * доставленное (журнал), откладывается. Если это на деле разные события, оно просто останется
 * в очереди: журналу и очереди его потеря ничего не стоит, а лишняя статья стоит репутации.
 */
function loadJournalCentroids() {
  try {
    const j = JSON.parse(readFileSync(process.env.NEWS_JOURNAL_PATH ?? join(HERE, 'state', 'journal.json'), 'utf8'));
    return (j.entries ?? []).filter((x) => x.centroid).map((x) => ({ id: x.id, vec: dequantize(x.centroid) }));
  } catch { return []; }
}
const journalVecs = loadJournalCentroids();
const queue = [];
const postponed = [];
for (const e of selectable) {
  if (queue.length >= LIMIT) break;
  const v = e.centroid ? dequantize(e.centroid) : null;
  const twin = v && [...queue.map((q) => ({ id: q.id, vec: q.centroid ? dequantize(q.centroid) : null })), ...journalVecs]
    .find((o) => o.vec && cosine(v, o.vec) >= SAME_EVENT);
  if (twin) { postponed.push({ id: e.id, of: twin.id }); continue; }
  queue.push(e);
}
for (const d of postponed) console.log(`  ⤷ ${d.id} отложено: возможный дубль события ${d.of}`);

console.log(`\nСтупень 3 · ${LIVE ? `БОЕВОЙ ПРОГОН (тратит деньги${SYNC ? ', синхронно — без скидки батча' : ''})` : 'сухой прогон, трат нет'}`);
console.log(`Событий в очереди: ${selectable.length}${screened ? ` (ещё ${screened} отсеяно фильтром значимости)` : ''}, беру ${queue.length}\n`);

if (!queue.length) {
  console.log('Пригодных событий нет. Это нормально: правило 2+ независимых подтверждений');
  console.log('отсекает около 85 % потока, а журнал — то, о чём уже писали.\n');
  process.exit(0);
}

let client = null;
if (LIVE) {
  const made = makeClient();
  client = made.client;
  console.log(`Доступ к API: ${made.source}`);
  if (made.warning) console.log(`  ! ${made.warning}`);
}

console.log('Догружаю исходники (тела не хранятся, только хэши):');
const docs = new Map();
for (const e of queue) {
  console.log(`  ${e.id} ${e.title.slice(0, 60)}`);
  docs.set(e.id, LIVE || argv.includes('--fetch') ? await fetchDocuments(e) : []);
}

// Событие без единого прочитанного текста не обрабатываем вовсе: модель получила бы название и
// «подтвердили три группы» и добросовестно сочинила бы факты, а проверка, читая тот же
// сочинённый список, нашла бы текст безупречно согласованным с ним. Платить за это незачем.
const unread = new Set(LIVE ? queue.filter((e) => !(docs.get(e.id)?.length)).map((e) => e.id) : []);
for (const id of unread) console.log(`    ✗ ${id} выбывает: ни один источник не отдал текст`);

if (!LIVE) {
  console.log('\nСмета сухого прогона:');
  if (!argv.includes('--fetch'))
    console.log('  (без --fetch тела источников не скачаны, поэтому вход шага facts занижен)');
}

/**
 * Событие остаётся в работе, пока каждая пройденная фаза дала полноценный
 * результат: ответ есть и он не обрезан по max_tokens. Раньше следующие фазы
 * получали пустую строку или оборванный JSON и спокойно платили за их
 * обработку: черновик «по фактам {}» стоит столько же, сколько настоящий.
 */
const alive = new Set(queue.filter((e) => !unread.has(e.id)).map((e) => e.id));
const failures = new Map([...unread].map((id) => [id, 'fetch: ни один источник не отдал текст']));
const living = () => queue.filter((e) => alive.has(e.id));

function drop(e, step, why) {
  alive.delete(e.id);
  failures.set(e.id, `${step}: ${why}`);
  console.log(`    ✗ ${e.id} выбывает — ${step}: ${why}`);
}

function settle(step, results) {
  for (const e of living()) {
    const r = results.get(e.id);
    if (!r || !r.text) drop(e, step, 'нет ответа');
    else if (r.truncated) drop(e, step, `обрезан по max_tokens (${STEPS[step].max_tokens})`);
  }
  return results;
}

const parseJson = (s) => { try { return JSON.parse(s); } catch { return null; } };

const facts = settle('facts', await run(client, 'facts', living().map((e) => ({
  custom_id: e.id,
  params: buildParams('facts', extractFactsPrompt(e, docs.get(e.id) ?? []), FACTS_SCHEMA),
}))));

const drafts = settle('draft', await run(client, 'draft', living().map((e) => ({
  custom_id: e.id,
  params: buildParams('draft', draftPrompt(e, facts.get(e.id).text)),
}))));

const critiques = settle('critique', await run(client, 'critique', living().map((e) => ({
  custom_id: e.id,
  params: buildParams('critique', critiquePrompt(drafts.get(e.id).text, facts.get(e.id).text)),
}))));

/** Замечания кода добавляются к замечаниям критика: правка идёт одним проходом. */
const revisions = settle('revise', await run(client, 'revise', living().map((e) => {
  const draft = drafts.get(e.id).text;
  const check = postcheck(draft, 'en');
  const notes = [critiques.get(e.id).text, check.ok ? '' : issuesToPrompt(check.issues)]
    .filter(Boolean).join('\n');
  return { custom_id: e.id, params: buildParams('revise', revisePrompt(draft, notes, check.hint)) };
})));

const translations = settle('translate', await run(client, 'translate', living().map((e) => ({
  custom_id: e.id,
  params: buildParams('translate', translatePrompt(revisions.get(e.id).text)),
}))));

const metas = await run(client, 'meta', living().flatMap((e) => [
  { custom_id: `${e.id}:en`, params: buildParams('meta', metaPrompt(revisions.get(e.id).text, 'en'), META_SCHEMA) },
  { custom_id: `${e.id}:es`, params: buildParams('meta', metaPrompt(translations.get(e.id).text, 'es'), META_SCHEMA) },
]));

// Мета без разбираемого JSON — материалу не из чего собрать заголовок и слаг.
// В сухом прогоне вместо ответов заглушки, поэтому там не проверяем.
if (LIVE) {
  for (const e of living()) {
    for (const lang of ['en', 'es']) {
      const r = metas.get(`${e.id}:${lang}`);
      if (!r?.text || r.truncated || !parseJson(r.text)) drop(e, `meta ${lang}`, 'нет разбираемого JSON');
    }
  }
}

/**
 * Второй проход читает ОБА языка с заголовками и описаниями: публичный текст обещает именно
 * это, а до ревью проверялся только английский текст, и испанская версия с подменённой суммой
 * или заголовок со словом «рекорд» выходили без проверки.
 *
 * Вердикт НЕ выбрасывает событие: нет вердикта — материал всё равно доходит до человека
 * черновиком, но автопубликация для него закрыта (policy.mjs).
 */
const metaOf = (e, lang) => (LIVE ? parseJson(metas.get(`${e.id}:${lang}`)?.text) : null) ?? {};
const verdictsEn = await run(client, 'verify', living().map((e) => ({
  custom_id: e.id,
  params: buildParams('verify', verifyPrompt(revisions.get(e.id).text, facts.get(e.id).text, e,
    { lang: 'en', title: metaOf(e, 'en').title, description: metaOf(e, 'en').description }), VERIFY_SCHEMA),
})));
const verdictsEs = await run(client, 'verifyEs', living().map((e) => ({
  custom_id: e.id,
  params: buildParams('verifyEs', verifyPrompt(translations.get(e.id).text, facts.get(e.id).text, e,
    { lang: 'es', title: metaOf(e, 'es').title, description: metaOf(e, 'es').description }), VERIFY_SCHEMA),
})));

mkdirSync(OUT, { recursive: true });
const report = [];
for (const e of living()) {
  const en = revisions.get(e.id).text;
  const es = translations.get(e.id).text;
  const checkEn = LIVE ? postcheck(en, 'en') : null;
  let checkEs = LIVE ? postcheck(es, 'es') : null;
  if (checkEs) {
    // Ритм у перевода не меряем (см. postcheck.mjs), вместо него — сохранность структуры оригинала.
    const fidelity = translationFidelity(en, es);
    if (fidelity.length) checkEs = { ...checkEs, ok: false, issues: [...checkEs.issues, ...fidelity] };
  }
  const verdict = verdictsEn.get(e.id);
  const verdictEs = verdictsEs.get(e.id);
  const record = {
    id: e.id,
    event: e.title,
    // То, на чём политика решает «можно ли без человека»: сила подтверждения.
    eventMeta: {
      verdict: e.verdict ?? null,
      confirmingGroups: e.confirmingGroups ?? e.groups ?? [],
      voices: e.voices,
      firstSeen: e.firstSeen ?? null,
    },
    sources: e.members.map((m) => ({ group: m.group, url: m.url })),
    voices: e.voices,
    facts: facts.get(e.id).text,
    factsParsed: LIVE ? parseJson(facts.get(e.id).text) : null,
    critique: {
      text: critiques.get(e.id).text,
      truncated: critiques.get(e.id).truncated ?? false,
      usage: critiques.get(e.id).usage ?? null,
    },
    draftBeforeRevision: drafts.get(e.id).text,
    // Что реально прочитано: политика решает по этому, а не по кластеру («подтверждают три группы»).
    fetched: (docs.get(e.id) ?? []).map((d) => ({ group: d.group, chars: d.text.length, suspicious: d.suspicious })),
    // null — вердикта нет или он не разобрался: для политики это отказ.
    verify: LIVE && verdict && !verdict.truncated ? parseJson(verdict.text) : null,
    verifyEs: LIVE && verdictEs && !verdictEs.truncated ? parseJson(verdictEs.text) : null,
    truncated: Object.fromEntries(
      [['facts', facts], ['draft', drafts], ['critique', critiques], ['revise', revisions],
        ['verify', verdictsEn], ['verifyEs', verdictsEs], ['translate', translations]]
        .map(([k, m]) => [k, Boolean(m.get(e.id)?.truncated)])),
    en: { text: en, meta: parseJson(metas.get(`${e.id}:en`)?.text), check: checkEn },
    es: { text: es, meta: parseJson(metas.get(`${e.id}:es`)?.text), check: checkEs },
    generatedAt: new Date().toISOString(),
    live: LIVE,
  };
  if (LIVE) writeFileSync(join(OUT, `${e.id}.json`), JSON.stringify(record, null, 1) + '\n');
  report.push({
    id: e.id,
    en: checkEn ? (checkEn.ok ? 'ок' : `${checkEn.issues.length} замечаний`) : '—',
    es: checkEs ? (checkEs.ok ? 'ок' : `${checkEs.issues.length} замечаний`) : '—',
    verify: record.verify ? (record.verify.ok ? 'ок' : `${record.verify.blockers.length} блок.`) : '—',
    verifyEs: record.verifyEs ? (record.verifyEs.ok ? 'ок' : `${record.verifyEs.blockers.length} блок.`) : '—',
  });
}

const total = sum(spend.map((s) => s.cost));
if (LIVE) {
  writeFileSync(join(PIPE, 'generate-report.json'), JSON.stringify({
    at: new Date().toISOString(), mode: SYNC ? 'sync' : 'batch', cost: total,
    produced: report.map((r) => r.id), failures: Object.fromEntries(failures),
  }, null, 1) + '\n');
}
console.log(`\n${LIVE ? 'Потрачено' : 'Оценка'}: $${total.toFixed(3)} на ${queue.length} событий ` +
  `(${living().length} дошли до конца${failures.size ? `, ${failures.size} выбыли` : ''})`);
if (LIVE) {
  if (report.length) console.table(report);
  console.log(`\nЗаписи: ${OUT}`);
  console.log('Дальше — deliver.mjs: он решает, черновик это или публикация.\n');
  // Красный прогон, только если не вышло ничего: частичный успех — это работа.
  if (queue.length && !report.length) process.exit(1);
} else {
  console.log(`Запросы для инспекции: ${PREVIEW}`);
  console.log('Боевой прогон: node scripts/news/generate.mjs --live\n');
}
