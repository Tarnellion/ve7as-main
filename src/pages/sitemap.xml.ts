import type { APIRoute } from 'astro';
import { INDEXED_LANGUAGES, DEFAULT_LANGUAGE, HTML_LANG, type Language } from '../i18n/languages';
import { path } from '../i18n/utils';
import { getSitemapContent, type SitemapContent } from '../lib/sanity';

/** Pages that exist for every language regardless of CMS content. */
const STATIC_SEGMENTS = ['', 'about', 'contacts', 'privacy', 'terms'];

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
  const content = await getSitemapContent();
  const { sections, articles, faqItems } = content.data;

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

  const entries: { segments: string; lastmod?: string }[] = [
    ...STATIC_SEGMENTS.map((segments) => ({ segments })),
    ...(faqIsListable ? [{ segments: 'faq' }] : []),
    // `section` documents have no `blockedIn` field in the Sanity schema.
    ...sections.map((section) => ({ segments: section.id })),
    ...articles
      .filter((article) => !isGeoRestricted(article.blockedIn))
      .map((article) => ({
        segments: `articles/${article.id}`,
        lastmod: lastmodOf(article),
      })),
  ];

  // Только индексируемые локали: sitemap — это приглашение к обходу, и звать
  // краулер на страницы, которые сами говорят noindex, значит жечь бюджет
  // обхода и слать противоречивые сигналы (см. INDEXED_LANGUAGES).
  const urls = entries.flatMap(({ segments, lastmod }) =>
    INDEXED_LANGUAGES.map((lang) => {
      // hreflang must use the same BCP 47 tags the pages advertise in <head>
      // (`HTML_LANG`), not the raw route codes: `pt`/`br` there vs `pt-PT`/`pt-BR`
      // in the markup produced two contradicting hreflang clusters for the same
      // URLs — and bare `br` is Breton, not Brazilian Portuguese.
      const alternates = [
        ...INDEXED_LANGUAGES.map(
          (alt) =>
            `    <xhtml:link rel="alternate" hreflang="${HTML_LANG[alt]}" href="${url(base, alt, segments)}" />`
        ),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${url(base, DEFAULT_LANGUAGE, segments)}" />`,
      ].join('\n');

      return `  <url>
    <loc>${url(base, lang, segments)}</loc>
${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ''}${alternates}
  </url>`;
    })
  );

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
