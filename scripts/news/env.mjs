/**
 * Чтение числовых переменных окружения БЕЗОПАСНЫМ способом.
 *
 * Все ручки конвейера — предохранители: потолок трат, потолок публикаций,
 * порог подтверждений. Прежний `Number(env.X ?? default)` превращал опечатку
 * («2,5», «three», пустая строка) в NaN или 0, а сравнение с NaN всегда ложно —
 * то есть предохранитель молча отключался. Ревью перед запуском нашло это
 * независимо двумя рецензентами.
 *
 * Правило здесь одно: недопустимое значение НЕ ослабляет защиту, а заменяется
 * значением по умолчанию и громко объявляется в логе.
 */

function warn(name, raw, expectation, def) {
  console.warn(`  ! ${name}=${JSON.stringify(raw)} недопустимо (${expectation}); беру значение по умолчанию ${def}`);
}

/** Целое в [min, max]. */
export function intEnv(name, def, { min = -Infinity, max = Infinity } = {}, env = process.env) {
  const raw = env[name];
  if (raw === undefined || String(raw).trim() === '') return def;
  const n = Number(String(raw).trim());
  if (!Number.isInteger(n) || n < min || n > max) {
    warn(name, raw, `нужно целое от ${min} до ${max}`, def);
    return def;
  }
  return n;
}

/** Конечное число строго больше нуля (деньги, лимиты). */
export function positiveEnv(name, def, { max = Infinity } = {}, env = process.env) {
  const raw = env[name];
  if (raw === undefined || String(raw).trim() === '') return def;
  const n = Number(String(raw).trim());
  if (!Number.isFinite(n) || n <= 0 || n > max) {
    warn(name, raw, `нужно число больше 0 и не больше ${max}`, def);
    return def;
  }
  return n;
}

/** Режим доставки. Регистр не важен: «Auto» в переменной не должен молча ронять прогон. */
export function modeEnv(env = process.env) {
  const raw = (env.NEWS_PUBLISH_MODE ?? '').trim().toLowerCase();
  if (raw === '') return { mode: 'draft', valid: true };
  if (raw === 'draft' || raw === 'auto') return { mode: raw, valid: true };
  return { mode: 'draft', valid: false, raw: env.NEWS_PUBLISH_MODE };
}
