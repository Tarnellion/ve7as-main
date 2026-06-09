import { createClient } from '@sanity/client';
import matter from 'gray-matter';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, basename } from 'path';

const client = createClient({
  projectId: 'g2lmhk5n',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_MIGRATE_TOKEN,
  useCdn: false,
});

const BASE = './src/content';
const LANGS = ['en', 'es', 'pt', 'de', 'fr', 'br'];

function readMd(filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  return matter(raw);
}

function fileId(file) {
  return basename(file, '.md');
}

// ── 1. Sections ──────────────────────────────────────────────────────────────
console.log('\n→ Migrating sections...');
const sectionFiles = readdirSync(`${BASE}/sections`).filter(f => f.endsWith('.md'));
const sectionIdMap = {}; // slug -> sanity _id

for (const file of sectionFiles) {
  const slug = fileId(file);
  const { data } = readMd(`${BASE}/sections/${file}`);

  const doc = {
    _type: 'section',
    _id: `section-${slug}`,
    title: data.title,
    slug: { _type: 'slug', current: slug },
    icon: data.icon ?? '',
    description: data.description ?? '',
    order: data.order ?? 0,
  };

  await client.createOrReplace(doc);
  sectionIdMap[slug] = `section-${slug}`;
  console.log(`  ✓ ${slug}`);
}

// ── 2. Articles ───────────────────────────────────────────────────────────────
console.log('\n→ Migrating articles...');
const articleFiles = readdirSync(`${BASE}/articles`).filter(f => f.endsWith('.md'));

for (const file of articleFiles) {
  const slug = fileId(file);
  const { data, content } = readMd(`${BASE}/articles/${file}`);

  // Collect translations
  const translations = [];
  for (const lang of LANGS) {
    const tPath = `${BASE}/translations/articles/${lang}/${file}`;
    if (existsSync(tPath)) {
      const { data: td, content: tc } = readMd(tPath);
      translations.push({
        _type: 'translation',
        _key: lang,
        lang,
        title: td.title ?? '',
        description: td.description ?? '',
        body: tc.trim(),
      });
    }
  }

  const sectionSlug = data.section;
  const sectionRef = sectionIdMap[sectionSlug];

  const doc = {
    _type: 'article',
    _id: `article-${slug}`,
    title: data.title,
    slug: { _type: 'slug', current: slug },
    section: sectionRef ? { _type: 'reference', _ref: sectionRef } : undefined,
    description: data.description ?? '',
    pubDate: new Date(data.pubDate).toISOString(),
    author: data.author ?? 'редакция',
    readingTime: data.readingTime ?? 5,
    featured: data.featured ?? false,
    body: content.trim(),
    blockedIn: [],
    translations,
  };

  await client.createOrReplace(doc);
  console.log(`  ✓ ${slug} (${translations.length} translations)`);
}

// ── 3. FAQ ────────────────────────────────────────────────────────────────────
console.log('\n→ Migrating FAQ...');
const faqFiles = readdirSync(`${BASE}/faq`).filter(f => f.endsWith('.md'));

for (const file of faqFiles) {
  const slug = fileId(file);
  const { data, content } = readMd(`${BASE}/faq/${file}`);

  const translations = [];
  for (const lang of LANGS) {
    const tPath = `${BASE}/translations/faq/${lang}/${file}`;
    if (existsSync(tPath)) {
      const { data: td, content: tc } = readMd(tPath);
      translations.push({
        _type: 'translation',
        _key: lang,
        lang,
        question: td.question ?? '',
        answer: tc.trim(),
      });
    }
  }

  const doc = {
    _type: 'faqItem',
    _id: `faq-${slug}`,
    question: data.question,
    slug: { _type: 'slug', current: slug },
    answer: content.trim(),
    order: data.order ?? 0,
    blockedIn: [],
    translations,
  };

  await client.createOrReplace(doc);
  console.log(`  ✓ ${slug} (${translations.length} translations)`);
}

console.log('\n✅ Migration complete!');
