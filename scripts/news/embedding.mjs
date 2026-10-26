/**
 * Общее ядро ступени 2: векторизация и косинусная близость.
 *
 * Вынесено из `embed.mjs`, потому что считать векторы нужно и калибровке,
 * и кластеризации. Две копии кода модели разошлись бы на первой же смене
 * параметров, а расхождение здесь не падает с ошибкой — оно тихо сдвигает
 * пороги, калиброванные на другой версии.
 *
 * Модель считается ЛОКАЛЬНО (transformers.js, multilingual-e5-small, 384
 * измерения): ноль внешних квот, детерминизм между прогонами, разделёнными
 * месяцами, и экономия хранения втрое против 1024 измерений.
 */
import { pipeline } from '@huggingface/transformers';

export const MODEL = 'Xenova/multilingual-e5-small';
export const DIMS = 384;

/**
 * Текст под эмбеддинг: заголовок плюс лид.
 *
 * Не тело целиком — бойлерплейт «18+» и «играйте ответственно» одинаков у всех
 * и поднимает косинус любой пары внутри раздела, съедая разделяющую
 * способность. И не один заголовок — кликбейтные переформулировки одного
 * события дают 0,6-0,7 и разошлись бы как разные новости.
 *
 * Префикс «query: » обязателен с ОБЕИХ сторон сравнения: задача симметричная,
 * так обучалась e5.
 */
export const embedText = (title, lead) => `query: ${title}. ${lead}`.slice(0, 512);

let extractor = null;

/** Вектора нормализованы на выходе модели, поэтому косинус — скалярное произведение. */
export function cosine(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

/** Нормализация на единичную длину: после усреднения векторов она теряется. */
export function normalizeVec(v) {
  let n = 0;
  for (let i = 0; i < v.length; i++) n += v[i] * v[i];
  n = Math.sqrt(n);
  if (n === 0) return v;
  const out = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i] / n;
  return out;
}

/** Центроид кластера — нормализованное среднее. */
export function centroidOf(vecs) {
  const sum = new Float32Array(vecs[0].length);
  for (const v of vecs) for (let i = 0; i < v.length; i++) sum[i] += v[i];
  return normalizeVec(sum);
}

/**
 * Хранение вектора: int8 в base64.
 *
 * 384 float32 — это 1536 байт на документ; int8 даёт 384 байта, в base64 512
 * символов. При 60 новостях в месяц разница между 1,1 МБ и 0,37 МБ в год
 * сама по себе не критична, но вектор лежит ВНУТРИ документа Sanity и
 * приезжает с каждым запросом к нему — там платят за трафик, а не за диск.
 *
 * Цена квантования измерена, а не взята на веру: см. `quantizationError()`.
 * Координаты нормализованного 384-мерного вектора лежат около ±0,05, поэтому
 * множитель привязан к максимуму вектора, а не к единице — иначе весь вектор
 * схлопнулся бы в несколько уровней из 255 доступных.
 */
export function quantize(vec) {
  let max = 0;
  for (const x of vec) max = Math.max(max, Math.abs(x));
  const scale = max || 1;
  const bytes = new Int8Array(vec.length);
  for (let i = 0; i < vec.length; i++) bytes[i] = Math.round((vec[i] / scale) * 127);
  return Buffer.from(bytes.buffer).toString('base64');
}

/** Обратное преобразование. Масштаб не хранится: нормализация его восстанавливает. */
export function dequantize(b64) {
  const buf = Buffer.from(b64, 'base64');
  const bytes = new Int8Array(buf.buffer, buf.byteOffset, buf.length);
  const out = new Float32Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] / 127;
  return normalizeVec(out);
}

/** Насколько квантование сдвигает косинус. Нужно для проверки, что порог 0.90 переживает хранение. */
export function quantizationError(vec) {
  return 1 - cosine(vec, dequantize(quantize(vec)));
}

/** Векторизация пачками. Модель грузится один раз на процесс. */
export async function embedTexts(texts, { batch = 16, onProgress } = {}) {
  extractor ??= await pipeline('feature-extraction', MODEL, { dtype: 'fp32' });
  const vecs = [];
  for (let i = 0; i < texts.length; i += batch) {
    const out = await extractor(texts.slice(i, i + batch), { pooling: 'mean', normalize: true });
    const dim = out.dims[out.dims.length - 1];
    for (let k = 0; k < out.dims[0]; k++) {
      vecs.push(Float32Array.from(out.data.slice(k * dim, (k + 1) * dim)));
    }
    onProgress?.(Math.min(i + batch, texts.length), texts.length);
  }
  return vecs;
}
