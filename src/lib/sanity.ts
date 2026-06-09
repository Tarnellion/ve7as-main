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
  const lines = (md ?? '').split('\n');
  for (const line of lines) {
    const m = line.match(/^(#{1,6})\s+(.+)$/);
    if (m) {
      const text = m[2].trim();
      const slug = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      headings.push({ depth: m[1].length, text, slug });
    }
  }
  return headings;
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
    title,
    description,
    "section": section->slug.current,
    pubDate,
    readingTime,
    author,
    featured,
    blockedIn,
    translations[] { lang, title, description }
  }`);
}

export async function getArticleBySlug(slug: string) {
  return sanity.fetch<SanityArticleFull>(`*[_type == "article" && slug.current == $slug][0] {
    "id": slug.current,
    title,
    description,
    "section": section->slug.current,
    "sectionTitle": section->title,
    "sectionIcon": section->icon,
    pubDate,
    readingTime,
    author,
    featured,
    blockedIn,
    body,
    translations[] { lang, title, description, body }
  }`, { slug });
}

export async function getFaqItems() {
  return sanity.fetch<SanityFaq[]>(`*[_type == "faqItem"] | order(order asc) {
    "id": slug.current,
    question,
    answer,
    order,
    blockedIn,
    translations[] { lang, question, answer }
  }`);
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface SanitySection {
  id: string;
  title: string;
  icon: string;
  description: string;
  order: number;
}

export interface SanityArticle {
  id: string;
  title: string;
  description: string;
  section: string;
  pubDate: string;
  readingTime: number;
  author: string;
  featured: boolean;
  blockedIn: string[];
  translations: { lang: string; title: string; description: string }[];
}

export interface SanityArticleFull extends SanityArticle {
  sectionTitle: string;
  sectionIcon: string;
  body: string;
  translations: { lang: string; title: string; description: string; body: string }[];
}

export interface SanityFaq {
  id: string;
  question: string;
  answer: string;
  order: number;
  blockedIn: string[];
  translations: { lang: string; question: string; answer: string }[];
}
