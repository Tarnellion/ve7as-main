#!/usr/bin/env node
/**
 * Постпроцессор ступени 3: механические проверки готового текста.
 *
 * Делит работу с моделью по принципу «что можно посчитать — считаем кодом».
 * Критик-модель ловит смысл (выдуманные утверждения, пропавшую атрибуцию),
 * а здесь то, где код точнее и дешевле: штампы, ритм, объём, структура.
 * Возвращает замечания В ТЕХ ЖЕ СЛОВАХ, что уйдут в промпт правки, —
 * «напиши живее» модель исправить не может, «абзацы 3, 4, 7 одной длины» может.
 *
 *   node scripts/news/postcheck.mjs <файл.md> [--lang en]
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { checkRhythm } from './rhythm.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const BANNED = JSON.parse(readFileSync(join(HERE, 'style', 'banned.json'), 'utf8'));

/** Объём по ТЗ новости: меньше — заметка, больше — лонгрид не этой ступени. */
export const WORDS_MIN = 380;
export const WORDS_MAX = 750;

/**
 * Поиск штампа. Для коротких слов нужна граница: «robust» не должен ловить
 * «robustness», а «ultimately» в середине рассуждения — ложное срабатывание
 * ровно того рода, из-за которого списки штампов обычно и выбрасывают.
 */
function findPhrase(text, phrase) {
  const lower = text.toLowerCase();
  if (!BANNED.wordBoundary.includes(phrase)) {
    const i = lower.indexOf(phrase);
    return i === -1 ? null : i;
  }
  const re = new RegExp(`(^|[^\\p{L}])${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}]|$)`, 'iu');
  const m = re.exec(text);
  return m ? m.index : null;
}

/** Фрагмент вокруг находки — чтобы замечание указывало на место, а не на слово. */
const excerpt = (text, at, len) =>
  text.slice(Math.max(0, at - 40), Math.min(text.length, at + len + 40)).replace(/\s+/g, ' ').trim();

export function postcheck(text, lang = 'en') {
  const issues = [];

  const lists = BANNED[lang] ?? BANNED.en;
  for (const [category, phrases] of Object.entries(lists)) {
    for (const phrase of phrases) {
      const at = findPhrase(text, phrase);
      if (at !== null) issues.push({ kind: 'штамп', category, detail: `«${phrase}» — ${excerpt(text, at, phrase.length)}` });
    }
  }

  const words = text.replace(/[#>*_`|-]/g, ' ').split(/\s+/).filter(Boolean).length;
  if (words < WORDS_MIN) issues.push({ kind: 'объём', detail: `${words} слов, нужно от ${WORDS_MIN}` });
  if (words > WORDS_MAX) issues.push({ kind: 'объём', detail: `${words} слов, предел ${WORDS_MAX}` });

  if (/^#\s/m.test(text)) issues.push({ kind: 'структура', detail: 'H1 внутри текста: заголовок задаётся отдельным полем' });

  const r = checkRhythm(text);
  if (!r.ok && !r.skipped) {
    for (const i of r.issues) issues.push({ kind: 'ритм', detail: i });
    if (r.hint) issues.push({ kind: 'ритм', detail: r.hint });
  }

  // Абзац-резюме в конце — признак машины, регуляркой ловится надёжно.
  const last = (text.trim().split(/\n\s*\n/).pop() ?? '').toLowerCase();
  if (/^(in (conclusion|summary)|to sum up|overall|en (conclusión|resumen)|en definitiva)/.test(last))
    issues.push({ kind: 'структура', detail: 'последний абзац — пересказ сказанного, убрать' });

  return {
    ok: issues.length === 0,
    issues,
    words,
    // hint отдаётся отдельным полем, а не только внутри issues: промпт правки
    // ставит его отдельной строкой «замер кодом, не мнение».
    hint: r.hint ?? null,
    rhythm: { cv: Number(r.cv.toFixed(3)), singleShare: Number(r.singleShare.toFixed(3)), paragraphs: r.paragraphs },
  };
}

/** Замечания одной строкой — ровно то, что уходит в промпт правки. */
export const issuesToPrompt = (issues) =>
  issues.map((i) => `— [${i.kind}${i.category ? '/' + i.category : ''}] ${i.detail}`).join('\n');

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith('--'));
  const lang = (args.find((a) => a.startsWith('--lang')) ?? '--lang=en').split('=')[1] ?? 'en';
  if (!file) { console.error('укажите файл: node scripts/news/postcheck.mjs <файл.md> [--lang=en]'); process.exit(2); }
  const res = postcheck(readFileSync(file, 'utf8'), lang);
  console.log(`${file}: ${res.words} слов, CV ${res.rhythm.cv}, однопредл. ${(res.rhythm.singleShare * 100).toFixed(0)} %`);
  if (res.ok) console.log('  замечаний нет');
  else console.log(issuesToPrompt(res.issues).split('\n').map((l) => '  ' + l).join('\n'));
  process.exit(res.ok ? 0 : 1);
}
