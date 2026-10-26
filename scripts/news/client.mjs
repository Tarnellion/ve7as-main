/**
 * Клиент Anthropic для конвейера: один способ получить учётные данные во
 * всех средах — на ноутбуке, в GitHub Actions по ключу и в Actions по
 * федерации удостоверений.
 *
 * ПОЧЕМУ ФЕДЕРАЦИЯ ТРЕБУЕТ СВОЕГО ПРОВАЙДЕРА, А НЕ ФАЙЛА С ТОКЕНОМ
 *
 * Документация Anthropic: токены удостоверения, у которых есть `jti`, —
 * одноразовые. Повторный обмен того же JWT отклоняется (`jti_reused`), а SDK
 * перечитывает `ANTHROPIC_IDENTITY_TOKEN_FILE` при КАЖДОМ обновлении
 * токена доступа. Токен GitHub Actions несёт `jti` и живёт недолго, поэтому
 * схема «записал токен в файл один раз перед запуском» работает ровно до
 * первого обновления: прогон, дольше жизни токена доступа, падает посреди
 * работы — после того, как часть фаз уже оплачена.
 *
 * Поэтому в Actions берём токен функцией: на каждый обмен запрашиваем у
 * GitHub новый JWT. SDK принимает `IdentityTokenProvider` как функцию
 * `() => string | Promise<string>` — файл для этого не нужен.
 *
 * ПОРЯДОК ВЫБОРА (совпадает с цепочкой SDK, чтобы поведение не удивляло):
 *   1. ANTHROPIC_API_KEY / ANTHROPIC_AUTH_TOKEN — ключ побеждает всегда.
 *      Документация предупреждает: оставленный ключ молча перекрывает
 *      федерацию. Поэтому при обоих способах сразу пишем об этом.
 *   2. Федерация из GitHub Actions — три идентификатора + OIDC-эндпоинт.
 *   3. Всё остальное отдаём цепочке SDK: файл токена, профиль `ant auth login`.
 */
import Anthropic from '@anthropic-ai/sdk';
import { oidcFederationProvider } from '@anthropic-ai/sdk/lib/credentials/oidc-federation';

const FEDERATION_VARS = [
  'ANTHROPIC_FEDERATION_RULE_ID',
  'ANTHROPIC_ORGANIZATION_ID',
  'ANTHROPIC_SERVICE_ACCOUNT_ID',
];

/** Свежий JWT от GitHub под нужную аудиторию. Вызывается на каждый обмен. */
export async function githubIdentityToken(env = process.env, fetchImpl = fetch) {
  const url = new URL(env.ACTIONS_ID_TOKEN_REQUEST_URL);
  url.searchParams.set('audience', env.ANTHROPIC_OIDC_AUDIENCE || 'https://api.anthropic.com');
  const res = await fetchImpl(url, {
    headers: {
      Authorization: `bearer ${env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}`,
      Accept: 'application/json; api-version=2.0',
    },
  });
  if (!res.ok) {
    throw new Error(
      `GitHub не выдал OIDC-токен (HTTP ${res.status}). Проверьте, что у задания есть ` +
      '`permissions: id-token: write`.');
  }
  const { value } = await res.json();
  if (!value) throw new Error('GitHub вернул ответ без поля value — токена нет.');
  return value;
}

/**
 * @returns {{ client: Anthropic, source: string, warning?: string }}
 * `source` — человекочитаемо, чем воспользовались: печатается в начале прогона,
 * чтобы по логу было видно, ключ это или федерация.
 */
export function makeClient(env = process.env, { baseURL, fetchImpl } = {}) {
  const hasKey = Boolean(env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN);
  const hasFederation = FEDERATION_VARS.every((v) => env[v]);
  const inActions = Boolean(env.ACTIONS_ID_TOKEN_REQUEST_URL && env.ACTIONS_ID_TOKEN_REQUEST_TOKEN);
  const clientOpts = baseURL ? { baseURL } : {};

  if (hasKey) {
    // Значения берём из переданного env, а не оставляем SDK читать process.env:
    // функция принимает env аргументом и должна его уважать, иначе её нельзя
    // проверить, не подменив окружение всего процесса.
    const auth = env.ANTHROPIC_API_KEY
      ? { apiKey: env.ANTHROPIC_API_KEY }
      : { authToken: env.ANTHROPIC_AUTH_TOKEN };
    return {
      client: new Anthropic({ ...clientOpts, ...auth }),
      source: env.ANTHROPIC_API_KEY ? 'ключ ANTHROPIC_API_KEY' : 'токен ANTHROPIC_AUTH_TOKEN',
      warning: hasFederation
        ? 'Заданы и ключ, и идентификаторы федерации: ключ имеет приоритет и перекрывает федерацию. ' +
          'Чтобы перейти на федерацию, удалите ключ из секретов.'
        : undefined,
    };
  }

  if (hasFederation && inActions) {
    const base = baseURL ?? env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com';
    const credentials = oidcFederationProvider({
      identityTokenProvider: () => githubIdentityToken(env, fetchImpl ?? fetch),
      federationRuleId: env.ANTHROPIC_FEDERATION_RULE_ID,
      organizationId: env.ANTHROPIC_ORGANIZATION_ID,
      serviceAccountId: env.ANTHROPIC_SERVICE_ACCOUNT_ID,
      workspaceId: env.ANTHROPIC_WORKSPACE_ID || undefined,
      baseURL: base,
      fetch: fetchImpl ?? fetch,
    });
    return {
      client: new Anthropic({ credentials, baseURL: base }),
      source: 'федерация удостоверений: GitHub OIDC, свежий токен на каждый обмен',
    };
  }

  return {
    client: new Anthropic(clientOpts),
    source: hasFederation
      ? 'федерация удостоверений: токен из файла (цепочка SDK)'
      : 'цепочка SDK: явных переменных нет, рассчитываю на профиль `ant auth login`',
  };
}
