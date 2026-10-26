#!/usr/bin/env node
/**
 * Доставка: запись генератора → документ Sanity.
 *
 *   node scripts/news/deliver.mjs            # сухой: что и как ушло бы, ничего не пишет
 *   node scripts/news/deliver.mjs --write    # пишет в Sanity (нужен SANITY_WRITE_TOKEN)
 *
 * Режим — переменная NEWS_PUBLISH_MODE: draft (по умолчанию) или auto. Куда
 * ложится материал и почему, решает policy.mjs; здесь только исполнение.
 *
 * ТРИ СВОЙСТВА, КОТОРЫЕ НЕЛЬЗЯ ТЕРЯТЬ
 *
 * 1. createIfNotExists, никогда createOrReplace. Повторный прогон того же
 *    события не должен затирать черновик, который редактор уже правит в
 *    Studio. Идентификатор документа выводится из события, поэтому повтор
 *    безопасен, а не плодит дубли.
 *
 * 2. Потолок публикаций за прогон (NEWS_AUTO_MAX_PER_RUN, по умолчанию 3).
 *    Гейты — код, и у кода бывают ошибки. Потолок ограничивает цену ошибки:
 *    если гейт где-то перестал держать, за один прогон уйдёт не больше трёх
 *    материалов, а не весь поток. Лишнее идёт черновиком.
 *
 * 3. Бот никогда не подписывается именем человека. Автор — «Ve7as», без
 *    ссылки на профиль. Подпись реального человека под текстом, который он не
 *    писал и не читал, — введение читателя в заблуждение; если редактор
 *    утвердил черновик, автора он назначает сам.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, appendFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createClient } from '@sanity/client';
import { decide, SECTIONS, maxPerRun } from './policy.mjs';
import { modeEnv } from './env.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PIPE = process.env.NEWS_PIPE_DIR ?? join(HERE, '..', '..', '.pipeline');
const DRAFTS = join(PIPE, 'drafts');

const argv = process.argv.slice(2);
const WRITE = argv.includes('--write');
const API_VERSION = '2025-02-19';

// Режим: регистр не важен, а непонятное значение — ошибка, а не молчаливый draft или auto.
const modeInfo = modeEnv();
if (!modeInfo.valid) {
  console.error(`NEWS_PUBLISH_MODE=${JSON.stringify(modeInfo.raw)}: допустимы только draft и auto.`);
  process.exit(2);
}
const MODE = modeInfo.mode;
// Потолок читается безопасно: опечатка в переменной не должна его отключать.
const MAX_PER_RUN = maxPerRun();

const wordCount = (s) => s.trim().split(/\s+/).filter(Boolean).length;
const clip = (s, n) => (s.length > n ? `${s.slice(0, n).trimEnd()}…` : s);

/** Заметки редактора: всё, что нужно, чтобы принять решение, не открывая JSON на диске. */
function reviewNotes(record, decision, mode, now) {
  const f = record.factsParsed;
  const lines = [
    `Создано конвейером ${now} · событие ${record.id}`,
    `Режим доставки: ${mode}`,
    `В режиме auto ушло бы в публикацию: ${decision.eligible ? 'ДА' : 'НЕТ'}`,
  ];
  const blockers = decision.reasons.filter((r) => r.code !== 'mode');
  if (blockers.length) {
    lines.push('', 'Почему нужен человек:');
    for (const r of blockers) lines.push(`  — ${r.text}`);
  }

  lines.push('', `Источники (${record.eventMeta?.confirmingGroups?.length ?? 0} независимых групп, вердикт ${record.eventMeta?.verdict ?? '—'}):`);
  for (const s of record.sources) lines.push(`  ${s.group}  ${s.url}`);

  if (f?.unconfirmed?.length) {
    lines.push('', 'ПРОВЕРИТЬ ВРУЧНУЮ — утверждения из одного источника:');
    for (const u of f.unconfirmed) lines.push(`  — ${clip(u, 400)}`);
  }

  const v = record.verify;
  lines.push('', 'Второй проход перед публикацией:');
  if (!v) lines.push('  вердикта нет');
  else {
    lines.push(`  ok: ${v.ok}; названы частные лица: ${v.namesPrivateIndividuals}${v.individuals?.length ? ` (${v.individuals.join(', ')})` : ''}`);
    for (const b of v.blockers ?? []) lines.push(`  блокер [${b.kind}] «${clip(b.quote, 160)}» — ${b.problem}`);
    if (v.notes) lines.push(`  заметка: ${v.notes}`);
  }

  const c = record.en.check;
  if (c) lines.push('', `Постпроверка EN: ${c.words} слов, CV ритма ${c.rhythm?.cv}, однопредложенных ${Math.round((c.rhythm?.singleShare ?? 0) * 100)} %`);
  if (record.critique?.text) lines.push('', 'Критика до правки (сокращённо):', clip(record.critique.text, 1500));

  return clip(lines.join('\n'), 7000);
}

