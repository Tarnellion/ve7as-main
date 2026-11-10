/**
 * IndexNow-пинг: сообщает Bing/Yandex об изменившихся URL.
 *
 * Ключ — не секрет: протокол IndexNow требует, чтобы он лежал публично
 * в корне сайта (файл <key>.txt), этим и подтверждается владение доменом.
 * Поэтому он захардкожен, а не спрятан в GitHub Secrets.
 *
 * Два режима, переключатель — INDEXNOW_SINCE_HOURS:
 *  - не задан — уходит весь sitemap. Так шлёт деплой: он меняет каждый
 *    шаблон, то есть изменилась каждая страница;
 *  - число часов — уходят только записи, чей <lastmod> попал в это окно.
 *    Так шлёт ежедневный прогон новостей: большинство статей публикуют
 *    руками уже после прогона, и узнать о них можно только из sitemap,
 *    а слать каждый день полный список значит приучить поисковик не
 *    верить пингу.
 * Лимит протокола — 10 000 URL за запрос, до него далеко в обоих режимах.
 *
 * Ответ 200/202 — принято; 4xx печатаем и НЕ роняем деплой (пинг —
 * оптимизация, а не обязательство).
 */
const KEY = '19a0c1ba6e4a4b128cf187709f745bf3';
const HOST = 've7as.com';

const res = await fetch(`https://${HOST}/sitemap.xml`);

// `no-store` sitemap отдаёт, когда Sanity недоступна и в нём остались одни
// статические маршруты (src/pages/sitemap.xml.ts). Пинг по такому списку
// молча пропустил бы всё, что изменилось, поэтому лучше не слать вовсе:
// следующий прогон подберёт те же изменения.
if (!res.ok || (res.headers.get('cache-control') ?? '').toLowerCase().includes('no-store')) {
  console.error(`[indexnow] sitemap недоступен или деградировал (HTTP ${res.status}) — пинг не отправлен`);
  process.exit(0);
}

const xml = await res.text();
const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)]
  .map(([, block]) => ({
    loc: block.match(/<loc>([^<]+)<\/loc>/)?.[1].trim(),
    lastmod: block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1].trim(),
  }))
  .filter((entry) => entry.loc);

if (entries.length === 0) {
  console.error('[indexnow] sitemap пуст — пинг не отправлен');
  process.exit(0);
}

const raw = process.env.INDEXNOW_SINCE_HOURS;
let changed = entries;
if (raw !== undefined) {
  const hours = Number(raw);
  if (Number.isFinite(hours) && hours > 0) {
    const now = Date.now();
    const since = now - hours * 3_600_000;
    // Запись без <lastmod> или с нечитаемой датой даёт NaN и не проходит ни
    // одно сравнение: «не знаем, когда менялась» не равно «менялась сейчас».
    changed = entries.filter(({ lastmod }) => {
      const at = Date.parse(lastmod ?? '');
      return at >= since && at <= now;
    });
  } else {
    // Опечатка в окне не должна молча отключать пинг: лишний полный список
    // безвреднее, чем ни одного URL.
    console.warn('[indexnow] INDEXNOW_SINCE_HOURS не число > 0 — отправляю весь sitemap');
  }
}

if (changed.length === 0) {
  console.log('[indexnow] нет изменившихся URL — пинг не отправлен');
  process.exit(0);
}

const urls = changed.map((entry) => entry.loc);

const ping = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls }),
});

console.log(`[indexnow] ${urls.length} URL -> ${ping.status} ${ping.statusText}`);
if (!ping.ok && ping.status !== 202) {
  console.error(await ping.text().catch(() => ''));
}
