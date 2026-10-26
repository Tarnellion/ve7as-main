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
  const known = matchKnown(journal, c.vecs);
  const isKnown = known?.same === true;

  return {
    id: createHash('sha256').update(seed.urlHash).digest('hex').slice(0, 12),
    verdict,
    publishable: (verdict === 'confirmed' || verdict === 'regulator-primary') && !isKnown,
    known: isKnown
      ? { id: known.entry.id, title: known.entry.title, score: Number(known.score.toFixed(4)) }
      : null,
    nearestKnown: known
      ? { title: known.entry.title, score: Number(known.score.toFixed(4)), worst: Number(known.worst.toFixed(4)) }
      : null,
    firstSeen: seed.pubDate,
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

// Сначала подтверждённые, внутри — по числу независимых групп, затем по свежести.
events.sort((a, b) =>
  Number(b.publishable) - Number(a.publishable) ||
  b.voices - a.voices ||
  (b.firstSeen ?? '').localeCompare(a.firstSeen ?? ''));

const count = (v) => events.filter((e) => e.verdict === v).length;
const publishable = events.filter((e) => e.publishable);
const days = JSON.parse(readFileSync(join(PIPE, 'candidates.json'), 'utf8')).days ?? 7;

console.log(`  кластеров:                  ${events.length}`);
console.log(`    подтверждено (2+ группы): ${count('confirmed')}`);
console.log(`    первичка регулятора:      ${count('regulator-primary')}`);
console.log(`    синдикация, один голос:   ${count('syndicated-single')}`);
console.log(`    один источник:            ${count('single-source')}`);
console.log(`    только пресс-релиз:       ${count('press-release-only')}`);
console.log(`  уже в журнале:              ${events.filter((e) => e.known).length}`);
console.log(`  к публикации:               ${publishable.length}  (${(publishable.length / days).toFixed(1)} в сутки)`);

mkdirSync(PIPE, { recursive: true });
writeFileSync(join(PIPE, 'events.json'), JSON.stringify({
  at: new Date().toISOString(), harvestedAt, threshold: CLUSTER_THRESHOLD,
  candidates: candidates.length, clusters: events.length, events,
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

**К публикации: ${publishable.length}** (${(publishable.length / days).toFixed(1)} в сутки).
Подтверждено двумя голосами ${count('confirmed')}, первичка регулятора ${count('regulator-primary')},
синдикация ${count('syndicated-single')}, один источник ${count('single-source')},
только пресс-релиз ${count('press-release-only')}.

Подтверждение считается по группам независимости, а не по лентам: четыре ленты
SBC дают один голос. Пресс-релизы в подтверждение не засчитываются.

## К публикации

${publishable.map(block).join('\n') || '_Нет событий, набравших подтверждение._'}

## Отклонено

${events.filter((e) => !e.publishable).slice(0, 40).map(block).join('\n')}
`);

console.log(`\n  события: .pipeline/events.json`);
console.log(`  отчёт:   .pipeline/events-report.md`);
