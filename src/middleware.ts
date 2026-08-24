import { defineMiddleware } from 'astro:middleware';
import { isLanguage } from './i18n/languages';

/**
 * Пути, которые не являются страницами и не должны проходить ни нормализацию
 * слеша, ни проверку языка: служебные маршруты Astro и сама страница 404.
 */
const RESERVED_PREFIXES = ['/_astro/', '/_image', '/_server-islands/', '/_actions/'];

/**
 * Статика, которая отдаётся как есть, мимо языковых маршрутов.
 *
 * Именно список расширений, а не «есть ли точка в пути». Раньше здесь стояла
 * проверка на любую точку, и это открывало дыру ровно того класса, ради
 * которого проверка языка и вводилась: `/wp-login.php` проскакивал мимо неё,
 * попадал в маршрут `[lang]` и отдавал 200 с русской главной. Для сканеров
 * уязвимостей, которые перебирают такие пути пачками, это бесконечный
 * источник soft-404 в индексе.
 */
const ASSET_EXTENSIONS =
  /\.(xml|txt|ico|svg|png|jpe?g|gif|webp|avif|css|js|mjs|map|json|webmanifest|woff2?|ttf|otf|pdf)$/i;

function isReserved(pathname: string): boolean {
  if (pathname === '/404' || pathname === '/404/') return true;
  if (RESERVED_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  // Файлы отдаются как есть: sitemap.xml, robots.txt, favicon.svg и статика.
  return ASSET_EXTENSIONS.test(pathname);
}

/* ── Edge-кэш HTML ───────────────────────────────────────────────────────── */

/**
 * Сайт полностью SSR, поэтому без кэша каждый хит уходил в Sanity. Узкое место —
 * не лимит Cloudflare (100 000 запросов/сутки), а квота Sanity: 1 000 000
 * CDN-запросов в месяц (~33 000/сутки), при исчерпании которой Sanity отдаёт
 * HTTP 402 и сайт ложится целиком.
 *
 * Кэш в воркере снимает линейную зависимость от трафика: число обращений к
 * Sanity сверху ограничено `уникальные_страницы × страны × (86400 / TTL)`,
 * а не количеством просмотров.
 *
 * TTL = 300 с (верх разрешённого диапазона) выбран сознательно:
 *   • он же задаёт задержку появления опубликованного контента — но публикация
 *     в Sanity и так триггерит полный пересбор и деплой через GitHub Actions,
 *     который занимает несколько минут, поэтому +5 минут на кэш почти ничего
 *     не добавляют к фактическому времени выката;
 *   • по сравнению с 60 с даёт пятикратный запас по квоте Sanity, а именно
 *     квота — то, что валит сайт целиком.
 * Понизить задержку — правка одной константы ниже.
 */
const TTL_OK = 300;

/**
 * 404 кэшируем, но с сильно меньшим TTL. Причина в том, что 404 здесь бывает
 * «дорогим»: страница статьи сначала ходит в Sanity и только потом делает
 * `Astro.rewrite('/404')`, если статья не найдена ИЛИ закрыта по гео. Для
 * заблокированной в стране статьи это повторяется на каждом запросе из этой
 * страны, то есть съедает ту самую квоту. Короткий TTL ограничивает и это,
 * и время, на которое свежеопубликованный URL может залипнуть как 404.
 */
const TTL_NOT_FOUND = 60;

/**
 * Заголовок для клиента. `private` — намеренно: HTML варьируется по стране
 * (см. `blockedIn` в Sanity), а ни один общий кэш, кроме нашего, страну в ключ
 * не кладёт. `private` запрещает промежуточным shared-кэшам хранить ответ,
 * поэтому даже если на зоне когда-нибудь включат Cache Rules, контент одной
 * страны не начнёт раздаваться другой. Свой собственный экземпляр в
 * `caches.default` мы кладём с отдельным заголовком (см. `EDGE_CACHE_CONTROL`).
 */
const CLIENT_CACHE_CONTROL_OK = `private, max-age=60`;
const CLIENT_CACHE_CONTROL_NOT_FOUND = 'private, max-age=0, must-revalidate';

/** Бакет для запросов без страны: не пересекается ни с одним ISO-кодом. */
const NO_COUNTRY = 'none';

/**
 * Метка времени записи, кладётся в кэшируемую копию.
 *
 * Нужна потому, что на протухание нельзя полагаться вслепую: локальный workerd
 * (`astro preview`, miniflare) `max-age` для вытеснения игнорирует — проверено,
 * запись с `max-age=3` продолжает отдаваться и через 30 с, а `Age` всегда 0.
 * Настоящий Cloudflare `Cache-Control` соблюдает, но тогда TTL держится на
 * честном слове платформы и его невозможно проверить локально. Со своей меткой
 * срок жизни считает сам middleware: заявленная задержка публикации выполняется
 * одинаково и в проде, и на превью, а `Cache-Control` в кэшируемой копии
 * остаётся вторым рубежом, который позволяет Cloudflare вытеснить запись самому.
 */
const STORED_AT_HEADER = 'X-Cache-Stored-At';

/** Возраст записи в секундах; `null`, если метки нет (запись чужая/старая). */
function entryAge(response: Response): number | null {
  const stamp = Number(response.headers.get(STORED_AT_HEADER));
  if (!Number.isFinite(stamp) || stamp <= 0) return null;
  return Math.max(0, Math.round((Date.now() - stamp) / 1000));
}

type EdgeCache = {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
};

/**
 * Cache API есть в workerd, но его нет в Node, на котором крутится `astro dev`.
 * Поэтому — не `caches.default` напрямую, а аккуратная проверка: если объекта
 * нет, middleware просто рендерит страницу как раньше.
 * Обращение к `globalThis` через каст: типы DOM знают `caches.open()`, но не
 * знают `caches.default` из Workers.
 */
function getEdgeCache(): EdgeCache | null {
  const store = (globalThis as { caches?: { default?: EdgeCache } }).caches;
  const cache = store?.default;
  return cache && typeof cache.match === 'function' ? cache : null;
}

/**
 * `waitUntil` из рантайма Cloudflare: позволяет дописать ответ в кэш уже после
 * того, как пользователь его получил.
 *
 * ВНИМАНИЕ: в Astro 6 это именно `locals.cfContext`. Старый `locals.runtime.ctx`
 * не просто удалён — его геттер бросает Error, то есть обращение к нему роняет
 * каждый запрос в 500. Типов для локалей в проекте нет (нет `env.d.ts`),
 * поэтому достаём через локальный тип и на всякий случай под try/catch.
 */
type RuntimeLocals = {
  cfContext?: { waitUntil?: (promise: Promise<unknown>) => void };
};

function getWaitUntil(locals: unknown): ((promise: Promise<unknown>) => void) | null {
  try {
    const ctx = (locals as RuntimeLocals | undefined)?.cfContext;
    return typeof ctx?.waitUntil === 'function' ? ctx.waitUntil.bind(ctx) : null;
  } catch {
    return null;
  }
}

/**
 * Страна для ключа кэша. Страницы читают `cf-ipcountry` и режут контент по
 * `blockedIn`, то есть HTML варьируется по стране — закэшировать без страны
 * значит начать раздавать контент одной юрисдикции в другую.
 *
 * Особые значения Cloudflare сохраняем как отдельные бакеты, а не сваливаем в
 * общий: `XX` (страна неизвестна) и `T1` (Tor). Формально страницы трактуют их
 * так же, как отсутствие страны, но только пока в `blockedIn` лежат настоящие
 * ISO-коды; отдельные бакеты стоят двух записей в кэше и убирают этот риск.
 *
 * Всё остальное (заголовка нет — локальная разработка и прямые запросы; мусор в
 * заголовке) — общий бакет `none`. Заодно это ограничивает пространство ключей
 * 679 значениями, то есть подделанным заголовком кэш не расфрагментировать.
 */
function countryBucket(request: Request): string {
  const raw = (request.headers.get('cf-ipcountry') ?? '').trim().toUpperCase();
  if (raw === 'XX' || raw === 'T1') return raw;
  if (/^[A-Z]{2}$/.test(raw)) return raw;
  return NO_COUNTRY;
}

/**
 * `caches.default` ключуется по URL запроса, а не по заголовкам, поэтому страну
 * зашиваем в синтетический путь: `/__edge/<country>/<исходный путь>`. Origin
 * сохраняем — Cloudflare разрешает класть в кэш только ключи со своей зоны.
 *
 * Query-строка в ключ НЕ входит намеренно: ни одна страница не читает
 * `Astro.url.searchParams`, canonical в BaseLayout строится только из pathname,
 * то есть HTML от query не зависит вообще. Так `?utm_source=…`, `?fbclid=…` и
 * любые метки не плодят промахи, а произвольным `?x=1&x=2` нельзя обойти кэш и
 * выкачать квоту Sanity. ВАЖНО: если какая-то страница начнёт читать
 * searchParams, эту нормализацию нужно пересмотреть.
 */
function cacheKey(url: URL, country: string): Request {
  return new Request(new URL(`/__edge/${country}${url.pathname}`, url.origin).toString(), {
    method: 'GET',
  });
}

type CachePolicy = { ttl: number; clientCacheControl: string };

/**
 * Что кладём в кэш:
 *   • 200 — основной случай, TTL 300 с;
 *   • 404 — TTL 60 с (см. комментарий к `TTL_NOT_FOUND`);
 *   • 3xx — нет: редиректы генерируются этим же middleware без похода в Sanity,
 *     кэшировать нечего;
 *   • 5xx — категорически нет: залипший на TTL сбой превращает временную
 *     ошибку (в том числе тот самый 402 от Sanity) в гарантированную;
 *   • ответы с `Set-Cookie` — нет, иначе чужая кука уедет другому посетителю;
 *   • ответы, где страница сама попросила `no-store` / `private` / `no-cache` —
 *     нет, это явный отказ от кэша на стороне страницы.
 */
function cachePolicy(response: Response): CachePolicy | null {
  if (response.headers.has('Set-Cookie')) return null;

  const declared = (response.headers.get('Cache-Control') ?? '').toLowerCase();
  if (/no-store|no-cache|private/.test(declared)) return null;

  if (response.status === 200) {
    return { ttl: TTL_OK, clientCacheControl: CLIENT_CACHE_CONTROL_OK };
  }
  if (response.status === 404) {
    return { ttl: TTL_NOT_FOUND, clientCacheControl: CLIENT_CACHE_CONTROL_NOT_FOUND };
  }
  return null;
}

/** Пересобираем ответ, чтобы гарантированно иметь изменяемые заголовки. */
function withHeaders(response: Response, patch: Record<string, string>): Response {
  const out = new Response(response.body, response);
  for (const [name, value] of Object.entries(patch)) out.headers.set(name, value);
  return out;
}

/* ── Middleware ──────────────────────────────────────────────────────────── */

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const { pathname } = url;

  if (pathname === '/' || isReserved(pathname)) {
    return next();
  }

  // 1. Языковой префикс должен быть из списка поддерживаемых.
  //    Иначе /zz/, /admin/ и любой мусор отдавали 200 с русской главной
  //    и self-canonical — бесконечное индексируемое пространство.
  //
  //    Проверяется ПЕРВЫМ, до нормализации слеша: иначе `/wp-login.php`
  //    сначала получал бы 301 на `/wp-login.php/` и только потом 404 —
  //    лишний round-trip и странный сигнал сканерам. Первый сегмент
  //    извлекается одинаково для обеих форм URL, со слешем и без.
  //
  //    И до кэша: этот 404 рендерится из локальных переводов, в Sanity не
  //    ходит, кэшировать его смысла нет — а вот засорить им кэш можно.
  const firstSegment = pathname.split('/')[1] ?? '';
  if (!isLanguage(firstSegment)) {
    return context.rewrite('/404');
  }

  // 2. Один канонический вид URL — со слешем на конце.
  //    Без этого /ru/faq и /ru/faq/ оба отдают 200 и каждый ставит
  //    self-canonical, то есть дубль не схлопывается, а закрепляется.
  //    Тоже до кэша: иначе в кэш попадали бы неканонические URL.
  if (!pathname.endsWith('/')) {
    return context.redirect(`${pathname}/${url.search}`, 301);
  }

  // 3. Edge-кэш. Только GET: остальные методы идут мимо без изменений.
  if (context.request.method !== 'GET') {
    return next();
  }

  const cache = getEdgeCache();
  const country = countryBucket(context.request);
  const key = cache ? cacheKey(url, country) : null;

  if (cache && key) {
    let hit: Response | undefined;
    try {
      hit = await cache.match(key);
    } catch {
      hit = undefined; // кэш не должен уметь ронять выдачу
    }
    if (hit) {
      const hitPolicy = cachePolicy(hit);
      const age = entryAge(hit);
      // Протухшую (или без метки времени) запись не отдаём — рендерим заново
      // и перезаписываем её ниже.
      if (hitPolicy && age !== null && age <= hitPolicy.ttl) {
        const fresh = withHeaders(hit, {
          'Cache-Control': hitPolicy.clientCacheControl,
          Vary: 'CF-IPCountry',
          'X-Cache': 'HIT',
          Age: String(age),
        });
        fresh.headers.delete(STORED_AT_HEADER);
        return fresh;
      }
    }
  }

  const response = await next();
  const policy = cachePolicy(response);

  if (!policy) {
    const patch: Record<string, string> = { 'X-Cache': 'BYPASS' };
    // Ошибки и редиректы не должны осесть ни в одном кэше по дороге.
    if (!response.headers.has('Cache-Control')) patch['Cache-Control'] = 'no-store';
    return withHeaders(response, patch);
  }

  const clientHeaders: Record<string, string> = {
    'Cache-Control': policy.clientCacheControl,
    Vary: 'CF-IPCountry',
    'X-Cache-Country': country,
  };

  // Cache API недоступен — просто отдаём отрендеренное, с теми же заголовками.
  // Сейчас в этот путь не попадает даже `astro dev`: с @astrojs/cloudflare он
  // тоже поднимается в workerd, где `caches` есть. Но на Node (другой адаптер,
  // юнит-прогон, локальный SSR-хост) глобального `caches` нет, и middleware
  // обязан это переживать, а не падать.
  if (!cache || !key) {
    return withHeaders(response, { ...clientHeaders, 'X-Cache': 'DISABLED' });
  }

  // Копия для кэша: отдельный Cache-Control, потому что TTL хранения (300 с)
  // и то, что разрешено клиенту (60 с, private), — разные вещи.
  // `X-Cache-Country` уезжает в кэш намеренно: на HIT он показывает, для какой
  // страны этот HTML был отрендерен, — так гео-изоляцию видно снаружи.
  const stored = new Response(response.clone().body, response);
  stored.headers.set('Cache-Control', `public, max-age=${policy.ttl}`);
  stored.headers.set('X-Cache-Country', country);
  stored.headers.set(STORED_AT_HEADER, String(Date.now()));
  stored.headers.delete('X-Cache');
  stored.headers.delete('Age');
  stored.headers.delete('Vary');

  const write = cache.put(key, stored).catch(() => {
    // Промах записи не должен всплывать как unhandled rejection.
  });

  // Запись не должна задерживать ответ. На Workers для этого есть waitUntil;
  // если его достать не удалось — всё равно не ждём, просто соглашаемся, что
  // рантайм может прервать запись (тогда следующий запрос будет ещё одним MISS).
  const waitUntil = getWaitUntil(context.locals);
  if (waitUntil) waitUntil(write);

  return withHeaders(response, { ...clientHeaders, 'X-Cache': 'MISS' });
});
