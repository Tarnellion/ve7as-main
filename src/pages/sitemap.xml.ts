import type { APIRoute } from 'astro';
import { LANGUAGES, DEFAULT_LANGUAGE } from '../i18n/languages';
import { path } from '../i18n/utils';
import { getSections, getArticles } from '../lib/sanity';

const STATIC_SEGMENTS = ['', 'faq', 'about', 'contacts', 'privacy', 'terms'];

export const GET: APIRoute = async ({ site }) => {
  const base = site!.toString().replace(/\/$/, '');

  const [sections, articles] = await Promise.all([getSections(), getArticles()]);

  const entries: { segments: string; lastmod?: string }[] = [
    ...STATIC_SEGMENTS.map((segments) => ({ segments })),
    ...sections.map((section) => ({ segments: section.id })),
    ...articles.map((article) => ({
      segments: `articles/${article.id}`,
      lastmod: new Date(article.pubDate).toISOString(),
    })),
  ];

  const urls = entries.flatMap(({ segments, lastmod }) =>
    LANGUAGES.map((lang) => {
      const alternates = [
        ...LANGUAGES.map(
          (alt) => `    <xhtml:link rel="alternate" hreflang="${alt}" href="${base}${path(alt, segments)}" />`
        ),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${base}${path(DEFAULT_LANGUAGE, segments)}" />`,
      ].join('\n');

      return `  <url>
    <loc>${base}${path(lang, segments)}</loc>
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
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
