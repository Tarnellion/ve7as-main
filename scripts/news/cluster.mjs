#!/usr/bin/env node
/**
 * Ступень 2 каскада плюс правило подтверждения: корпус кандидатов → события.
 *
 * Делает ровно три вещи, и только третья из них про публикацию:
 *   1. сводит кандидатов в КЛАСТЕРЫ по смыслу (эмбеддинги, порог 0.90);
 *   2. считает, сколько НЕЗАВИСИМЫХ групп подтверждают каждое событие;
 *   3. сверяет событие с журналом — не писали ли мы об этом раньше.
 *
 * Ничего не публикует, не ходит в CMS, не зовёт LLM и не требует токенов.
 * На выходе `.pipeline/events.json` и отчёт для глазной проверки владельцем.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { embedTexts, embedText, cosine, centroidOf, quantize, quantizationError } from './embedding.mjs';
import { loadJournal, matchKnown } from './journal.mjs';
import { assess } from './newsworthiness.mjs';
import { SAME_EVENT, COHESION_FLOOR as FLOOR } from './thresholds.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PIPE = join(HERE, '..', '..', '.pipeline');

/**
 * Пороги живут в thresholds.mjs: их нельзя менять по одному, они описывают
 * одну геометрию и перемеряются вместе. Переопределение из среды оставлено
 * для экспериментов — в проде обе переменные не выставляются.
 */
const CLUSTER_THRESHOLD = Number(process.env.CLUSTER_THRESHOLD ?? SAME_EVENT);
const COHESION_FLOOR = Number(process.env.COHESION_FLOOR ?? FLOOR);

const { sources } = JSON.parse(readFileSync(join(HERE, 'sources.json'), 'utf8'));
const SOURCE_TYPE = new Map(sources.map((s) => [s.independenceGroup, s.sourceType]));
const GROUP_SOLE_OK = new Map();
for (const s of sources) {
  // Группа теряет право быть единственной, если хотя бы одна её лента его лишена.
  GROUP_SOLE_OK.set(s.independenceGroup, (GROUP_SOLE_OK.get(s.independenceGroup) ?? true) && s.soleSourceAllowed);
}

/** Нормализация заголовка: регистр, пунктуация, пробелы. Та же, что в harvest.mjs. */
const normTitle = (t) =>
  t.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();

const { candidates, at: harvestedAt } = JSON.parse(readFileSync(join(PIPE, 'candidates.json'), 'utf8'));
console.log(`Кластеризация ${candidates.length} кандидатов, порог ${CLUSTER_THRESHOLD}\n`);

// Хронологический порядок: кластер засевает тот, кто сообщил первым, и
// остальные пристраиваются к нему. При произвольном порядке «первоисточником»
// события в отчёте оказывался бы случайный перепечатчик.
const items = [...candidates].sort((a, b) =>
  (a.pubDate ?? '').localeCompare(b.pubDate ?? ''));

const vecs = await embedTexts(items.map((c) => embedText(c.title, c.lead)), {
  onProgress: (n, total) => process.stdout.write(`\r  посчитано ${n}/${total}`),
});
console.log(`\n  измерений: ${vecs[0].length}`);

// Проверка, что хранение не ломает порог: вектор едет в документ как int8,
// и если квантование сдвигает косинус сильнее запаса над фоном, хранить его
// так нельзя. Измеряем, а не предполагаем.
const qErr = vecs.map(quantizationError);
const qMax = Math.max(...qErr);
console.log(`  потеря на квантовании int8: максимум ${qMax.toFixed(5)}, среднее ${(qErr.reduce((a, b) => a + b, 0) / qErr.length).toFixed(5)}\n`);

// ── Кластеризация по центроидам ───────────────────────────────────────────
// Центроид, а не одиночная связь: при single-link цепочка A~B, B~C при A≁C
// склеивает в один кластер всю тему. Центроид сдвигается к середине кластера
// и такую цепочку обрывает.
const clusters = [];
for (let i = 0; i < items.length; i++) {
  let best = null;
  for (const c of clusters) {
    const s = cosine(vecs[i], c.centroid);
    if (s < CLUSTER_THRESHOLD) continue;
    // Полная связь: кандидат обязан быть близок КО ВСЕМ участникам, а не только
    // к их среднему. Именно это обрывает дрейф центроида.
    let worst = 1;
    for (const v of c.vecs) worst = Math.min(worst, cosine(vecs[i], v));
    if (worst < COHESION_FLOOR) continue;
    if (!best || s > best.s) best = { c, s };
  }
  if (best) {
    best.c.members.push(i);
    best.c.vecs.push(vecs[i]);
    best.c.centroid = centroidOf(best.c.vecs);
  } else {
    clusters.push({ members: [i], vecs: [vecs[i]], centroid: vecs[i] });
  }
}

