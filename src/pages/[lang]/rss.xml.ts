import type { APIRoute } from 'astro';
import { INDEXED_LANGUAGES, HTML_LANG, isLanguage, type Language } from '../../i18n/languages';
import { path } from '../../i18n/utils';
import { getArticles } from '../../lib/sanity';
import { xmlText } from '../../lib/xml';

/**
 * RSS-фид материалов локали: `/en/rss.xml`, `/es/rss.xml`.
 *
 * Зачем он нужен именно здесь. Новости публикуются конвейером без деплоя,
 * и до 29.10.2026 единственным каналом обнаружения для Google был sitemap —
 * а Google читает его по собственному расписанию и на домене без внешних
 * ссылок заходит редко: тринадцать новостей, вышедших за три дня, к моменту
 * проверки не были просканированы ни разу, большинство в статусе «URL
 * неизвестен Google». Фид добавляет второй канал и, что важнее, даёт
 * подписаться агрегаторам — а оттуда иногда приходят первые внешние ссылки,
 * то есть ровно то, чего домену не хватает.
 *
 * Фида нет у неиндексируемых локалей: приглашать робота туда, где страницы
 * сами говорят `noindex`, бессмысленно (см. `INDEXED_LANGUAGES`).
 */

/** Столько материалов отдаём в фиде: читателю нужна лента, не архив. */
const FEED_ITEMS = 20;

export const GET: APIRoute = async ({ params, site }) => {
  const lang = params.lang as Language;

  // Маршрут отвечает мимо middleware: `.xml` попадает в `isReserved`, поэтому
  // проверки языкового префикса там не происходит и `/zz/rss.xml` дошёл бы
  // сюда. Валидация своя.
  if (!isLanguage(lang) || !INDEXED_LANGUAGES.includes(lang)) {
    return new Response('Not found', { status: 404 });
  }

  const base = site!.toString().replace(/\/$/, '');
  const self = `${base}${path(lang)}rss.xml`;
  const home = `${base}${path(lang)}`;

  const result = await getArticles(lang, { limit: FEED_ITEMS });

  // Те же два фильтра, что у sitemap: материал, показанный из русского
  // фолбэка, несёт noindex — в приглашении к обходу ему не место; статья с
  // непустым `blockedIn` убирается целиком, потому что фид, как и sitemap,
  // один на весь мир и «везде, кроме DE» в нём не выразить.
  const items = result.data.filter((a) => a.hasTranslation && !a.blockedIn?.length);

  const lastBuild = items[0]?.pubDate ? new Date(items[0].pubDate) : new Date();

  const body = items
    .map((article) => {
      const url = `${base}${path(lang, 'articles', article.id)}`;
      const published = new Date(article.pubDate);
      return `    <item>
      <title>${xmlText(article.title)}</title>
      <link>${xmlText(url)}</link>
      <guid isPermaLink="true">${xmlText(url)}</guid>
      <pubDate>${published.toUTCString()}</pubDate>
      <description>${xmlText(article.description ?? '')}</description>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Ve7as</title>
    <link>${xmlText(home)}</link>
    <description>${xmlText(DESCRIPTION[lang])}</description>
    <language>${HTML_LANG[lang]}</language>
    <lastBuildDate>${lastBuild.toUTCString()}</lastBuildDate>
    <atom:link href="${xmlText(self)}" rel="self" type="application/rss+xml" />
${body}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      // Сбой CMS отдаёт пустой фид — он не должен залипнуть на час.
      'Cache-Control': result.failed ? 'no-store' : 'public, max-age=3600',
    },
  });
};

/**
 * Описание канала. Лежит здесь, а не в `src/i18n/ui.ts`: это строка для
 * агрегаторов, а не элемент интерфейса, и ui.ts типизирован на семь локалей,
 * из которых фид получают две.
 */
const DESCRIPTION: Record<string, string> = {
  en: 'How gambling, betting and lotteries actually work — explained in plain language, with no operator ads.',
  es: 'Cómo funcionan de verdad el juego, las apuestas y las loterías: explicado en lenguaje claro y sin publicidad de operadores.',
};
