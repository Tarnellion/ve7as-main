/**
 * Copies old flat fields (title, description, body) → new lang-specific fields (title_ru, etc.)
 * Also migrates any existing translations[] array entries → title_en, body_en, etc.
 */
import { createClient } from '@sanity/client';

const sanity = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const articles = await sanity.fetch(`*[_type == "article"] {
  _id,
  title,
  description,
  body,
  title_ru,
  "translations": translations[] { lang, title, description, body }
}`);

console.log(`Found ${articles.length} articles`);

let patched = 0;
for (const article of articles) {
  const patch = {};

  // Copy main Russian fields if title_ru is empty
  if (!article.title_ru) {
    if (article.title)       patch.title_ru       = article.title;
    if (article.description) patch.description_ru = article.description;
    if (article.body)        patch.body_ru        = article.body;
  }

  // Copy existing translations[] entries to flat fields
  for (const tr of article.translations ?? []) {
    if (!tr.lang) continue;
    if (tr.title)       patch[`title_${tr.lang}`]       = tr.title;
    if (tr.description) patch[`description_${tr.lang}`] = tr.description;
    if (tr.body)        patch[`body_${tr.lang}`]        = tr.body;
  }

  if (Object.keys(patch).length === 0) {
    console.log(`  skip: ${article._id} (already migrated)`);
    continue;
  }

  await sanity.patch(article._id).set(patch).commit();
  patched++;
  console.log(`  patched: ${article._id} → [${Object.keys(patch).join(', ')}]`);
}

console.log(`\nDone. Patched ${patched}/${articles.length} articles.`);

// ── FAQ items ─────────────────────────────────────────────────────────────────
const faqs = await sanity.fetch(`*[_type == "faqItem"] {
  _id,
  question,
  answer,
  question_ru,
  "translations": translations[] { lang, question, answer }
}`);

console.log(`\nFound ${faqs.length} FAQ items`);
let faqPatched = 0;
for (const faq of faqs) {
  const patch = {};

  if (!faq.question_ru) {
    if (faq.question) patch.question_ru = faq.question;
    if (faq.answer)   patch.answer_ru   = faq.answer;
  }

  for (const tr of faq.translations ?? []) {
    if (!tr.lang) continue;
    if (tr.question) patch[`question_${tr.lang}`] = tr.question;
    if (tr.answer)   patch[`answer_${tr.lang}`]   = tr.answer;
  }

  if (Object.keys(patch).length === 0) {
    console.log(`  skip: ${faq._id}`);
    continue;
  }

  await sanity.patch(faq._id).set(patch).commit();
  faqPatched++;
  console.log(`  patched: ${faq._id} → [${Object.keys(patch).join(', ')}]`);
}
console.log(`Done. Patched ${faqPatched}/${faqs.length} FAQ items.`);