// ── Правило подтверждения ─────────────────────────────────────────────────
/**
 * Считаем ГРУППЫ, а не ленты: четыре ленты SBC — один издатель и один голос.
 *
 * Пресс-релизы в подтверждение НЕ засчитываются вовсе. Релиз — это компания,
 * говорящая о себе; он первоисточник факта, но не независимое его
 * подтверждение, и два «источника», один из которых релиз, а второй —
 * издание, перепечатавшее этот же релиз, независимости не дают.
 *
 * Единственным источником разрешено быть регулятору: решение MGA или UKGC —
 * первичный документ, подтверждать его вторым изданием нечем и незачем.
 *
 * Поле `soleSourceAllowed` используется только как ЗАПРЕТ. В данных оно стоит
 * `true` у всех редакционных лент, то есть шире, чем правило, которое мы
 * применяем; полагаться на его истинное значение значило бы разрешить выпуск
 * по одному изданию. Запретительное `false` у пресс-релизов однозначно.
 */
const journal = loadJournal();
const events = clusters.map((c) => {
  const members = c.members.map((i) => items[i]);
  const groups = [...new Set(members.map((m) => m.group))];
  const confirming = groups.filter(
    (g) => SOURCE_TYPE.get(g) !== 'press-release' && GROUP_SOLE_OK.get(g) !== false);

  /**
   * Синдикация не создаёт независимости.
   *
   * Две ленты разных издателей могут перепечатать ОДНУ вендорскую заметку
   * слово в слово. Формально это две группы, фактически — один голос, и
   * правило двух источников на таком событии не выполняется, а выглядит
   * выполненным. В корпусе 26.10.2026 так прошёл анонс «RedCore at SiGMA
   * World 2026»: заголовок совпал дословно, косинус 0.991.
   *
   * Признак — ТОЧНОЕ совпадение нормализованного заголовка у материалов из
   * разных групп. Высокое, но неточное совпадение признаком не считается:
   * «Three sentenced over 2024 UK general election betting scandal» и
   * «Three sentenced over bets on 2024 General Election date» пересекаются на
   * две трети слов, но это два самостоятельных репортажа с одного суда.
   *
   * Совпавшие группы схлопываются в один голос через объединение множеств.
   */
  const parent = new Map(confirming.map((g) => [g, g]));
  const find = (g) => { while (parent.get(g) !== g) { parent.set(g, parent.get(parent.get(g))); g = parent.get(g); } return g; };
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const [a, b] = [members[i].group, members[j].group];
      if (a === b || !parent.has(a) || !parent.has(b)) continue;
      if (normTitle(members[i].title) !== normTitle(members[j].title)) continue;
      const [ra, rb] = [find(a), find(b)];
      if (ra !== rb) parent.set(ra, rb);
    }
  }
  const voices = [...new Set(confirming.map(find))];
  const syndicated = voices.length < confirming.length;
  const regulators = confirming.filter((g) => SOURCE_TYPE.get(g) === 'regulator');

  // Разброс внутри кластера: нижняя пара — та самая величина, по которой
  // отличаются склейки по теме. В отчёт идёт как признак для редактора.
  let minPair = 1;
  for (let i = 0; i < c.vecs.length; i++)
    for (let j = i + 1; j < c.vecs.length; j++) minPair = Math.min(minPair, cosine(c.vecs[i], c.vecs[j]));

  let verdict;
  if (voices.length >= 2) verdict = 'confirmed';
  else if (regulators.length === 1) verdict = 'regulator-primary';
  else if (voices.length === 1) verdict = 'syndicated-single';
  else if (confirming.length >= 1) verdict = 'single-source';
  else verdict = 'press-release-only';
  if (verdict === 'syndicated-single' && !syndicated) verdict = 'single-source';

  const seed = members[0];
  // Значимость оценивается по затравке кластера — первому сообщению о событии.
  const sense = assess(seed.title, seed.lead);
  const known = matchKnown(journal, c.vecs);
  const isKnown = known?.same === true;
  const confirmed = (verdict === 'confirmed' || verdict === 'regulator-primary') && !isKnown;

  return {
    id: createHash('sha256').update(seed.urlHash).digest('hex').slice(0, 12),
    verdict,
    // Два РАЗНЫХ решения, и смешивать их нельзя. `publishable` — про
    // подтверждение: событие доказано двумя независимыми голосами или
    // первичным документом регулятора. `queue` — про то, стоит ли оно
    // публикации вообще. Анонс выставки бывает безупречно подтверждён.
    publishable: confirmed,
    queue: confirmed && sense.newsworthy,
    newsworthy: sense.newsworthy,
    filterReason: sense.reason,
    known: isKnown
      ? { id: known.entry.id, title: known.entry.title, score: Number(known.score.toFixed(4)) }
      : null,
    nearestKnown: known
      ? { title: known.entry.title, score: Number(known.score.toFixed(4)), worst: Number(known.worst.toFixed(4)) }
      : null,
    // Минимум по непустым датам, а не дата seed: запись без даты сортируется первой, становится seed и обнуляла firstSeen
    // всему кластеру, из-за чего гейт даты молчал (ревью 27.10.2026).
    firstSeen: members.map((m) => m.pubDate).filter(Boolean).sort()[0] ?? null,
    title: seed.title,
    lang: seed.lang,
    groups,
    confirmingGroups: confirming,
    voices: voices.length,
    syndicated,
    minPair: c.vecs.length > 1 ? Number(minPair.toFixed(4)) : null,
    centroid: quantize(c.centroid),
    vectors: c.vecs.map(quantize),
    members: members.map((m) => ({
      source: m.source, group: m.group, sourceType: m.sourceType,
      title: m.title, url: m.canonicalUrl, pubDate: m.pubDate, bodyLen: m.bodyLen,
    })),
  };
});

