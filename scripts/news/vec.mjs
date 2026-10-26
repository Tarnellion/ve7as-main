/**
 * Чистые векторные функции без зависимостей.
 *
 * Копия `cosine`, `normalizeVec` и `dequantize` из `embedding.mjs`. Копия, а не
 * импорт, потому что `embedding.mjs` на верхнем уровне подключает
 * `@huggingface/transformers`, то есть onnxruntime: ради двух чистых функций
 * тянуть его в генератор и в самопроверки незачем. Расхождение копий ловит
 * `selftest-vec.mjs`, который сверяет их с оригиналом.
 */

export function cosine(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

export function normalizeVec(v) {
  let n = 0;
  for (let i = 0; i < v.length; i++) n += v[i] * v[i];
  n = Math.sqrt(n);
  if (n === 0) return v;
  const out = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i] / n;
  return out;
}

export function dequantize(b64) {
  const buf = Buffer.from(b64, 'base64');
  const bytes = new Int8Array(buf.buffer, buf.byteOffset, buf.length);
  const out = new Float32Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] / 127;
  return normalizeVec(out);
}
