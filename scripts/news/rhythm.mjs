#!/usr/bin/env node
/**
 * Профиль ритма текста — главный проверяемый признак машинности.
 *
 * Запрет-лист слов (style/banned.json) на реальных текстах Ve7as даёт ноль
 * срабатываний: штампы оттуда вычищены. А вот ритм выдаёт генерацию раньше,
 * чем читатель дошёл до смысла — ровные абзацы по три-четыре предложения
 * видны как узор на странице.
 *
 * Пороги ИЗМЕРЕНЫ 26.10.2026 на одобренных текстах, а не выбраны:
 *
 *   wagering-explained.en.md (глубокая статья)  CV 0.45, однопредл. 26 %
 *   casino-slots.en.md       (служебный хаб)    CV 0.35, однопредл. 17 %
 *   sports-betting.en.md     (служебный хаб)    CV 0.29, однопредл. 10 %
 *
 * Закономерность: лучший текст — самый неровный. Отсюда floor 0.40 и 20 %,
 * то есть «не хуже, чем материал, который редакция признала хорошим».
 *
 * Калибровка на трёх текстах слабая. Пересчитать на десяти, когда редакция
 * их напишет: `node scripts/news/rhythm.mjs <файлы>`.
 */
import { readFileSync } from 'node:fs';

/** Минимальный коэффициент вариации длин абзацев (σ / среднее). */
export const CV_FLOOR = 0.4;
/** Минимальная доля абзацев ровно из одного предложения. */
export const SINGLE_FLOOR = 0.2;
/** Короче этого текст не оценивается: на трёх абзацах разброс — шум. */
export const MIN_PARAGRAPHS = 6;

/**
 * Абзацы прозы. Выкидываем фронтматтер, HTML-комментарии, блоки кода,
 * заголовки, списки и цитаты: их длина к ритму чтения отношения не имеет,
 * а в тексте с таблицей они бы растворили настоящий разброс.
 */
export function paragraphs(md) {
  return md
    .replace(/^---[\s\S]*?---/m, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p && !/^[#>|\-*\d]/.test(p));
}

/** Предложения в абзаце: точка, восклицательный или вопросительный перед пробелом или концом. */
const sentences = (p) => (p.match(/[.!?](\s|$)/g) ?? []).length || 1;

export function rhythm(md) {
  const ps = paragraphs(md);
  const counts = ps.map(sentences);
  const n = counts.length;
  if (!n) return { paragraphs: 0, mean: 0, sd: 0, cv: 0, singleShare: 0, counts: [] };
  const mean = counts.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(counts.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
  return {
    paragraphs: n,
    mean,
    sd,
    cv: mean ? sd / mean : 0,
    singleShare: counts.filter((c) => c === 1).length / n,
    counts,
    words: Math.round(ps.reduce((a, p) => a + p.split(/\s+/).length, 0) / n),
  };
}

/**
 * Вердикт плюс КОНКРЕТНОЕ замечание. Просьба «написать живее» модели не
 * помогает — она не знает, какие именно абзацы ровные. Поэтому возвращаем
 * самую длинную цепочку абзацев одинаковой длины: её и нужно разбить.
 */
export function checkRhythm(md) {
  const r = rhythm(md);
  const issues = [];
  if (r.paragraphs < MIN_PARAGRAPHS) {
    return { ok: true, skipped: true, reason: `абзацев ${r.paragraphs}, меньше ${MIN_PARAGRAPHS} — не оцениваем`, ...r };
  }
  if (r.cv < CV_FLOOR) issues.push(`коэффициент вариации ${r.cv.toFixed(2)} ниже ${CV_FLOOR}`);
  if (r.singleShare < SINGLE_FLOOR)
    issues.push(`однопредложенных абзацев ${(r.singleShare * 100).toFixed(0)} %, нужно от ${SINGLE_FLOOR * 100} %`);

  let runStart = 0, best = { from: 0, len: 1 };
  for (let i = 1; i <= r.counts.length; i++) {
    if (i === r.counts.length || r.counts[i] !== r.counts[runStart]) {
      if (i - runStart > best.len) best = { from: runStart, len: i - runStart };
      runStart = i;
    }
  }
  const hint = best.len >= 3
    ? `абзацы ${Array.from({ length: best.len }, (_, k) => best.from + k + 1).join(', ')} одной длины (${r.counts[best.from]} предл.) — разбей или слей`
    : null;

  return { ok: issues.length === 0, issues, hint, ...r };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error('укажите файлы: node scripts/news/rhythm.mjs <*.md>');
    process.exit(2);
  }
  const rows = files.map((f) => {
    const c = checkRhythm(readFileSync(f, 'utf8'));
    return {
      файл: f.split('/').pop(),
      абзацев: c.paragraphs,
      'предл/абз': c.mean.toFixed(1),
      CV: c.cv.toFixed(2),
      'однопредл': `${Math.round(c.singleShare * 100)} %`,
      'слов/абз': c.words,
      вердикт: c.skipped ? 'коротко' : c.ok ? 'ок' : 'ниже порога',
    };
  });
  console.table(rows);
  for (const f of files) {
    const c = checkRhythm(readFileSync(f, 'utf8'));
    if (!c.ok && c.hint) console.log(`${f.split('/').pop()}: ${c.hint}`);
  }
}
