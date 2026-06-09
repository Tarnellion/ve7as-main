import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const sections = defineCollection({
  loader: glob({ base: './src/content/sections', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    icon: z.string(),
    description: z.string(),
    order: z.number().default(0),
  }),
});

const articles = defineCollection({
  loader: glob({ base: './src/content/articles', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    section: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    readingTime: z.number(),
    author: z.string().default('редакция'),
    featured: z.boolean().default(false),
  }),
});

const faq = defineCollection({
  loader: glob({ base: './src/content/faq', pattern: '**/*.md' }),
  schema: z.object({
    question: z.string(),
    order: z.number().default(0),
  }),
});

const pages = defineCollection({
  loader: glob({ base: './src/content/pages', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

/**
 * Translated copies of editorial content. Each entry id is `<lang>/<originalId>`,
 * e.g. `en/wagering-explained`. The Russian originals in `articles`/`faq`/`pages`
 * remain the canonical source for metadata (dates, sections, ordering, etc.);
 * these collections only carry the translatable text + body.
 */
const articleTranslations = defineCollection({
  loader: glob({ base: './src/content/translations/articles', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

const faqTranslations = defineCollection({
  loader: glob({ base: './src/content/translations/faq', pattern: '**/*.md' }),
  schema: z.object({
    question: z.string(),
  }),
});

const pageTranslations = defineCollection({
  loader: glob({ base: './src/content/translations/pages', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

export const collections = {
  sections,
  articles,
  faq,
  pages,
  articleTranslations,
  faqTranslations,
  pageTranslations,
};
