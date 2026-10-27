/**
 * Текст статьи из HTML без зависимостей.
 *
 * Разбор ЛИНЕЙНЫЙ намеренно: прежние регулярные выражения с ленивым `[\s\S]*?` на странице
 * с тысячами незакрытых `<script` работали квадратично и могли подвесить задание. Источник —
 * чужой сайт, и от его вёрстки время работы зависеть не должно.
 *
 * Вынесено из generate.mjs, чтобы тестироваться напрямую (generate.mjs исполняется при импорте).
 */

/** Не читаем больше: чужая страница не должна занимать память целиком. */
export const MAX_BODY = 1_500_000;
/** Блок короче этого — не статья (комментарий, карточка, подпись), а запасной путь — весь body. */
export const MIN_BLOCK = 400;
/** Сколько текста уходит модели. */
export const MAX_TEXT = 12_000;

export function stripBlocks(html, open, close) {
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

export function stripTags(html) {
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

/**
 * Внешние блоки `<tag>…</tag>` с учётом вложенности. Вложенность важна: комментарии часто лежат
 * `<article>` внутри `<article>` или внутри `<main>`, и «до первого `</article>`» обрезает
 * материал на первом же комментарии. Незакрытый блок идёт до конца документа. Один проход по
 * простому шаблону без вложенных кванторов — линейный. `(?=[\s>/])` отсекает `<articles>`, `<mainframe>`.
 */
function outerBlocks(html, tag) {
  const re = new RegExp(`<(/?)${tag}(?=[\\s>/])`, 'gi');
  const blocks = [];
  let depth = 0;
  let start = -1;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    if (m[1] === '') {
      if (depth === 0) start = m.index;
      depth++;
    } else if (depth > 0) {
      depth--;
      if (depth === 0) {
        const end = html.indexOf('>', m.index);
        blocks.push(html.slice(start, end === -1 ? html.length : end + 1));
        start = -1;
      }
    }
  }
  if (depth > 0 && start !== -1) blocks.push(html.slice(start));
  return blocks;
}

const decode = (s) => s
  .replace(/&nbsp;|&#160;/g, ' ')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>');

const clean = (html) => decode(stripTags(html)).replace(/\s+/g, ' ').trim();

/** Содержимое `<body>` (или весь документ, если тега нет) без навигационной обвязки. */
function bodyWithoutChrome(html) {
  const low = html.toLowerCase();
  const i = low.indexOf('<body');
  let body = i === -1 ? html : html.slice(i);
  // `form` намеренно НЕ вырезаем: на ASP.NET-сайтах весь документ лежит внутри одного <form runat="server">,
  // и вырезание обнулило бы страницу, которую прежний код читал целиком.
  for (const tag of ['nav', 'header', 'footer', 'aside', 'template']) body = stripBlocks(body, `<${tag}`, `</${tag}>`);
  return body;
}

/**
 * Берётся САМЫЙ ДЛИННЫЙ по тексту блок `<article>`/`<main>`, а не первый. Первый — не обязательно
 * статья: на casino.org единственный `<article>` на странице — комментарий читателя, лежащий внутри
 * `<main>`, и статья «lottery employees knew where winning tickets…» давала 64 символа
 * («HG Harris Gibson… Pasta Fazool !!! 0 Reply Share»), отбрасывалась как короткая, и настоящее
 * второе подтверждение дела Lottomatica пропадало (прогон 40471867453, 27.10.2026).
 * Если лучший блок короче MIN_BLOCK — запасной путь: весь `<body>` без nav/header/footer/aside/template.
 * Обвязка вырезается именно здесь: заглушка платной статьи с большим меню иначе набрала бы 400
 * символов навигации и была бы засчитана прочитанным источником (гейт `retrieval` считает группы
 * по этому порогу). Если и после этого текста мало, возвращается самое длинное, что нашлось, и
 * вызывающий отбросит страницу по тому же порогу.
 */
export function extractText(raw) {
  let html = raw.slice(0, MAX_BODY);
  for (const tag of ['script', 'style', 'noscript', 'svg']) html = stripBlocks(html, `<${tag}`, `</${tag}>`);
  html = stripBlocks(html, '<!--', '-->');

  let best = '';
  for (const tag of ['article', 'main']) {
    for (const block of outerBlocks(html, tag)) {
      const text = clean(block);
      if (text.length > best.length) best = text;
    }
  }
  if (best.length < MIN_BLOCK) {
    const stripped = clean(bodyWithoutChrome(html));
    if (stripped.length > best.length) best = stripped;
  }
  return best.slice(0, MAX_TEXT);
}
