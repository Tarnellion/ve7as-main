#!/usr/bin/env node
/**
 * Копия векторных функций (vec.mjs) обязана совпадать с оригиналом
 * (embedding.mjs). Оригинал грузится динамически: он подключает onnxruntime.
 */
import { cosine as c1, dequantize as d1, normalizeVec as n1 } from './vec.mjs';
const { cosine: c2, dequantize: d2, normalizeVec: n2, quantize } = await import('./embedding.mjs');

let failed = 0;
const ok = (cond, label) => { console.log(`  ${cond ? '✓' : '✗'} ${label}`); if (!cond) failed++; };

const rnd = () => Float32Array.from({ length: 384 }, () => Math.random() - 0.5);
const a = n2(rnd()), b = n2(rnd());
ok(Math.abs(c1(a, b) - c2(a, b)) < 1e-9, 'cosine совпадает с оригиналом');
const q = quantize(a);
const da = d1(q), db = d2(q);
ok(da.length === db.length && da.every((x, i) => Math.abs(x - db[i]) < 1e-9), 'dequantize совпадает с оригиналом');
ok(n1(rnd()).every((x, i, arr) => Number.isFinite(x)), 'normalizeVec даёт конечные числа');
console.log(failed ? `\nПРОВАЛЕНО: ${failed}\n` : '\nВсе проверки пройдены.\n');
process.exit(failed ? 1 : 0);
