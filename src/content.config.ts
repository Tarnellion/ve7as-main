import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * `updated` — дата последней правки текста, YYYY-MM-DD. Нужна sitemap'у:
 * без неё статические страницы уходили к краулеру вовсе без `<lastmod>`.
 *
 * Необязательная и проставляется руками, а не берётся из даты сборки:
 * `<lastmod>`, который меняется на каждом деплое, Google ловит на расхождении
 * с содержимым страницы и перестаёт доверять ему по всему сайту. Страница без
 * даты просто уйдёт без `lastmod`, как раньше, — это честнее выдумки.
 *
 * У перевода своя дата: правка английского текста не делает свежее испанский.
 */
const pageSchema = z.object({
  title: z.string(),
  description: z.string(),
  updated: z.coerce.date().optional(),
});

const pages = defineCollection({
  loader: glob({ base: './src/content/pages', pattern: '**/*.md' }),
  schema: pageSchema,
});

const pageTranslations = defineCollection({
  loader: glob({ base: './src/content/translations/pages', pattern: '**/*.md' }),
  schema: pageSchema,
});

export const collections = {
  pages,
  pageTranslations,
};
