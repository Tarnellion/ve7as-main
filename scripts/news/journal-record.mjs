#!/usr/bin/env node
/**
 * Занесение события в журнал опубликованного.
 *
 * Отдельный шаг, а не часть кластеризации, и это принципиально. Кластеризатор
 * ПРЕДЛАГАЕТ события; в журнал попадает только то, что одобрил владелец. Если
 * записывать на этапе предложения, журнал начнёт глушить темы, которые мы
 * рассмотрели и решили не брать, — и вторая, уже стоящая новость по тому же
 * сюжету будет молча отброшена как «уже выходило».
 *
 *   node scripts/news/journal-record.mjs a1b2c3d4e5f6 [ещё id...]
 *   node scripts/news/journal-record.mjs --all-publishable   # прогон целиком
 *   node scripts/news/journal-record.mjs --stats
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadJournal, saveJournal, pruneJournal, JOURNAL_PATH } from './journal.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const EVENTS = join(HERE, '..', '..', '.pipeline', 'events.json');
const args = process.argv.slice(2);

const journal = loadJournal();

if (args.includes('--stats') || args.length === 0) {
  const withVec = journal.entries.filter((e) => e.vectors?.length).length;
  console.log(`Журнал: ${JOURNAL_PATH}`);
  console.log(`  записей:          ${journal.entries.length}`);
  console.log(`  с вектором:       ${withVec}  (окно ${journal.dedupWindowDays} сут)`);
  console.log(`  обновлён:         ${journal.updatedAt ?? '—'}`);
  if (journal.entries.length) {
    console.log('\n  последние:');
    for (const e of journal.entries.slice(-5)) {
      console.log(`    ${e.publishedAt?.slice(0, 10)}  ${e.voices} гол.  ${e.title.slice(0, 64)}`);
    }
  }
  process.exit(0);
}

if (!existsSync(EVENTS)) {
  console.error('Нет .pipeline/events.json — сначала запустите cluster.mjs.');
  process.exit(1);
}
const { events } = JSON.parse(readFileSync(EVENTS, 'utf8'));

const wanted = args.includes('--all-publishable')
  ? events.filter((e) => e.publishable)
  : events.filter((e) => args.includes(e.id));

const missing = args.includes('--all-publishable')
  ? [] : args.filter((a) => !a.startsWith('--') && !events.some((e) => e.id === a));
if (missing.length) {
  console.error(`Не найдены в events.json: ${missing.join(', ')}`);
  process.exit(1);
}

const already = new Set(journal.entries.map((e) => e.id));
let added = 0, skipped = 0;
for (const e of wanted) {
  if (already.has(e.id)) { skipped++; continue; }
  journal.entries.push({
    id: e.id,
    publishedAt: new Date().toISOString(),
    title: e.title,
    lang: e.lang,
    voices: e.voices,
    groups: e.confirmingGroups,
    sources: e.members.map((m) => ({ source: m.source, url: m.url })),
    centroid: e.centroid,
    // Векторы участников, а не только центроид: без них сверка с журналом
    // не сможет повторить проверку связности и начнёт глушить чужие события
    // из той же темы. Выбрасываются при выходе окна дедупа.
    vectors: e.vectors,
  });
  added++;
}

const pruned = pruneJournal(journal);
saveJournal(journal);

console.log(`занесено ${added}, уже было ${skipped}`);
if (pruned) console.log(`у ${pruned} записей вышло окно дедупа — вектор убран, запись оставлена`);
console.log(`всего в журнале: ${journal.entries.length}`);
