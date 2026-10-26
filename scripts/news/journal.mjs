/**
 * Журнал опубликованного: ступень 3 каскада.
 *
 * Ступени 0-2 отвечают на вопрос «не дубль ли эти кандидаты друг другу
 * ВНУТРИ одного прогона». Журнал отвечает на другой, и без него конвейер
 * обязан ошибаться: «не писали ли мы об этом на прошлой неделе».
 *
 * Без журнала событие, которое издания догоняют три дня подряд, выходит у нас
 * трижды. Это ровно то, что Google называет scaled content abuse.
 *
 * ГДЕ ЭТО БУДЕТ ЖИТЬ. Сейчас журнал — файл в репозитории, потому что
 * опубликованных новостей ещё нет, а схема Sanity (заход 2) ещё не несёт поля
 * под вектор. После захода 2 источником истины становится Sanity: векторы
 * ложатся на сам документ новости, журнал перестаёт быть отдельным состоянием
 * и собирается одним GROQ-запросом. Форма записи ниже выбрана так, чтобы при
 * этой замене менялся только загрузчик. Держать оба хранилища одновременно
 * нельзя: два источника истины о том, что уже вышло, рано или поздно разойдутся.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { cosine, dequantize, centroidOf } from './embedding.mjs';
import { SAME_EVENT, COHESION_FLOOR, DEDUP_WINDOW_DAYS } from './thresholds.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const JOURNAL_PATH = join(HERE, 'state', 'journal.json');

export function loadJournal() {
  if (!existsSync(JOURNAL_PATH)) {
    return { version: 2, updatedAt: null, dedupWindowDays: DEDUP_WINDOW_DAYS, entries: [] };
  }
  return JSON.parse(readFileSync(JOURNAL_PATH, 'utf8'));
}

export function saveJournal(journal) {
  mkdirSync(dirname(JOURNAL_PATH), { recursive: true });
  journal.updatedAt = new Date().toISOString();
  writeFileSync(JOURNAL_PATH, JSON.stringify(journal, null, 2) + '\n');
}

/**
 * Чистка: у записей старше окна выбрасываются векторы, сама запись остаётся.
 *
 * Запись нужна навсегда — это след того, что мы публиковали, и по нему
 * восстанавливается история темы. Векторы нужны только пока работает
 * сравнение, и они же занимают почти весь объём записи.
 */
export function pruneJournal(journal, now = Date.now()) {
  const cutoff = now - journal.dedupWindowDays * 86_400_000;
  let dropped = 0;
  for (const e of journal.entries) {
    if (e.vectors && new Date(e.publishedAt).getTime() < cutoff) {
      delete e.vectors;
      delete e.centroid;
      dropped++;
    }
  }
  return dropped;
}

/**
 * Совпадает ли новое событие с уже опубликованным.
 *
 * ИНВАРИАНТ: ответ обязан совпадать с тем, который дала бы кластеризация,
 * попади оба события в один корпус. Поэтому проверка повторяет её целиком —
 * близость центроидов И полная связь между всеми парами участников.
 *
 * Сверка одних центроидов, как было в первой версии, систематически врёт в
 * сторону ложного подавления. Центроид многочастного события лежит в середине
 * своей темы, и чужое событие из той же темы в него попадает. Измерено
 * 26.10.2026 на 18 занесённых событиях: из шести дополнительных совпадений
 * пять оказались ложными — иск Kalshi к Луизиане «совпал» с решением суда
 * Иллинойса по Kalshi на 0.926, квартальный отчёт Betsson — с отчётом
 * Evolution на 0.902. Поднять порог нельзя: верное совпадение (приговоры по
 * ставкам на выборы, 0.924) лежит НИЖЕ ложного, диапазоны перекрываются.
 * Разделяет их не порог, а связность.
 *
 * Возвращает лучшее совпадение всегда, с флагом `same`: решение принимает
 * вызывающий код, а отчёту нужен и ближний промах — 0.89 на границе это
 * сигнал редактору, а не шум.
 */
export function matchKnown(journal, vecs) {
  const centroid = centroidOf(vecs);
  let best = null;
  for (const e of journal.entries) {
    if (!e.vectors?.length) continue;
    const known = e.vectors.map(dequantize);
    const score = cosine(centroid, centroidOf(known));
    let worst = 1;
    for (const a of vecs) for (const b of known) worst = Math.min(worst, cosine(a, b));
    const same = score >= SAME_EVENT && worst >= COHESION_FLOOR;
    if (!best || same > best.same || (same === best.same && score > best.score)) {
      best = { entry: e, score, worst, same };
    }
  }
  return best;
}

export function appendEntry(journal, entry) {
  journal.entries.push(entry);
  return journal;
}

export { SAME_EVENT, COHESION_FLOOR, DEDUP_WINDOW_DAYS };
