import type { APIRoute } from 'astro';
import { INDEXED_LANGUAGES, type Language } from '../i18n/languages';
import { path } from '../i18n/utils';
import { getArticles } from '../lib/sanity';
import { xmlText } from '../lib/xml';

/**
 * Новостной sitemap: только материалы последних двух суток.
 *
 * Отдельно от `sitemap.xml`, потому что это другой документ по смыслу.
 * Обычный sitemap говорит «вот все адреса сайта» и живёт месяцами;
 * новостной — «вот что вышло только что», и Google требует держать в нём
 * исключительно свежее: «Only include recent URLs for articles that were
 * created in the last two days». Материал старше выпадает сам, по дате,
 * никакой очистки не нужно.
 *
 * Зачем вообще: конвейер публикует без деплоя, и до 29.10.2026 единственным
 * сигналом о новом материале был общий sitemap, который на домене без
 * внешних ссылок перечитывается редко — тринадцать новостей за три дня не
 * были просканированы ни разу. Этот файл сужает сигнал до «вот три статьи,
 * вышедшие вчера», что и есть его единственная задача.
 *
 * Включение в Google News он не заменяет и не гарантирует: это канал
 * обнаружения, а не пропуск.
 */

/** Окно по документации Google — ровно двое суток от публикации. */
const WINDOW_MS = 2 * 24 * 60 * 60 * 1000;

/**
 * Потолок Google — 1000 тегов `news:news` на файл. При темпе конвейера
 * (30–40 материалов в месяц) за двое суток не набирается и десяти, так что
 * срез здесь — страховка от аварийного прогона, а не рабочий режим.
 */
const MAX_ENTRIES = 1000;

/** Имя издания. Должно совпадать с тем, под которым сайт известен Google. */
const PUBLICATION_NAME = 'Ve7as';

export const GET: APIRoute = async ({ site }) => {
  const base = site!.toString().replace(/\/$/, '');
  const since = Date.now() - WINDOW_MS;

  // По запросу на локаль: заголовок нужен на языке страницы, а `getArticles`
  // резолвит его в GROQ. Две индексируемые локали — два запроса, оба в CDN.
  const results = await Promise.all(
    INDEXED_LANGUAGES.map(async (lang) => ({ lang, result: await getArticles(lang, { limit: 100 }) })),
  );

  const failed = results.some(({ result }) => result.failed);

  const entries: { lang: Language; id: string; title: string; pubDate: string }[] = [];
  for (const { lang, result } of results) {
    for (const article of result.data) {
      // Фолбэк с русского несёт noindex, гео-ограниченное прячем целиком —
      // те же два правила, что в sitemap.xml и в фиде.
      if (!article.hasTranslation || article.blockedIn?.length) continue;
      const published = new Date(article.pubDate);
      if (Number.isNaN(published.getTime()) || published.getTime() < since) continue;
      entries.push({ lang, id: article.id, title: article.title, pubDate: published.toISOString() });
    }
  }

  // Свежие первыми: если потолок когда-нибудь сработает, отрезать надо
  // хвост, а не голову.
  entries.sort((a, b) => b.pubDate.localeCompare(a.pubDate));

  const urls = entries.slice(0, MAX_ENTRIES).map(
    ({ lang, id, title, pubDate }) => `  <url>
    <loc>${xmlText(`${base}${path(lang, 'articles', id)}`)}</loc>
    <news:news>
      <news:publication>
        <news:name>${PUBLICATION_NAME}</news:name>
        <news:language>${lang}</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${xmlText(title)}</news:title>
    </news:news>
  </url>`,
  );

  // Пустой urlset — валидный документ и нормальное состояние: значит за двое
  // суток ничего не выходило. Пустой файл лучше, чем вчерашние адреса,
  // выданные за сегодняшние.
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls.join('\n')}
</urlset>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      // Пятнадцать минут, а не час как у общего sitemap: файл существует
      // ради свежести, и час задержки съедает восьмую часть его окна.
      'Cache-Control': failed ? 'no-store' : 'public, max-age=900',
    },
  });
};