/**
 * Документ Sanity из записи генератора.
 *
 * ПОЛЯ *_ru ЗАПОЛНЯЮТСЯ АНГЛИЙСКИМ ТЕКСТОМ, и это вынужденно. Русский — корень
 * контентного фолбэка (DEFAULT_LANGUAGE): запрос для любой локали собирает
 * `select(есть перевод => перевод, *_ru)`, и без *_ru три из пяти
 * неиндексируемых локалей получили бы пустой заголовок. Схема тоже считает
 * title_ru обязательным. Индексу это не вредит: ru закрыт `noindex`, а
 * в sitemap и hreflang идут только en и es.
 */
export function buildDoc(record, decision, { now = new Date().toISOString(), slug } = {}) {
  const published = decision.publish;
  const en = record.en;
  const es = record.es;
  return {
    _id: `${published ? '' : 'drafts.'}news-${record.id}`,
    _type: 'article',
    slug: { _type: 'slug', current: slug ?? en.meta.slug },
    section: { _type: 'reference', _ref: `section-${en.meta.section}` },
    pubDate: now,
    author: 'Ve7as',
    featured: false,
    readingTime: Math.max(1, Math.round(wordCount(en.text) / 200)),
    // ВСЕГДА 'automated', и у черновиков тоже. 'assisted' говорит читателю «прочитано редактором»,
    // а черновик на момент создания не читал никто: редактор, нажавший Publish, не обязан помнить
    // про отдельное поле. Забытое значение «автоматически, без проверки» безвредно и правдиво по
    // умолчанию; забытое «проверено» — ложь на публичной странице. Прочитав черновик, редактор
    // сам меняет значение на 'assisted'.
    aiDisclosure: 'automated',
    title_en: en.meta.title,
    description_en: en.meta.description,
    body_en: en.text,
    title_es: es.meta.title,
    description_es: es.meta.description,
    body_es: es.text,
    title_ru: en.meta.title,
    description_ru: en.meta.description,
    body_ru: en.text,
    // Заметок редактора в документе статьи НЕТ намеренно: датасет публичный, и
    // всё, что лежит в опубликованной статье, читается любым через API. Заметки
    // живут в парном закрытом документе — см. buildReview().
  };
}

/**
 * Заметки редактора — отдельный документ типа newsReview, ТОЛЬКО черновик.
 *
 * По документации Sanity «neither drafts nor versions are served to
 * unauthenticated requests»: документ с префиксом `drafts.` виден лишь вошедшим
 * в Studio. Публиковать его нельзя — тогда он станет общедоступным, — поэтому
 * идентификатор всегда с `drafts.`, и конвейер публикаций этого типа не создаёт.
 *
 * Первая версия клала заметки в поле самой статьи, названное «внутренним».
 * Это ошибка: при публикации черновика редактором поле уезжало бы в публичный
 * API вместе со статьёй.
 */
