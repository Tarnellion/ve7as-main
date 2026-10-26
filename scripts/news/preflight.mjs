#!/usr/bin/env node
/**
 * Предполётная проверка: всё, что можно проверить БЕСПЛАТНО, до первого платного вызова.
 *
 * Зачем. Раньше доставка (`deliver.mjs`) первой узнавала, что токен Sanity не заведён или в
 * переменной режима опечатка, — после того как генерация уже стоила $0.6-1.5. Неверная
 * настройка детерминирована: она повторялась бы каждое утро по расписанию, и каждое утро
 * платным результатом был бы только артефакт, который никто не доставит. Здесь та же ошибка
 * обнаруживается за секунды и бесплатно.
 *
 *   node scripts/news/preflight.mjs
 *
 * Жёсткий отказ (код 1) — только когда сервис ОТВЕТИЛ «нет доступа» или настройка заведомо
 * неверна. Сетевой сбой и неожиданный ответ — предупреждение: проверка не должна сама
 * стать причиной простоя, если сервис просто недоступен на минуту.
 */
import { createClient } from '@sanity/client';
import { makeClient } from './client.mjs';
import { modeEnv, positiveEnv, intEnv } from './env.mjs';
import { minGroups, maxPerRun } from './policy.mjs';

let failed = 0;
const fail = (msg) => { console.error(`  ✗ ${msg}`); failed++; };
const ok = (msg) => console.log(`  ✓ ${msg}`);
const warn = (msg) => console.log(`  ⚠ ${msg}`);
const denied = (e) => e?.status === 401 || e?.statusCode === 401 || e?.status === 403 || e?.statusCode === 403;

console.log('\nПредполётная проверка');

const mode = modeEnv();
if (!mode.valid) fail(`NEWS_PUBLISH_MODE=${JSON.stringify(mode.raw)}: допустимы только draft и auto`);
else ok(`режим доставки: ${mode.mode}`);

// Числовые ручки читаются безопасно: опечатка заменяется значением по умолчанию с предупреждением.
const knobs = {
  'событий за прогон': intEnv('NEWS_PER_RUN', 2, { min: 1, max: 20 }),
  'голосов для auto (не ниже 3)': minGroups(),
  'потолок публикаций за прогон': maxPerRun(),
  'потолок трат прогона, $': positiveEnv('NEWS_RUN_BUDGET', 4, { max: 50 }),
};
for (const [k, v] of Object.entries(knobs)) ok(`${k}: ${v}`);

const { SANITY_PROJECT_ID: projectId, SANITY_DATASET: dataset, SANITY_WRITE_TOKEN: token } = process.env;
if (!projectId || !dataset) fail('не заданы SANITY_PROJECT_ID и SANITY_DATASET');
if (!token) {
  fail('не задан SANITY_WRITE_TOKEN: без него доставка невозможна, а платная генерация была бы потрачена зря');
} else if (projectId && dataset) {
  const host = process.env.SANITY_API_HOST ? { apiHost: process.env.SANITY_API_HOST, useProjectHostname: false } : {};
  const sanity = createClient({ projectId, dataset, apiVersion: '2025-02-19', useCdn: false, token, ...host });
  try {
    await sanity.request({ uri: '/users/me' });
    ok('токен Sanity принят');
  } catch (e) {
    if (denied(e)) fail('Sanity отклонил SANITY_WRITE_TOKEN (недействителен или отозван)');
    else warn(`проверить токен Sanity не удалось (${String(e.message ?? e).slice(0, 80)}): продолжаю`);
  }
}

try {
  const made = makeClient();
  console.log(`  · доступ к API: ${made.source}`);
  if (made.warning) warn(made.warning);
  await made.client.models.list({ limit: 1 });
  ok('учётные данные Anthropic приняты');
} catch (e) {
  if (denied(e)) fail('Anthropic отклонил учётные данные (ключ неверен/отозван либо федерация не настроена)');
  else warn(`проверить доступ к Anthropic не удалось (${String(e.message ?? e).slice(0, 100)}): продолжаю`);
}

console.log(failed ? `\nПРЕДПОЛЁТНАЯ ПРОВЕРКА НЕ ПРОЙДЕНА (${failed}): платный этап не запускается\n` : '\nГотово к запуску.\n');
process.exit(failed ? 1 : 0);
