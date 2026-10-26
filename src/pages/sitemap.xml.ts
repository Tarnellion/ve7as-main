import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { INDEXED_LANGUAGES, PRIMARY_LANGUAGE, HTML_LANG, type Language } from '../i18n/languages';
import { path } from '../i18n/utils';
import { getSitemapContent, type SitemapContent } from '../lib/sanity';
import { TOOLS, TOOL_SEGMENTS, TOOL_UPDATED } from '../data/tools';

/**
 * Страницы из локальных Markdown-коллекций: существуют на каждом языке
 * независимо от CMS. Их `<lastmod>` берётся из поля `updated` во frontmatter.
 */
const CONTENT_PAGES = ['about', 'contacts', 'privacy', 'terms', 'editorial-policy'];

/**
 * The sitemap spec requires escaped URLs, and the XML itself must stay
 * well-formed. Slugs come from Sanity and are not guaranteed to be ASCII —
 * one article slug contains an invisible U+2060 WORD JOINER — so percent-encode
 * the path first (matching the page's own canonical, which goes through `new URL`)
 * and then escape the XML metacharacters that survive `encodeURI` (`&` and `'`).
 */
function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function url(base: string, lang: Language, segments: string): string {
  return xmlEscape(base + encodeURI(path(lang, segments)));
}

/**
 * `<lastmod>` must reflect the last *edit*, not the publication date, otherwise
 * corrections to existing articles are never signalled to crawlers. `_updatedAt`
 * is Sanity's own edit timestamp; `pubDate` stays as the fallback.
 */
function lastmodOf(article: SitemapContent['articles'][number]): string | undefined {
  const stamp = new Date(article._updatedAt || article.pubDate);
  return Number.isNaN(stamp.getTime()) ? undefined : stamp.toISOString();
}

/**
 * Самая свежая из дат — в ISO. Неразобранные и пустые значения отбрасываются,
 * пустой вход даёт `undefined`, то есть запись уходит вовсе без `<lastmod>`.
 *
 * Так и задумано: страница, у которой даты нет, лучше уйдёт без неё, чем с
 * выдуманной. Google сверяет `lastmod` с тем, что реально поменялось, и,
 * поймав на расхождении, перестаёт доверять ему по всему sitemap — то есть
 * одна неверная дата обесценивает все верные.
 */
