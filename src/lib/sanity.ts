import { createClient } from '@sanity/client';
import { marked } from 'marked';

export const sanity = createClient({
  projectId: import.meta.env.SANITY_PROJECT_ID,
  dataset: import.meta.env.SANITY_DATASET,
  apiVersion: '2024-01-01',
  token: import.meta.env.SANITY_API_TOKEN,
  useCdn: false,
});

export function renderMarkdown(md: string): string {
  return marked.parse(md ?? '', { async: false }) as string;
}

export function extractToc(md: string): { depth: number; text: string; slug: string }[] {
  const headings: { depth: number; text: string; slug: string }[] = [];
  for (const line of (md ?? '').split('\n')) {
    const m = line.match(/^(#{1,6})\s+(.+)$/);
    if (m) {
      const text = m[2].trim();
      const slug = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      headings.push({ depth: m[1].length, text, slug });
    }
  }
  return headings;
}

const LANG_FIELDS = ['ru', 'en', 'es', 'pt', 'de', 'fr', 'br'] as const;

function langProjection(type: 'article' | 'faq') {
  if (type === 'article') {
    return LANG_FIELDS.map((l) =>
      `"title_${l}": title_${l}, "description_${l}": description_${l}`
    ).join(', ');
  }
  return LANG_FIELDS.map((l) =>
    `"question_${l}": question_${l}, "answer_${l}": answer_${l}`
  ).join(', ');
}

function langBodyProjection() {
  return LANG_FIELDS.map((l) => `"body_${l}": body_${l}`).join(', ');
}

export function getArticleText(article: SanityArticle | SanityArticleFull, field: 'title' | 'description', lang: string): string {
  const key = `${field}_${lang}` as keyof typeof article;
  const fallback = `${field}_ru` as keyof typeof article;
  return (article[key] as string) || (article[fallback] as string) || '';
}

export function getArticleBody(article: SanityArticleFull, lang: string): string {
  const key = `body_${lang}` as keyof SanityArticleFull;
  return (article[key] as string) || article.body_ru || '';
}

export function getFaqText(faq: SanityFaq, field: 'question' | 'answer', lang: string): string {
  const key = `${field}_${lang}` as keyof SanityFaq;
  const fallback = `${field}_ru` as keyof SanityFaq;
  return (faq[key] as string) || (faq[fallback] as string) || '';
}

export function isBlockedInCountry(blockedIn: string[], country: string): boolean {
  if (!country || !blockedIn?.length) return false;
  return blockedIn.includes(country.toUpperCase());
}

export async function getSections() {
  return sanity.fetch<SanitySection[]>(`*[_type == "section"] | order(order asc) {
    "id": slug.current,
    title,
    icon,
    description,
    order
  }`);
}

export async function getArticles() {
  return sanity.fetch<SanityArticle[]>(`*[_type == "article"] | order(pubDate desc) {
    "id": slug.current,
    "section": section->slug.current,
    pubDate,
    readingTime,
    author,
    featured,
    blockedIn,
    ${langProjection('article')}
  }`);
}

export async function getArticleBySlug(slug: string) {
  return sanity.fetch<SanityArticleFull>(`*[_type == "article" && slug.current == $slug][0] {
    "id": slug.current,
    "section": section->slug.current,
    "sectionIcon": section->icon,
    pubDate,
    readingTime,
    author,
    featured,
    blockedIn,
    ${langProjection('article')},
    ${langBodyProjection()}
  }`, { slug });
}

export async function getFaqItems() {
  return sanity.fetch<SanityFaq[]>(`*[_type == "faqItem"] | order(order asc) {
    "id": slug.current,
    order,
    blockedIn,
    ${langProjection('faq')},
    ${LANG_FIELDS.map((l) => `"answer_${l}": answer_${l}`).join(', ')}
  }`);
}

// ── Types ────────────────────────────────────────────────────────────────────

type LangFields<Prefix extends string, V = string> = {
  [L in typeof LANG_FIELDS[number] as `${Prefix}_${L}`]: V;
};

export type SanitySection = {
  id: string;
  title: string;
  icon: string;
  description: string;
  order: number;
};

export type SanityArticle = LangFields<'title'> & LangFields<'description'> & {
  id: string;
  section: string;
  pubDate: string;
  readingTime: number;
  author: string;
  featured: boolean;
  blockedIn: string[];
};

export type SanityArticleFull = SanityArticle & LangFields<'body'> & {
  sectionIcon: string;
  body_ru: string;
};

export type SanityFaq = LangFields<'question'> & LangFields<'answer'> & {
  id: string;
  order: number;
  blockedIn: string[];
};