/**
 * Возможные дубли МЕЖДУ событиями: центроиды сошлись, а связность не дотянула
 * до пола, поэтому кластеризация их не склеила.
 *
 * Это не ошибка порога, а его предел, и подкручивать его нельзя. Измерено
 * 26.10.2026: нидерландское сообщение KSA о штрафе в 37 млн и английские
 * публикации о нём же имеют нижнюю пару 0.865 — то есть это ОДНО событие,
 * не прошедшее пол 0.88. Но пара «иск Kalshi к Луизиане / решение суда
 * Иллинойса» — РАЗНЫЕ события — имеет 0.873, а «KSA / L&L Europe», тоже
 * разные, 0.860. Значение, которое склеило бы кросс-языковую пару, склеило бы
 * и чужие события: диапазоны перекрываются, векторами они не разделяются.
 *
 * Разделяют их совпадающие числа и имена («37 million» и «37 miljoen»,
 * «EOD Code»), то есть ступень извлечения фактов. Пока её нет, решение о
 * склейке остаётся прежним, а пары просто показываются редактору рядом:
 * ложный дубль в отчёте стоит одного взгляда, ложная склейка — выпущенной
 * новости, слепившей два события.
 */
const nearDuplicates = [];
for (let i = 0; i < clusters.length; i++) {
  if (!events[i].queue) continue;
  for (let j = i + 1; j < clusters.length; j++) {
    if (!events[j].queue) continue;
    const score = cosine(clusters[i].centroid, clusters[j].centroid);
    if (score < CLUSTER_THRESHOLD) continue;
    let worst = 1;
    for (const a of clusters[i].vecs) for (const b of clusters[j].vecs) worst = Math.min(worst, cosine(a, b));
    nearDuplicates.push({
      score: Number(score.toFixed(4)), worst: Number(worst.toFixed(4)),
      a: { id: events[i].id, lang: events[i].lang, title: events[i].title },
      b: { id: events[j].id, lang: events[j].lang, title: events[j].title },
      crossLanguage: events[i].lang !== events[j].lang,
    });
  }
}
nearDuplicates.sort((x, y) => y.score - x.score);

// Сначала подтверждённые, внутри — по числу независимых групп, затем по свежести.
events.sort((a, b) =>
  Number(b.queue) - Number(a.queue) ||
  Number(b.publishable) - Number(a.publishable) ||
  b.voices - a.voices ||
  (b.firstSeen ?? '').localeCompare(a.firstSeen ?? ''));

const count = (v) => events.filter((e) => e.verdict === v).length;
const publishable = events.filter((e) => e.publishable);
const queue = events.filter((e) => e.queue);
const screened = events.filter((e) => e.publishable && !e.newsworthy);
const days = JSON.parse(readFileSync(join(PIPE, 'candidates.json'), 'utf8')).days ?? 7;

