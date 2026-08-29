#!/usr/bin/env node
/**
 * Ступень 2 каскада: эмбеддинги и косинусная близость.
 *
 * Модель считается ЛОКАЛЬНО (transformers.js, multilingual-e5-small, 384
 * измерения). Причины именно локального счёта: ноль внешних квот — ничто не
 * отдаст 429 посреди прогона; детерминизм — одна версия модели даёт стабильные
 * векторы, а сравнивать придётся через месяцы; 384 измерения экономнее 1024
 * в 2,7 раза при хранении base64 в документе.
 *
 * Эмбеддится заголовок плюс лид, а не тело целиком: бойлерплейт «18+» и
 * «играйте ответственно» поднимает косинус любой пары внутри раздела и убивает
 * разделяющую способность. И не один заголовок — кликбейтные переформулировки
 * одного события дают 0,6-0,7 и прошли бы как разные.
 *
 * Префикс «query: » обязателен с ОБЕИХ сторон сравнения: задача симметричная,
 * так обучалась модель e5.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pipeline } from '@huggingface/transformers';

const HERE = dirname(fileURLToPath(import.meta.url));
const PIPE = join(HERE, '..', '..', '.pipeline');
const MODEL = 'Xenova/multilingual-e5-small';
const TOP = Number(process.env.TOP_PAIRS ?? 60);

const { candidates } = JSON.parse(readFileSync(join(PIPE, 'candidates.json'), 'utf8'));
console.log(`Эмбеддинги для ${candidates.length} кандидатов, модель ${MODEL}\n`);

const extractor = await pipeline('feature-extraction', MODEL, { dtype: 'fp32' });
const texts = candidates.map((c) => `query: ${c.title}. ${c.lead}`.slice(0, 512));

const vecs = [];
const BATCH = 16;
for (let i = 0; i < texts.length; i += BATCH) {
  const out = await extractor(texts.slice(i, i + BATCH), { pooling: 'mean', normalize: true });
  const dim = out.dims[out.dims.length - 1];
  const data = out.data;
  for (let k = 0; k < out.dims[0]; k++) vecs.push(Float32Array.from(data.slice(k * dim, (k + 1) * dim)));
  process.stdout.write(`\r  посчитано ${Math.min(i + BATCH, texts.length)}/${texts.length}`);
}
console.log(`\n  измерений: ${vecs[0].length}\n`);

/** Векторы нормализованы, поэтому косинус — это скалярное произведение. */
const cos = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };

const pairs = [];
for (let i = 0; i < vecs.length; i++)
  for (let j = i + 1; j < vecs.length; j++) pairs.push([cos(vecs[i], vecs[j]), i, j]);
pairs.sort((a, b) => b[0] - a[0]);

const buckets = {};
for (const [s] of pairs) { const b = (Math.floor(s * 20) / 20).toFixed(2); buckets[b] = (buckets[b] || 0) + 1; }
console.log('  распределение косинусов:');
for (const k of Object.keys(buckets).sort((a, b) => b - a).slice(0, 12))
  console.log(`    ${k}  ${String(buckets[k]).padStart(6)}  ${'#'.repeat(Math.min(40, Math.round(buckets[k] / pairs.length * 300)))}`);

console.log(`\n  топ-12 пар — размечать глазами:`);
for (const [s, i, j] of pairs.slice(0, 12)) {
  const same = candidates[i].group === candidates[j].group ? ' [одна группа]' : '';
  console.log(`    ${s.toFixed(3)}${same}`);
  console.log(`      [${candidates[i].source}] ${candidates[i].title.slice(0, 62)}`);
  console.log(`      [${candidates[j].source}] ${candidates[j].title.slice(0, 62)}`);
}

// CSV под ручную разметку: именно она даёт порог, а не число из литературы.
const rows = pairs.filter(([s]) => s >= 0.70 && s <= 0.995).slice(0, TOP)
  .map(([s, i, j]) => [s.toFixed(4), '', candidates[i].source, JSON.stringify(candidates[i].title),
                       candidates[j].source, JSON.stringify(candidates[j].title),
                       candidates[i].canonicalUrl, candidates[j].canonicalUrl].join(','));
writeFileSync(join(PIPE, 'calibration.csv'),
  'cosine,label_DUP_FOLLOWUP_DIFFERENT,source_a,title_a,source_b,title_b,url_a,url_b\n' + rows.join('\n'));
console.log(`\n  на разметку: .pipeline/calibration.csv (${rows.length} пар в диапазоне 0.70-0.995)`);