export function buildReview(record, decision, doc, { now = new Date().toISOString() } = {}) {
  return {
    _id: `drafts.news-review-${record.id}`,
    _type: 'newsReview',
    title: doc.title_en,
    articleId: doc._id.replace(/^drafts\./, ''),
    mode: decision.publish ? 'published automatically' : 'draft for review',
    wouldAutoPublish: decision.eligible,
    // Адреса источников — ключ защиты от дублей: идентификатор события выводится из первой
    // ссылки и может смениться, а адрес остаётся. Лежат в закрытом документе, не в статье.
    sourceUrls: record.sources.map((s) => s.url),
    notes: reviewNotes(record, decision, MODE, now),
    createdAt: now,
  };
}

/** Мягкие замечания к мете: не блокируют, но попадают в вывод. */
function metaWarnings(doc) {
  const w = [];
  if (doc.title_en.length > 70) w.push(`заголовок EN ${doc.title_en.length} симв.`);
  if (doc.description_en.length > 160 || doc.description_en.length < 90) w.push(`описание EN ${doc.description_en.length} симв.`);
  if (doc.title_es.length > 70) w.push(`заголовок ES ${doc.title_es.length} симв.`);
  return w;
}

// ─────────────────────────────────────────────────────────────────────────

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET;
if (!projectId || !dataset) {
  console.error('Не заданы SANITY_PROJECT_ID и SANITY_DATASET.');
  process.exit(2);
}
if (WRITE && !process.env.SANITY_WRITE_TOKEN) {
  console.error('--write требует SANITY_WRITE_TOKEN (роль Editor). Сухой прогон токена не просит.');
  process.exit(2);
}

// SANITY_API_HOST нужен только самопроверке: она подменяет Sanity локальным моком.
const host = process.env.SANITY_API_HOST
  ? { apiHost: process.env.SANITY_API_HOST, useProjectHostname: false }
  : {};
/** Чтение публично и идёт без токена: слаги и разделы нужны и сухому прогону. */
const reader = createClient({ projectId, dataset, apiVersion: API_VERSION, useCdn: false, ...host });
const writer = WRITE
  ? createClient({ projectId, dataset, apiVersion: API_VERSION, useCdn: false, token: process.env.SANITY_WRITE_TOKEN, ...host })
  : null;
/** Для запросов по черновикам нужна перспектива raw: по умолчанию черновики не видны даже токену. */
const rawReader = WRITE
  ? createClient({ projectId, dataset, apiVersion: API_VERSION, useCdn: false, token: process.env.SANITY_WRITE_TOKEN, perspective: 'raw', ...host })
  : null;

if (!existsSync(DRAFTS)) {
  console.log('Нет .pipeline/drafts/ — доставлять нечего.');
  process.exit(0);
}

const files = readdirSync(DRAFTS).filter((f) => f.endsWith('.json')).sort();
const parsed = files.map((f) => ({ file: join(DRAFTS, f), record: JSON.parse(readFileSync(join(DRAFTS, f), 'utf8')) }));

/**
 * Записи прошлых прогонов (до появления eventMeta и разобранной меты) не
 * доставляем: у них нет данных, на которых политика принимает решение, а
 * `meta` лежит строкой. В свежем клоне Actions таких нет, но локально
 * `.pipeline/` переживает прогоны — падать на старом файле незачем.
 */
const isCurrent = ({ record }) => record.eventMeta && typeof record.en?.meta === 'object' && record.en.meta !== null;
const legacy = parsed.filter(({ record }) => record.live && !record.deliveredAt && !isCurrent({ record }));
for (const { record } of legacy) console.log(`  пропускаю запись прошлого формата: ${record.id}`);

const records = parsed.filter((x) => x.record.live && !x.record.deliveredAt && isCurrent(x));

console.log(`\nДоставка · режим ${MODE}${MODE === 'auto' ? ` (потолок ${MAX_PER_RUN} публикаций за прогон)` : ''} · ${WRITE ? 'ЗАПИСЬ В SANITY' : 'сухой прогон'}`);
console.log(`Записей к доставке: ${records.length}\n`);

const knownSections = new Set(
  (await reader.fetch(`*[_type == "section"]._id`)).map((id) => id.replace(/^section-/, '')));
