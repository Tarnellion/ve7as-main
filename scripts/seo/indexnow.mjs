/**
 * IndexNow-пинг: сообщает Bing/Yandex об изменившихся URL после деплоя.
 *
 * Ключ — не секрет: протокол IndexNow требует, чтобы он лежал публично
 * в корне сайта (файл <key>.txt), этим и подтверждается владение доменом.
 * Поэтому он захардкожен, а не спрятан в GitHub Secrets.
 *
 * Шлём все URL из sitemap: их 38, лимит протокола — 10 000 за запрос.
 * Ответ 200/202 — принято; 4xx печатаем и НЕ роняем деплой (пинг —
 * оптимизация, а не обязательство).
 */
const KEY = '19a0c1ba6e4a4b128cf187709f745bf3';
const HOST = 've7as.com';

const res = await fetch(`https://${HOST}/sitemap.xml`);
const xml = await res.text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

if (urls.length === 0) {
  console.error('[indexnow] sitemap пуст — пинг не отправлен');
  process.exit(0);
}

const ping = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls }),
});

console.log(`[indexnow] ${urls.length} URL -> ${ping.status} ${ping.statusText}`);
if (!ping.ok && ping.status !== 202) {
  console.error(await ping.text().catch(() => ''));
}
