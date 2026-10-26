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
import { checkRhythm, paragraphs } from './rhythm.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const BANNED = JSON.parse(readFileSync(join(HERE, 'style', 'banned.json'), 'utf8'));

/** Объём по ТЗ новости: меньше — заметка, больше — лонгрид не этой ступени. */
/**
 * Нижний предел объёма. Был 380, пока ТЗ требовало 450-650 слов, — и именно
 * эта планка заставляла модель растягивать новость на тонком источнике:
 * решение регулятора на 2300 символов она «дотянула» домыслом «framing
 * implies…», который второй проход отловил как преувеличение. Объём
 * определяют факты, а не планка.
 */
export const WORDS_MIN = 250;
/**
 * Предел объёма зависит от языка. Испанский текст систематически длиннее
 * английского примерно на пятую часть при том же содержании — измерено на
 * первом боевом прогоне: 697 слов EN против 811 ES, и перевод свалился
 * по объёму, хотя ничего лишнего не добавил. Единый предел наказывал бы
 * за грамматику языка, а не за многословие.
 */
export const WORDS_MAX = { en: 750, es: 880 };

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

/**
 * Утверждения о подготовке текста. Пометку об ИИ рисует сайт; всё, что модель
 * напишет о процессе сама, при автопубликации ложно (первый боевой прогон:
 * «reviewed by the Ve7as editorial team» в материале, который не читал никто)
 * и ещё и дублирует строку сайта.
 */
const PROCESS_CLAIMS = [
  /prepared with (the help of )?(ai|artificial intelligence)/i,
  /\bai[- ](assist|generated|prepared)/i,
  /reviewed by (the )?(ve7as )?(editor|editorial)/i,
  /(not|no) (for|to be) (publication|published)/i,
  /\bnote (for|to) (the )?(editor|editorial)/i,
  /elaborado con (ayuda de )?(ia|inteligencia artificial)/i,
  /revisado por (el )?(equipo )?(editorial|de redacci)/i,
  /\bnota (para|a) (la )?(redacci|editor)/i,
];