for (const s of SECTIONS) {
  if (!knownSections.has(s)) {
    console.error(`В Sanity нет раздела section-${s}: политика и датасет разошлись, доставка остановлена.`);
    process.exit(1);
  }
}

const delivered = [];
let published = 0;
let failures = 0;

/**
 * ЛОГИ GITHUB ACTIONS ПУБЛИЧНЫ, как и репозиторий. Причины, по которым материал ушёл в черновик,
 * содержат имена людей, которых проверка пометила как рискованные, и цитаты из текста. В Actions
 * печатаем только коды причин; полный текст — локально и в закрытом документе newsReview.
 * Ревью перед запуском нашло эту утечку независимо у трёх рецензентов.
 */
const QUIET = Boolean(process.env.GITHUB_ACTIONS) && process.env.NEWS_VERBOSE_LOG !== '1';

async function deliverOne({ file, record }) {
  let decision = decide(record, MODE);

  // Потолок: лишнее, хоть и прошло гейты, уходит черновиком.
  if (decision.publish && published >= MAX_PER_RUN) {
    decision = { ...decision, publish: false,
      reasons: [{ code: 'cap', text: `потолок ${MAX_PER_RUN} публикаций за прогон исчерпан` }, ...decision.reasons] };
  }

  // Слаг уникален: при совпадении с чужим документом добавляем хвост события.
  let slug = record.en.meta.slug;
  const holder = await reader.fetch(
    `*[_type == "article" && slug.current == $slug && !(_id in [$pub, $draft])][0]._id`,
    { slug, pub: `news-${record.id}`, draft: `drafts.news-${record.id}` });
  if (holder) slug = `${slug}-${record.id.slice(0, 4)}`;

  const doc = buildDoc(record, decision, { slug });
  const warn = metaWarnings(doc);
  const kind = decision.publish ? 'ПУБЛИКАЦИЯ' : 'черновик';
  const codes = decision.reasons.filter((x) => x.code !== 'mode').map((x) => x.code);
  console.log(`  ${kind.padEnd(10)} ${QUIET && !decision.publish ? `${record.id} (заголовок скрыт в публичном логе)` : doc._id}`);
  // Название опубликованного материала публично и так; название черновика в публичный лог не идёт.
  if (!QUIET || decision.publish) console.log(`    ${doc.title_en}`);
  console.log(`    /${doc.section._ref.replace('section-', '')}/ · ${QUIET && !decision.publish ? '—' : slug} · ${doc.readingTime} мин · прошёл бы auto: ${decision.eligible ? 'да' : 'нет'}`);
  if (QUIET) { if (codes.length) console.log(`    ↳ коды: ${codes.join(', ')}`); }
  else for (const r of decision.reasons.filter((x) => x.code !== 'mode')) console.log(`    ↳ ${r.text}`);
  if (warn.length) console.log(`    ⚠ ${warn.join('; ')}`);

  const item = { id: record.id, sanityId: doc._id, as: kind, slug, eligible: decision.eligible, title: doc.title_en, codes, written: false, recorded: false };

  if (!WRITE) {
    mkdirSync(join(PIPE, 'delivery-preview'), { recursive: true });
    writeFileSync(join(PIPE, 'delivery-preview', `${record.id}.json`), JSON.stringify(doc, null, 1) + '\n');
    writeFileSync(join(PIPE, 'delivery-preview', `${record.id}.review.json`),
      JSON.stringify(buildReview(record, decision, doc), null, 1) + '\n');
    delivered.push(item);
    return;
  }

  // Уже доставлено? Сверяем по идентификатору и по адресам источников. Идентификатор события
  // выводится из первой ссылки кластера и может смениться, когда самая старая статья уйдёт из
  // окна сбора, — тогда одно событие превратилось бы во второй документ. Адреса не меняются.
  const urls = record.sources.map((s) => s.url);
  const prior = await rawReader.fetch(
    `*[_type == "newsReview" && count(sourceUrls[@ in $urls]) > 0][0]{ _id, articleId }`, { urls });
  const exists = (await writer.getDocument(doc._id))
    ?? (await writer.getDocument(`drafts.news-${record.id}`))
    ?? (await writer.getDocument(`news-${record.id}`));
  if (prior || exists) {
    console.log(`    = уже доставлено${prior ? ` (${QUIET ? 'по адресам источников' : prior.articleId})` : ''}, не перезаписываю`);
  } else {
    // Сначала заметки, потом статья: черновик без причины редактору нечем проверять.
    await writer.createIfNotExists(buildReview(record, decision, doc));
    await writer.createIfNotExists(doc);
    if (decision.publish) published++;
  }
  record.deliveredAt = new Date().toISOString();
  record.deliveredAs = decision.publish ? 'published' : 'draft';
  record.sanityId = prior?.articleId ?? doc._id;
  writeFileSync(file, JSON.stringify(record, null, 1) + '\n');
  // `recorded` — событие в Sanity есть (записано сейчас или раньше), его надо занести в журнал.
  // Раньше в журнал шло только свежезаписанное: при сбое между записью и коммитом журнала то же
  // событие на следующий день генерировалось заново и каждый раз оплачивалось.
  delivered.push({ ...item, written: !(prior || exists), recorded: true });
}

