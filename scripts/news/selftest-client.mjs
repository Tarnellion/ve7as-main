#!/usr/bin/env node
/**
 * Проверка клиента без единого настоящего ключа: локальный мок вместо GitHub
 * и вместо Anthropic. Нужна потому, что федерацию нельзя проверить, не
 * настроив её в Console, а ломается она именно на нюансах — одноразовости
 * `jti` и порядке выбора способа.
 *
 *   node scripts/news/selftest-client.mjs
 *
 * Проверяет четыре вещи:
 *   1. на каждый обмен запрашивается НОВЫЙ JWT, а не один и тот же;
 *   2. обмен несёт правильные идентификаторы и тип гранта;
 *   3. API-вызов уходит с токеном, выданным обменом, а не с чем-то иным;
 *   4. ключ перекрывает федерацию, и об этом предупреждают.
 */
import http from 'node:http';
import { makeClient } from './client.mjs';

let failed = 0;
const ok = (cond, label, detail = '') => {
  console.log(`  ${cond ? '✓' : '✗'} ${label}${!cond && detail ? ` — ${detail}` : ''}`);
  if (!cond) failed++;
};

const log = { oidc: [], exchanges: [], messages: [] };
let jwtCounter = 0;
let tokenCounter = 0;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    if (url.pathname === '/gh-oidc') {
      log.oidc.push({ auth: req.headers.authorization, audience: url.searchParams.get('audience') });
      res.setHeader('content-type', 'application/json');
      return res.end(JSON.stringify({ value: `jwt-${++jwtCounter}` }));
    }
    if (url.pathname === '/v1/oauth/token') {
      const parsed = JSON.parse(body);
      log.exchanges.push(parsed);
      res.setHeader('content-type', 'application/json');
      // 20 секунд — меньше порога обязательного обновления (30 с), поэтому
      // следующий вызов обязан сделать новый обмен.
      return res.end(JSON.stringify({ access_token: `sk-ant-oat01-mock-${++tokenCounter}`, expires_in: 20, token_type: 'Bearer' }));
    }
    if (url.pathname === '/v1/messages') {
      log.messages.push({ auth: req.headers.authorization });
      res.setHeader('content-type', 'application/json');
      return res.end(JSON.stringify({
        id: 'msg_1', type: 'message', role: 'assistant', model: 'claude-sonnet-5-5',
        content: [{ type: 'text', text: 'ok' }], stop_reason: 'end_turn', stop_sequence: null,
        usage: { input_tokens: 1, output_tokens: 1 },
      }));
    }
    res.statusCode = 404;
    res.end('{}');
  });
});

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

// В Actions несозданный секрет приходит пустой строкой, а не отсутствует:
// `ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}` даёт переменную "".
// Документация предупреждает, что заданный (даже пустой) ключ перекрывает
// федерацию в цепочке SDK, поэтому проверяем это на настоящих запросах.
process.env.ANTHROPIC_API_KEY = '';

console.log('\nФедерация в Actions: свежий JWT на каждый обмен');
const fedEnv = {
  ANTHROPIC_FEDERATION_RULE_ID: 'fdrl_test',
  ANTHROPIC_ORGANIZATION_ID: '00000000-0000-0000-0000-000000000000',
  ANTHROPIC_SERVICE_ACCOUNT_ID: 'svac_test',
  ACTIONS_ID_TOKEN_REQUEST_URL: `${base}/gh-oidc?existing=1`,
  ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'runner-request-token',
};
const fed = makeClient({ ...fedEnv, ANTHROPIC_API_KEY: '' }, { baseURL: base });
ok(/федерация/.test(fed.source), `пустой секрет не перекрывает федерацию: ${fed.source}`);

const msg = { model: 'claude-sonnet-5-5', max_tokens: 10, messages: [{ role: 'user', content: 'hi' }] };
await fed.client.messages.create(msg);
await fed.client.messages.create(msg);

ok(log.exchanges.length === 2, `два вызова потребовали два обмена (${log.exchanges.length})`,
  'токен жил 20 с — второй вызов обязан был обновить его');
ok(new Set(log.exchanges.map((e) => e.assertion)).size === log.exchanges.length,
  'каждый обмен получил РАЗНЫЙ JWT', JSON.stringify(log.exchanges.map((e) => e.assertion)));
ok(log.oidc.every((o) => o.audience === 'https://api.anthropic.com'), 'аудитория запроса — https://api.anthropic.com');
ok(log.oidc.every((o) => o.auth === 'bearer runner-request-token'), 'запрос к GitHub несёт токен раннера');
const ex = log.exchanges[0];
ok(ex.grant_type === 'urn:ietf:params:oauth:grant-type:jwt-bearer', 'тип гранта jwt-bearer');
ok(ex.federation_rule_id === 'fdrl_test' && ex.service_account_id === 'svac_test'
  && ex.organization_id === '00000000-0000-0000-0000-000000000000', 'в обмене все три идентификатора');
ok(log.messages[0].auth === 'Bearer sk-ant-oat01-mock-1' && log.messages[1].auth === 'Bearer sk-ant-oat01-mock-2',
  'API-вызовы ушли с токенами, выданными обменом', JSON.stringify(log.messages));

console.log('\nКлюч перекрывает федерацию');
const both = makeClient({ ...fedEnv, ANTHROPIC_API_KEY: 'sk-ant-api03-test' }, { baseURL: base });
ok(/ключ/.test(both.source), `источник: ${both.source}`);
ok(Boolean(both.warning), 'есть предупреждение о перекрытии федерации');
const before = log.exchanges.length;
await both.client.messages.create(msg);
ok(log.exchanges.length === before, 'федеративный обмен при ключе не выполнялся');

console.log('\nБез ключа и без Actions');
const bare = makeClient({}, { baseURL: base });
ok(/цепочка SDK/.test(bare.source), `источник: ${bare.source}`);

server.close();
console.log(failed ? `\nПРОВАЛЕНО: ${failed}\n` : '\nВсе проверки пройдены.\n');
process.exit(failed ? 1 : 0);
