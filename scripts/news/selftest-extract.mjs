#!/usr/bin/env node
/**
 * Проверка извлечения текста статьи из чужого HTML. Первая причина — настоящий провал боевого
 * прогона 40471867453 (27.10.2026): на casino.org единственный `<article>` — комментарий
 * читателя внутри `<main>`, и статья давала 64 символа вместо ~8000. Тесты строят страницы
 * той же формы и несколько родственных.
 *
 *   node scripts/news/selftest-extract.mjs
 */
import { extractText, MIN_BLOCK, MAX_TEXT } from './extract.mjs';

let failed = 0;
const ok = (cond, label, detail = '') => {
  console.log(`  ${cond ? '✓' : '✗'} ${label}${!cond && detail ? ` — ${detail}` : ''}`);
  if (!cond) failed++;
};

const story = (n = 30) => Array.from({ length: n }, (_, i) =>
  `Sentence ${i} of the story: the regulator seized assets in connection with the scratch-card fraud case.`).join(' ');
const STORY = story();
const COMMENT = '<article class="comment"><b>HG Harris Gibson</b> October 24, 2026 Pasta Fazool !!! 0 Reply Share</article>';
const page = (body, head = '<title>T</title>') => `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;
const has = (t, s) => t.includes(s);

console.log('\nНастоящая форма casino.org: единственный <article> — комментарий внутри <main>');
{
  const t = extractText(page(`<nav>Menu Home Slots Poker Sports</nav><main><h1>Lottery Employees Knew Where Winning Tickets Would Be Sold</h1><p>${STORY}</p><section class="comments">${COMMENT}</section></main><footer>Footer links</footer>`));
  ok(t.length > 2000 && has(t, 'Lottery Employees Knew') && has(t, 'scratch-card fraud'), 'берётся статья из <main>, а не комментарий', `${t.length} симв.: ${t.slice(0, 80)}`);
  ok(!/^HG Harris/.test(t), 'текст не начинается с комментария');
}

console.log('\nКомментарий-<article> стоит ПЕРВЫМ, статья — позже (соседние блоки)');
{
  const t = extractText(page(`${COMMENT}<article><h1>Headline</h1><p>${STORY}</p></article>`));
  ok(t.length > 2000 && has(t, 'Headline') && !t.startsWith('HG Harris'), 'выигрывает самый длинный <article>, а не первый', t.slice(0, 80));
}
{
  const t = extractText(page(`<article class="card">Related card text</article><article class="card">Another card</article><article><p>${STORY}</p></article><article class="card">Third card</article>`));
  ok(t.length > 2000 && has(t, 'scratch-card'), 'среди карточек «похожие материалы» берётся настоящая статья');
}

console.log('\nВложенность: комментарий внутри статьи не обрезает её');
{
  const t = extractText(page(`<article><h1>Headline</h1><p>${story(10)}</p>${COMMENT}<p>TAIL-AFTER-COMMENT ${story(10)}</p></article>`));
  ok(has(t, 'TAIL-AFTER-COMMENT'), 'текст после вложенного <article> сохранён (прежний код резал по первому </article>)');
}
{
  const t = extractText(page(`<article><p>${story(8)}</p><article>inner</article><p>MID ${story(8)}</p><article>inner2</article><p>END-MARK ${story(8)}</p></article>`));
  ok(has(t, 'MID') && has(t, 'END-MARK'), 'несколько вложенных блоков подряд: внешняя статья целиком');
}

console.log('\nЗапасной путь: блок короче порога — весь <body> без обвязки');
{
  const t = extractText(page(`<nav>NAVJUNK ${'menu '.repeat(30)}</nav><header>HEADERJUNK</header><div class="content"><h1>Plain page</h1><p>${STORY}</p></div><aside>ASIDEJUNK</aside><footer>FOOTERJUNK</footer>`));
  ok(t.length >= MIN_BLOCK && has(t, 'Plain page') && has(t, 'scratch-card'), 'страница без <article>/<main>: берётся body');
  ok(!/NAVJUNK|HEADERJUNK|ASIDEJUNK|FOOTERJUNK/.test(t), 'навигация, шапка, подвал и aside в запасном пути вырезаются');
}
{
  const t = extractText(page(`<main><p>Short stub.</p></main><div><p>${STORY}</p></div>`));
  ok(t.length >= MIN_BLOCK && has(t, 'scratch-card'), 'короткий <main> (заглушка) не мешает: текст берётся из body');
}
{
  const t = extractText(page('<main><p>Access denied.</p></main>'));
  ok(t.length < MIN_BLOCK, 'страница-заглушка остаётся короткой: вызывающий отбросит её по порогу, мусор не «воскрешается»', `${t.length}`);
}
{
  const t = extractText(page(`<nav>${'junk link '.repeat(100)}</nav><main><p>Paywall.</p></main>`));
  ok(t.length < MIN_BLOCK, 'навигация большой заглушки не засчитывается как статья', `${t.length}`);
}
{
  // ASP.NET-вёрстка: весь документ внутри одного <form>; <article>/<main> нет. Прежний код читал её целиком.
  const t = extractText(page(`<form id="aspnetForm" runat="server"><div class="content"><h1>Old school site</h1><p>${STORY}</p></div></form>`));
  ok(t.length >= MIN_BLOCK && has(t, 'Old school site'), 'страница целиком внутри <form> (ASP.NET) по-прежнему читается');
}

console.log('\nГраницы тегов, регистр, незакрытые блоки');
{
  const t = extractText(page(`<articles>FAKE ${story(2)}</articles><mainframe>FAKE2</mainframe><ARTICLE><P>${STORY}</P></ARTICLE>`));
  ok(has(t, 'scratch-card') && !has(t, 'FAKE'), '<articles> и <mainframe> не принимаются за блоки; заглавные теги работают');
}
{
  const t = extractText(page(`<article><p>${STORY}</p>`));
  ok(t.length > 2000, 'незакрытый <article> идёт до конца документа, текст не теряется');
}
{
  const t = extractText(page(`<script>var x="<article>TRAP</article>";</script><style>.a{}</style><!-- <article>HIDDEN</article> --><article><p>${STORY} &amp; &quot;quoted&quot;&nbsp;done</p></article>`));
  ok(!/TRAP|HIDDEN|var x/.test(t) && has(t, '& "quoted" done'), 'скрипты, стили и комментарии вырезаны; сущности декодированы');
}
{
  const t = extractText(page(`<article>${'a '.repeat(40_000)}</article>`));
  ok(t.length === MAX_TEXT, `ответ обрезается до ${MAX_TEXT} символов`, `${t.length}`);
}

console.log('\nЛинейное время на враждебной вёрстке (чужой сайт не должен подвешивать задание)');
for (const [label, html] of [
  ['100 тыс. незакрытых <article', '<article>'.repeat(100_000)],
  ['50 тыс. соседних <article>…</article>', '<article>card text here</article>'.repeat(50_000)],
  ['вложенность 50 тыс. уровней', '<article>'.repeat(50_000) + 'x' + '</article>'.repeat(50_000)],
  ['100 тыс. <main без закрытия', '<main>'.repeat(100_000)],
]) {
  const t0 = process.hrtime.bigint();
  extractText(page(html));
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  ok(ms < 3000, `${label}: ${ms.toFixed(0)} мс (предел 3000)`);
}

console.log(failed ? `\nПРОВАЛЕНО: ${failed}\n` : '\nВсе проверки пройдены.\n');
process.exit(failed ? 1 : 0);