try {
  for (const rec of records) {
    // Сбой одной записи не должен ронять доставку остальных и скрывать, что уже записано.
    try { await deliverOne(rec); } catch (e) {
      failures++;
      console.log(`    ✗ ошибка доставки ${rec.record.id}: ${String(e.message ?? e).slice(0, 160)}`);
    }
  }
} finally {
  // Всё, что нужно следующим шагам, пишется даже при исключении: они опираются на эти файлы.
  mkdirSync(PIPE, { recursive: true });
  writeFileSync(join(PIPE, 'delivered.json'), JSON.stringify(delivered, null, 1) + '\n');
  // Публичная версия: без заголовков черновиков и без причин словами. Её и выкладываем артефактом.
  writeFileSync(join(PIPE, 'delivered.public.json'), JSON.stringify(delivered.map((d) => ({
    id: d.id, as: d.as, eligible: d.eligible, written: d.written, recorded: d.recorded, codes: d.codes,
    ...(d.as === 'ПУБЛИКАЦИЯ' ? { slug: d.slug, title: d.title } : {}),
  })), null, 1) + '\n');

  const nPub = delivered.filter((d) => d.as === 'ПУБЛИКАЦИЯ' && d.written).length;
  const nDraft = delivered.filter((d) => d.as === 'черновик' && d.written).length;
  console.log(`\nИтог: опубликовано ${nPub}, черновиков ${nDraft}${failures ? `, ошибок ${failures}` : ''}${WRITE ? '' : ' (сухой прогон, ничего не записано)'}`);

  if (process.env.GITHUB_OUTPUT && WRITE) {
    appendFileSync(process.env.GITHUB_OUTPUT,
      `ids=${delivered.filter((d) => d.recorded).map((d) => d.id).join(' ')}\npublished=${nPub}\ndrafts=${nDraft}\n`);
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    // Сводка прогона публична: у черновиков без заголовков и без текстовых причин.
    const rows = delivered.map((d) =>
      `| ${d.as} | ${d.written ? 'записано' : WRITE ? 'уже было' : 'сухой'} | ${d.eligible ? 'да' : 'нет'} | ${
        d.as === 'ПУБЛИКАЦИЯ' ? d.title.replace(/\|/g, '\\|') : `\`${d.id}\` ${d.codes.join(', ')}`} |`);
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, [
      `### Доставка · режим \`${MODE}\``, '',
      `Опубликовано **${nPub}**, черновиков **${nDraft}**${failures ? `, ошибок **${failures}**` : ''}.`, '',
      '| Куда | Статус | Прошёл бы auto | Заголовок / причины |', '|---|---|---|---|', ...rows, '',
    ].join('\n'));
  }
}
process.exit(failures ? 1 : 0);
