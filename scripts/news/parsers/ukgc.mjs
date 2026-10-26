/**
 * Сбор новостей UK Gambling Commission.
 *
 * У регулятора нет ленты — только листинг на сайте, поэтому ему нужен свой
 * разбор. Двенадцать путей к RSS/Atom пробиты, ленты не существует; открытого
 * JSON-эндпоинта тоже нет (страница не делает ни одного XHR, сайт собран на
 * Contentful, а его Delivery API требует ключ — это нарушает нулевой бюджет).
 *
 * ЛОВУШКА, на которую я попался сам: кажется, будто в листинге нет дат и
 * порядок алфавитный. Это артефакт проверки через `grep -o … | sort -u` —
 * алфавит создаёт `sort`. На самом деле порядок строго хронологический
 * (проверено программно на 507 записях, нарушений 0), а дата лежит простым
 * текстом в <p class="gc-card__description"> перед заголовком, не в <time>
 * и не в ld+json, где её естественно искать.
 *
 * Берём только enforcement-action. Это «первичный документ регулятора» —
 * решения, штрафы, приговоры, — ради которого UKGC и нужен. Остальные пять
 * категорий (industry, corporate, national-lottery, speeches-and-talks,
 * consumers) устроены так же и подключаются добавлением в CATEGORIES, но на
 * замере за неделю дали ноль новостей против двух у enforcement.
 */
import { headers, POLITE_MS, sleep } from '../http.mjs';

const BASE = 'https://www.gamblingcommission.gov.uk';
const CATEGORIES = ['enforcement-action'];

const MONTHS = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

/** Одна карточка листинга. Абзац с датой стоит перед <h3> с заголовком. */
const ROW = /<li class="card">\s*<a href="(\/news\/article\/[^"]+)">[\s\S]*?<p class="gc-card__description[^"]*">\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\s*<\/p>\s*<h3[^>]*>([\s\S]*?)<\/h3>/g;

const decode = (s) => s.replace(/\s+/g, ' ').trim()
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&pound;/g, '£').replace(/&nbsp;/g, ' ');

const attr = (html, re) => decode(html.match(re)?.[1] ?? '');

/**
 * Текст материала со страницы статьи.
 *
 * В листинге тела нет вообще, а на одном заголовке ступень 2 работает плохо:
 * эмбеддинг заголовка без лида даёт 0,6-0,7 даже на пересказах одного события.
 * Поэтому за свежими (их единицы за окно) ходим на страницу: `og:description`
 * даёт готовый лид, абзацы `gcweb-body` — тело.
 */
async function articleText(url) {
  const res = await fetch(url, { headers: headers({ Accept: 'text/html' }), redirect: 'follow' });
  if (!res.ok) return { lead: '', body: '' };
  const html = await res.text();
  const lead = attr(html, /<meta property="og:description" content="([^"]*)"/i);
  const paras = [...html.matchAll(/<p class="gcweb-body[^"]*">([\s\S]*?)<\/p>/gi)]
    .map((m) => decode(m[1].replace(/<[^>]+>/g, ' ')))
    .filter(Boolean);
  return { lead, body: [lead, ...paras].filter(Boolean).join(' ') };
}

/**
 * Возвращает сырые записи в форме, которую `harvest.mjs` дальше нормализует
 * и хеширует сам — хеширование обязано жить в одном месте для всех источников.
 */
export async function harvestUkgc(cutoffMs) {
  const out = [];
  for (const cat of CATEGORIES) {
    const res = await fetch(`${BASE}/news/${cat}`, { headers: headers({ Accept: 'text/html' }), redirect: 'follow' });
    if (!res.ok) throw new Error(`ukgc/${cat}: HTTP ${res.status}`);
    const rows = [...(await res.text()).matchAll(ROW)];

    // Ноль строк — это НЕ «новостей нет», это «разметку поменяли». Молчаливая
    // поломка превратилась бы в «UKGC ничего не публикует», и заметили бы её
    // через месяцы. Нормальное число строк для категории — 25-100.
    if (!rows.length) throw new Error(`ukgc/${cat}: разобрано 0 карточек — изменилась разметка`);

    // Листинг отсортирован от свежего к старому: на первой записи старше окна
    // можно останавливаться.
    for (const m of rows) {
      const date = new Date(Date.UTC(+m[4], MONTHS[m[3].toLowerCase()], +m[2]));
      if (date.getTime() < cutoffMs) break;
      out.push({ link: `${BASE}${m[1]}`, title: decode(m[5]), date });
    }
    await sleep(POLITE_MS);
  }

  for (const it of out) {
    const { body } = await articleText(it.link);
    it.body = body;
    await sleep(POLITE_MS);
  }
  return out;
}