export function postcheck(text, lang = 'en') {
  const issues = [];

  // Кириллица в материале на en/es — служебная записка или недоперевод. На
  // первом боевом прогоне шаг правки вписал в статью записку по-русски с
  // перечнем блокеров конвейера: на сайт она ушла бы вместе с текстом.
  const cyr = text.match(/[А-Яа-яЁё]{3,}/);
  if (cyr) issues.push({ kind: 'служебное', detail: `кириллица в тексте на ${lang} («${cyr[0]}…») — служебная записка или недоперевод` });

  for (const re of PROCESS_CLAIMS) {
    const m = text.match(re);
    if (m) issues.push({ kind: 'служебное', detail: `текст рассказывает о своей подготовке: «${m[0]}» — это делает сайт, не текст` });
  }

  // Ссылки, картинки и адреса. Модель могла бы написать их по подсказке из текста
  // источника, а рендерер markdown ссылки и картинки ПРОПУСКАЕТ (им нужны
  // разрешённые схемы, а не отсутствие ссылок), и ни один гейт их не проверял.
  // Сайт не размещает внешних ссылок в новостях и не рекламирует операторов.
  const link = text.match(/!?\[[^\]]*\]\([^)]*\)|https?:\/\/\S+|\bwww\.\S+/i);
  if (link) issues.push({ kind: 'ссылки', detail: `ссылка или адрес в тексте: «${link[0].slice(0, 60)}» — новости без внешних ссылок` });

  // Сырой HTML рендерер экранирует, и на странице он стоял бы буквальным
  // текстом «<small>…</small>».
  const html = text.match(/<\/?[a-z][a-z0-9]*(\s[^>]*)?>/i);
  if (html) issues.push({ kind: 'служебное', detail: `сырая HTML-разметка в тексте: ${html[0]}` });

  const lists = BANNED[lang] ?? BANNED.en;
  for (const [category, phrases] of Object.entries(lists)) {
    for (const phrase of phrases) {
      const at = findPhrase(text, phrase);
      if (at !== null) issues.push({ kind: 'штамп', category, detail: `«${phrase}» — ${excerpt(text, at, phrase.length)}` });
    }
  }

  const words = text.replace(/[#>*_`|-]/g, ' ').split(/\s+/).filter(Boolean).length;
  const maxWords = WORDS_MAX[lang] ?? WORDS_MAX.en;
  if (words < WORDS_MIN) issues.push({ kind: 'объём', detail: `${words} слов, нужно от ${WORDS_MIN}` });
  if (words > maxWords) issues.push({ kind: 'объём', detail: `${words} слов, предел ${maxWords}` });

  if (/^#\s/m.test(text)) issues.push({ kind: 'структура', detail: 'H1 внутри текста: заголовок задаётся отдельным полем' });

  // РИТМ — ТОЛЬКО ДЛЯ АНГЛИЙСКОГО. Пороги откалиброваны на английских одобренных
  // текстах, и к переводу абсолютное сравнение неприменимо: на первом боевом
  // прогоне у испанской версии материала с английским CV 0.449 и 25 %
  // однопредложенных абзацев стало 0.415 и 8 % при тех же 12 абзацах — перевод
  // склеил короткие предложения. Это шум перевода, а не «машинность». Для
  // перевода проверяем сохранность структуры оригинала (translationFidelity).
  const r = checkRhythm(text);
  if (lang !== 'es' && !r.ok && !r.skipped) {
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

const countWords = (text) => text.replace(/[#>*_`|-]/g, ' ').split(/\s+/).filter(Boolean).length;

/**
 * Перевод должен сохранять структуру оригинала: то же число абзацев и
 * правдоподобное отношение объёмов. Это то, что перевод ОБЯЗАН сохранять, и
 * то, что ломается, когда он теряет или досочиняет текст. Испанский длиннее
 * английского примерно на пятую часть (измерено: ×1.13-1.21), поэтому окно
 * широкое — оно ловит потерянный или раздутый перевод, а не стиль.
 */
/**
 * Числа текста: суммы, годы, количества. Разделители тысяч в разных языках разные
 * («2,000», «2.000», «2 000»), поэтому между цифрами они вырезаются до сравнения.
 * Одноцифровые числа не берём: «1», «2» стоят в порядковых и перечислениях, а
 * подмена «37» на «73» — ровно то, что нужно ловить, — двузначная.
 */
function numbersOf(text) {
  const joined = text
    .replace(/(?<=\d)[.,\u00a0\u202f](?=\d{3}(?!\d))/g, '')
    .replace(/(?<=\d{1,3}) (?=\d{3}(?!\d))/g, '');
  return new Set((joined.match(/\d+/g) ?? []).filter((n) => n.length >= 2));
}

export function translationFidelity(enText, esText) {
  const issues = [];
  // Переводчик не должен терять и добавлять числа. Это механически ловит то, чего
  // не поймает счёт абзацев: подмену суммы или даты внутри нормального по форме текста.
  const en = numbersOf(enText), es = numbersOf(esText);
  const lost = [...en].filter((n) => !es.has(n));
  const added = [...es].filter((n) => !en.has(n));
  if (lost.length || added.length) {
    issues.push({ kind: 'перевод', detail: `числа расходятся: потеряны ${lost.join(', ') || '—'}, добавлены ${added.join(', ') || '—'}` });
  }
  const pe = paragraphs(enText).length;
  const ps = paragraphs(esText).length;
  if (pe !== ps) issues.push({ kind: 'перевод', detail: `абзацев ${ps} при ${pe} в оригинале: структура не сохранена` });
  const we = countWords(enText);
  const ws = countWords(esText);
  const ratio = we ? ws / we : 0;
  if (ratio < 0.95 || ratio > 1.5) {
    issues.push({ kind: 'перевод', detail: `объём перевода ${ws} слов при ${we} в оригинале (×${ratio.toFixed(2)}): текст потерян или досочинён` });
  }
  return issues;
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