function latest(...stamps: (string | Date | undefined)[]): string | undefined {
  const times = stamps
    .filter((value): value is string | Date => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((time) => !Number.isNaN(time));
  return times.length === 0 ? undefined : new Date(Math.max(...times)).toISOString();
}

/**
 * Geo-blocking: content carrying a non-empty `blockedIn` is withheld from the
 * sitemap entirely.
 *
 * The cost is deliberate and worth stating: `blockedIn` is per-country, while a
 * sitemap is global — there is no way to express "valid everywhere except DE".
 * Dropping the URL therefore also hides it from crawlers in countries where the
 * page is perfectly legal, costing some discoverability. For a regulated
 * casino/betting niche that is the conservative side to err on: an
 * unindexed-but-legal page is a marketing loss, whereas a URL advertised into a
 * jurisdiction that blocks it is a compliance problem. Pages themselves still
 * enforce the block at request time via `cf-ipcountry`; this is the crawl-level
 * counterpart.
 */
function isGeoRestricted(blockedIn: string[] | undefined): boolean {
  return Boolean(blockedIn?.length);
}

export const GET: APIRoute = async ({ site }) => {
  const base = site!.toString().replace(/\/$/, '');

  // Один запрос вместо трёх, и без единого языкового поля: sitemap'у нужны
  // только слаги, `blockedIn` и `_updatedAt`. Раньше он звал `getArticles()` и
  // `getFaqItems()` и вытягивал заодно все тексты на семи языках, чтобы не
  // воспользоваться ни одной строкой.
  // Коллекции читаются рядом с CMS: даты правок локальных страниц лежат в их
  // frontmatter, а не в Sanity, и без них about/terms/privacy уходили к
  // краулеру вовсе без `<lastmod>`.
  const [content, pageEntries, translationEntries] = await Promise.all([
    getSitemapContent(),
    getCollection('pages'),
    getCollection('pageTranslations'),
  ]);
  const { sections, articles, faqItems } = content.data;

  // id в коллекциях: `about` у оригинала и `en/about` у перевода.
  const pageUpdated = new Map(pageEntries.map((entry) => [entry.id, entry.data.updated]));
  const translationUpdated = new Map(translationEntries.map((entry) => [entry.id, entry.data.updated]));

  // Sanity недоступна — отдаём статические маршруты, а не 500: главная и
  // юридические страницы существуют независимо от CMS, и терять их из sitemap
  // из-за чужого сбоя незачем. Заголовки при этом честно говорят, что выдача
  // неполная, чтобы усечённый файл не закрепился в кэше на час.
  if (content.failed) {
    console.error('[sitemap] serving static routes only: Sanity content unavailable');
  }

  // FAQ entries have no standalone URLs — they all render inside `/[lang]/faq`.
  // So the geo filter can only act on the page as a whole: keep it as long as at
  // least one globally-available item remains. The `length` guard means an empty
  // or failed FAQ fetch leaves the page in the sitemap rather than silently
  // dropping 7 URLs.
  const faqIsListable =
    faqItems.length === 0 || faqItems.some((item) => !isGeoRestricted(item.blockedIn));

  const listableArticles = articles.filter((article) => !isGeoRestricted(article.blockedIn));

  // Содержимое индекса и хабов — список статей, поэтому их дата правки это
  // самая свежая правка среди показанных материалов, а не дата деплоя. У хаба
  // к ней добавляется собственный текст рубрики из CMS.
  const indexLastmod = latest(...listableArticles.map((article) => article._updatedAt || article.pubDate));
  const sectionLastmod = (section: SitemapContent['sections'][number]) =>
    latest(
      section._updatedAt,
      ...listableArticles
        .filter((article) => article.section === section.id)
        .map((article) => article._updatedAt || article.pubDate),
    );

  // У локальной страницы дата своя на каждом языке: правка английского текста
  // не делает свежее испанский. Перевода нет — рендерится русский оригинал,
  // значит и дата берётся его.
  const contentPageLastmod = (page: string) => (lang: Language) =>
    latest(translationUpdated.get(`${lang}/${page}`) ?? pageUpdated.get(page));

  // `langs` у статьи — только локали с настоящим переводом: URL, который сам
  // скажет noindex (фолбэк), в sitemap не приглашается, и альтернативы на
  // него не объявляются. У статики и списков версия есть на каждом языке.
  //
  // `lastmod` бывает функцией от языка — см. `contentPageLastmod`.
  const entries: {
    segments: string;
    lastmod?: string | ((lang: Language) => string | undefined);
    langs?: readonly Language[];
  }[] = [
    { segments: '', lastmod: indexLastmod },
    ...CONTENT_PAGES.map((segments) => ({ segments, lastmod: contentPageLastmod(segments) })),
    { segments: 'tools', lastmod: latest(...TOOLS.map((tool) => tool.updated)) },
    ...TOOL_SEGMENTS.map((segments) => ({ segments, lastmod: latest(TOOL_UPDATED[segments]) })),
    ...(faqIsListable
      ? [{ segments: 'faq', lastmod: latest(...faqItems.map((item) => item._updatedAt)) }]
      : []),
    // `section` documents have no `blockedIn` field in the Sanity schema.
    ...sections.map((section) => ({ segments: section.id, lastmod: sectionLastmod(section) })),
    ...listableArticles.map((article) => ({
      segments: `articles/${article.id}`,
      lastmod: lastmodOf(article),
      langs: INDEXED_LANGUAGES.filter((code) => article.translations?.[code] === true),
    })),
  ];

  // Только индексируемые локали: sitemap — это приглашение к обходу, и звать
  // краулер на страницы, которые сами говорят noindex, значит жечь бюджет
  // обхода и слать противоречивые сигналы (см. INDEXED_LANGUAGES).
  const urls = entries.flatMap(({ segments, lastmod, langs }) => {
    const pageLangs = langs ?? INDEXED_LANGUAGES;
    return pageLangs.map((lang) => {
      const stamp = typeof lastmod === 'function' ? lastmod(lang) : lastmod;
      // hreflang must use the same BCP 47 tags the pages advertise in <head>
      // (`HTML_LANG`), not the raw route codes: `pt`/`br` there vs `pt-PT`/`pt-BR`
      // in the markup produced two contradicting hreflang clusters for the same
      // URLs — and bare `br` is Breton, not Brazilian Portuguese.
      const alternates = pageLangs.length < 2 ? '' : [
        ...pageLangs.map(
          (alt) =>
            `    <xhtml:link rel="alternate" hreflang="${HTML_LANG[alt]}" href="${url(base, alt, segments)}" />`
        ),
        ...(pageLangs.includes(PRIMARY_LANGUAGE)
          ? [`    <xhtml:link rel="alternate" hreflang="x-default" href="${url(base, PRIMARY_LANGUAGE, segments)}" />`]
          : []),
      ].join('\n');

      return `  <url>
    <loc>${url(base, lang, segments)}</loc>
${stamp ? `    <lastmod>${stamp}</lastmod>\n` : ''}${alternates}
  </url>`;
    });
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': content.failed ? 'no-store' : 'public, max-age=3600',
    },
  });
};
