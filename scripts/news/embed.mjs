#!/usr/bin/env node
/**
 * Калибровка порога ступени 2: распределение косинусов и выгрузка пар под
 * ручную разметку. Сам счёт векторов живёт в `embedding.mjs`.
 *
 * Порог берётся из РАЗМЕТКИ пар человеком, а не из литературы: именно для
 * этого сюда выгружается calibration.csv. Решения о выборе модели, текста под
 * эмбеддинг и префикса «query: » задокументированы в embedding.mjs — здесь они
 * не повторяются, чтобы две копии объяснения не разошлись.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { embedTexts, embedText, cosine, MODEL } from './embedding.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PIPE = join(HERE, '..', '..', '.pipeline');
const TOP = Number(process.env.TOP_PAIRS ?? 60);

const { candidates } = JSON.parse(readFileSync(join(PIPE, 'candidates.json'), 'utf8'));
console.log(`Эмбеддинги для ${candidates.length} кандидатов, модель ${MODEL}\n`);

const vecs = await embedTexts(candidates.map((c) => embedText(c.title, c.lead)), {
  onProgress: (n, total) => process.stdout.write(`\r  посчитано ${n}/${total}`),
});
console.log(`\n  измерений: ${vecs[0].length}\n`);

const pairs = [];
for (let i = 0; i < vecs.length; i++)
  for (let j = i + 1; j < vecs.length; j++) pairs.push([cosine(vecs[i], vecs[j]), i, j]);
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