console.log(`  кластеров:                  ${events.length}`);
console.log(`    подтверждено (2+ группы): ${count('confirmed')}`);
console.log(`    первичка регулятора:      ${count('regulator-primary')}`);
console.log(`    синдикация, один голос:   ${count('syndicated-single')}`);
console.log(`    один источник:            ${count('single-source')}`);
console.log(`    только пресс-релиз:       ${count('press-release-only')}`);
console.log(`  уже в журнале:              ${events.filter((e) => e.known).length}`);
console.log(`  подтверждено к выпуску:     ${publishable.length}`);
console.log(`    отсеяно как анонс:        ${screened.length}`);
console.log(`  В ОЧЕРЕДЬ:                  ${queue.length}  (${(queue.length / days).toFixed(1)} в сутки)`);
if (nearDuplicates.length) {
  const x = nearDuplicates.filter((n) => n.crossLanguage).length;
  console.log(`  возможные дубли в выдаче:   ${nearDuplicates.length}${x ? `, из них межъязыковых ${x}` : ''} — требуют взгляда редактора`);
}

mkdirSync(PIPE, { recursive: true });
writeFileSync(join(PIPE, 'events.json'), JSON.stringify({
  at: new Date().toISOString(), harvestedAt, threshold: CLUSTER_THRESHOLD,
  candidates: candidates.length, clusters: events.length, nearDuplicates, events,
}, null, 2));

const block = (e) => {
  const head = `### ${e.title}\n\n` +
    `- вердикт: **${e.verdict}**${e.known ? ` · уже выходило: «${e.known.title}» (${e.known.score})` : ''}\n` +
    `- независимых голосов: ${e.voices} из групп ${e.confirmingGroups.join(', ') || '—'}` +
    `${e.syndicated ? ' · **синдикация: группы схлопнуты**' : ''}\n` +
    `- нижняя пара в кластере: ${e.minPair ?? '—'}\n` +
    `- первое упоминание: ${e.firstSeen ?? '—'}\n\n`;
  const rows = e.members.map((m) => `| ${m.source} | ${m.sourceType} | ${m.bodyLen} | [ссылка](${m.url}) |`).join('\n');
  return head + `| лента | тип | знаков | материал |\n|---|---|---:|---|\n${rows}\n`;
};

writeFileSync(join(PIPE, 'events-report.md'),
`# События из корпуса — ${new Date().toISOString()}

Корпус собран ${harvestedAt}, окно ${days} суток, ${candidates.length} кандидатов.
Порог склейки ${CLUSTER_THRESHOLD}, пол связности ${COHESION_FLOOR}.
Сверка с журналом идёт по тому же правилу: совпадением считается то, что
склеилось бы в один кластер, попади оба события в один корпус.

**В очередь: ${queue.length}** (${(queue.length / days).toFixed(1)} в сутки) — подтверждено ${publishable.length}, из них отсеяно фильтром значимости ${screened.length}.
Подтверждено двумя голосами ${count('confirmed')}, первичка регулятора ${count('regulator-primary')},
синдикация ${count('syndicated-single')}, один источник ${count('single-source')},
только пресс-релиз ${count('press-release-only')}.

Подтверждение считается по группам независимости, а не по лентам: четыре ленты
SBC дают один голос. Пресс-релизы в подтверждение не засчитываются.

## Отсеяно фильтром значимости

Эти события правило подтверждения прошли, но выглядят корпоративным анонсом, а
не новостью. Они НЕ удалены: фильтр настроен на уверенное отбрасывание, и если
он ошибся, это видно здесь.

${screened.length ? screened.map((e) =>
  `- _${e.filterReason}_ · ${e.voices} гол. [${e.confirmingGroups.join(', ')}]\n  ${e.title}`).join('\n')
  : '_Нет._'}

## Возможные дубли — проверить глазами

Пары событий, чьи центроиды сошлись выше порога, но связность не дотянула до
пола, поэтому они НЕ склеены. Решение остаётся за редактором: если это одно
событие, брать надо одно из них.

${nearDuplicates.length ? nearDuplicates.map((n) =>
  `- **${n.score}** (нижняя пара ${n.worst})${n.crossLanguage ? ' · **разные языки**' : ''}\n` +
  `  - [${n.a.lang}] ${n.a.title}\n  - [${n.b.lang}] ${n.b.title}`).join('\n')
  : '_Нет._'}

## В очередь

${queue.map(block).join('\n') || '_Нет событий, набравших подтверждение._'}

## Отклонено

${events.filter((e) => !e.publishable).slice(0, 40).map(block).join('\n')}
`);

console.log(`\n  события: .pipeline/events.json`);
console.log(`  отчёт:   .pipeline/events-report.md`);
