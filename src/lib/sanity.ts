import { createClient } from '@sanity/client';
import { Marked, type RendererObject, type Tokens } from 'marked';
import { transformSync } from 'ultrahtml';
import sanitize from 'ultrahtml/transformers/sanitize';
import { DEFAULT_LANGUAGE, INDEXED_LANGUAGES, isLanguage, type Language } from '../i18n/languages';

// Датасет публичный, поэтому токен не нужен: анонимные запросы возвращают
// опубликованный контент. Токен, наоборот, вредил — он вытягивал drafts.*
// и запрещал кэширование на CDN.
export const sanity = createClient({
  projectId: import.meta.env.SANITY_PROJECT_ID,
  dataset: import.meta.env.SANITY_DATASET,
  // до 2025-02-19 дефолтный perspective был raw, т.е. с черновиками
  apiVersion: '2025-02-19',
  perspective: 'published',
  useCdn: true,
});

// ── Markdown → безопасный HTML ───────────────────────────────────────────────
//
// Текст из Sanity вставляется на страницу через `set:html`, поэтому без
// санитизации любой, у кого есть доступ в CMS, получает stored XSS на боевом
// домене. Опция `sanitize` удалена из marked начиная с v5, так что защиту
// строим сами, в два независимых слоя:
//
//   1. рендерер marked экранирует сырые HTML-токены (`<script>` превращается
//      в видимый текст, а не в тег) и отбрасывает ссылки/картинки с опасной
//      схемой — сам marked `javascript:` в href пропускает как есть;
//   2. результат прогоняется через allow-list ultrahtml: выживают только те
//      теги и атрибуты, которые marked реально порождает из Markdown, всё
//      остальное (включая любые `on*`-обработчики и `style`) отбрасывается.
//
// Оба слоя — чистый JS без Node-API. Это принципиально: прод работает на
// Cloudflare workerd, где `nodejs_compat` не включён, поэтому решения на
// jsdom (`isomorphic-dompurify`) или на Node-модулях (`sanitize-html`) там
// просто не запустятся. `ultrahtml` уже присутствует в дереве зависимостей
// Astro и не тянет ни одного Node-встроенного модуля.
//
// Экранирование сырого HTML безопасно для существующего контента: проверка
// датасета (все `body_*` статей, `answer_*` FAQ, тексты секций) показала
// 0 HTML-тегов на 86 непустых полей — редакторы пишут чистый Markdown.

/** Схемы, которым разрешено оказаться в `href`. */
const SAFE_LINK_PROTOCOLS = new Set(['http', 'https', 'mailto', 'tel']);
/** Для `src` картинок хватает только сетевых схем. */
const SAFE_IMAGE_PROTOCOLS = new Set(['http', 'https']);

/**
 * Экранирование для HTML/атрибутов. Уже существующие сущности (`&amp;`,
 * `&#39;`) повторно не кодируются — так же, как это делает сам marked,
 * иначе ссылки вида `/a?b=1&amp;c=2` ломались бы в `&amp;amp;`.
 */
function escapeHtml(value: string): string {
  return value.replace(
    /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch] ?? ch,
  );
}

/**
 * Мини-декодер HTML-сущностей — нужен только для того, чтобы принять решение
 * о безопасности URL, наружу его результат не отдаётся.
 *
 * Браузер раскодирует значение атрибута ОДИН раз перед тем, как передать его
 * URL-парсеру, поэтому `java&#115;cript:alert(1)` и `javascript&colon;alert(1)`
 * — рабочие XSS-векторы, хотя буквально подстроки `javascript:` не содержат.
 * Один проход в точности повторяет поведение браузера. Именованные сущности
 * ограничены теми, что способны собрать схему; регистр не различаем нарочно —
 * решение о безопасности должно быть строже, а не мягче, чем у браузера.
 */
const URL_ENTITIES: Record<string, string> = {
  colon: ':', sol: '/', tab: '\t', newline: '\n', amp: '&', num: '#',
  lt: '<', gt: '>', quot: '"', apos: "'", semi: ';', lpar: '(', rpar: ')',
};

function decodeForUrlCheck(value: string): string {
  return value
    .replace(/&(#[Xx][0-9A-Fa-f]{1,6}|#\d{1,7}|[A-Za-z][A-Za-z0-9]*);/g, (match, body: string) => {
      if (body[0] === '#') {
        const code = body[1] === 'x' || body[1] === 'X'
          ? Number.parseInt(body.slice(2), 16)
          : Number.parseInt(body.slice(1), 10);
        return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
      }
      return URL_ENTITIES[body.toLowerCase()] ?? match;
    })
    // Пробельные и управляющие символы URL-парсер выбрасывает: `java\tscript:`.
    .replace(/[\u0000-\u0020\u007f]/g, '');
}

/**
 * Возвращает URL как есть, если он безопасен, иначе `null`.
 *
 * Схемой считается только то, что после раскодирования сущностей отвечает
 * продукции `[A-Za-z][A-Za-z0-9+.-]*:` в самом начале строки — ровно как в
 * спецификации URL. Всё прочее (`/path`, `#anchor`, `?q=1`, `//host`) схемы
 * не имеет и трактуется как относительная ссылка. Проверка идёт по
 * раскодированной форме, а в разметку уходит исходная.
 */
function safeUrl(rawUrl: string | null | undefined, allowed: Set<string>): string | null {
  const url = (rawUrl ?? '').trim();
  if (!url) return null;
  const scheme = decodeForUrlCheck(url).match(/^([A-Za-z][A-Za-z0-9+.-]*):/);
  if (!scheme) return url; // схемы нет — относительная ссылка, она безопасна
  return allowed.has(scheme[1].toLowerCase()) ? url : null;
}

const safeRenderer: RendererObject = {
  // Один и тот же хук ловит и блочный, и инлайновый сырой HTML.
  html(token: Tokens.HTML | Tokens.Tag) {
    return escapeHtml(token.text);
  },
  link(token: Tokens.Link) {
    const text = this.parser.parseInline(token.tokens ?? []);
    const href = safeUrl(token.href, SAFE_LINK_PROTOCOLS);
    // Небезопасная схема — ссылку разжимаем в обычный текст, содержимое цело.
    if (href === null) return text;
    const title = token.title ? ` title="${escapeHtml(token.title)}"` : '';
    return `<a href="${escapeHtml(href)}"${title}>${text}</a>`;
  },
  image(token: Tokens.Image) {
    const alt = escapeHtml(token.text ?? '');
    const src = safeUrl(token.href, SAFE_IMAGE_PROTOCOLS);
    if (src === null) return alt;
    const title = token.title ? ` title="${escapeHtml(token.title)}"` : '';
    return `<img src="${escapeHtml(src)}" alt="${alt}"${title}>`;
  },
};

const markdown = new Marked({ renderer: safeRenderer });

/**
 * Allow-list ровно по тому, что marked порождает из Markdown (включая GFM:
 * таблицы, `~~del~~`, чек-боксы задач). Всё, чего здесь нет, вырезается.
 */
const sanitizeHtml = sanitize({
  allowElements: [
    'p', 'br', 'hr',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'strong', 'em', 'del', 'code', 'pre', 'blockquote',
    'ul', 'ol', 'li', 'input',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  allowAttributes: {
    href: ['a'],
    src: ['img'],
    alt: ['img'],
    title: ['a', 'img'],
    class: ['code', 'pre'],
    align: ['th', 'td'],
    start: ['ol'],
    type: ['input'],
    checked: ['input'],
    disabled: ['input'],
  },
});

export function renderMarkdown(md: string): string {
  const html = markdown.parse(md ?? '', { async: false }) as string;
  return transformSync(html, [sanitizeHtml]);
}

export function extractToc(md: string): { depth: number; text: string; slug: string }[] {
  const headings: { depth: number; text: string; slug: string }[] = [];
  for (const line of (md ?? '').split('\n')) {
    const m = line.match(/^(#{1,6})\s+(.+)$/);
    if (m) {
      const text = m[2].trim();
      const slug = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      headings.push({ depth: m[1].length, text, slug });
    }
  }
  return headings;
}

export function youtubeId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

export function isBlockedInCountry(blockedIn: string[], country: string): boolean {
  if (!country || !blockedIn?.length) return false;
  return blockedIn.includes(country.toUpperCase());
}

// ── Языковые проекции ────────────────────────────────────────────────────────
//
// Документы хранят все 7 языков полями одного уровня (`title_en`, `body_de`…),
// поэтому раньше каждая проекция забирала весь набор, а нужный язык выбирался
// уже в JS. Расход рос линейно по числу статей: лента тянула 7 заголовков и 7
// описаний на документ, страница статьи — семь полных тел ради одного.
//
// БЕЗОПАСНОСТЬ: имя поля в GROQ нельзя передать параметром — `$lang`
// подставляется как значение, а не как идентификатор, поэтому проекция
// собирается конкатенацией строк. Единственная преграда для GROQ-инъекции —
// `safeLang()` ниже, и вызывается она внутри слоя данных намеренно: маршруты
// свой `lang` уже проверяют, но функция не должна верить вызывающему на слово.

/** Пропускает только код из `LANGUAGES`; всё прочее сводит к `ru` и логирует. */
function safeLang(lang: string): Language {
  if (isLanguage(lang)) return lang;
  console.error(
    `[sanity] unsupported language ${JSON.stringify(lang)} reached the data layer, falling back to "${DEFAULT_LANGUAGE}"`,
  );
  return DEFAULT_LANGUAGE;
}

/**
 * `"title": <язык, иначе русский>`.
 *
 * Не `coalesce()`: он считает пустую строку значением, а прежний JS-фолбэк
 * (`title_en || title_ru`) — отсутствием перевода. Сравнение с `""` обязано
 * идти под защитой `defined()`: в GROQ `null != ""` — это `true`, поэтому без
 * guard'а незаполненное поле «выигрывало» бы у русского и отдавало null.
 */
function localized(field: string, lang: Language): string {
  if (lang === DEFAULT_LANGUAGE) return `"${field}": ${field}_${DEFAULT_LANGUAGE}`;
  return `"${field}": select(defined(${field}_${lang}) && ${field}_${lang} != "" => ${field}_${lang}, ${field}_${DEFAULT_LANGUAGE})`;
}

/**
 * `"hasTranslation": <перевод действительно есть>` — после схлопывания полей
 * через `select()` страница иначе не отличит перевод от русского фолбэка.
 *
 * Список полей задаётся вызывающим: для карточки достаточно заголовка, а для
 * страницы статьи в него входит и тело. Раньше плашка «перевод отсутствует»
 * смотрела только на заголовок, и статья с заполненным `title_en`, но пустым
 * `body_en` показывала русский текст вообще без предупреждения.
 */
/**
 * `"translations": { en: bool, es: bool, … }` по индексируемым локалям.
 *
 * Нужна там, где решение принимается ЗА другую локаль: sitemap не должен
 * приглашать краулер на URL, который сам скажет noindex (нет перевода),
 * а страница не должна целиться hreflang'ом в такую альтернативу —
 * несогласованные сигналы Google разрешает отбрасыванием кластера.
 * Для DEFAULT_LANGUAGE перевод есть по определению — это язык оригинала.
 */
function translationsMap(fields: string[]): string {
  const entries = INDEXED_LANGUAGES.map((code) => {
    if (code === DEFAULT_LANGUAGE) return `"${code}": true`;
    const conditions = fields
      .map((field) => `(defined(${field}_${code}) && ${field}_${code} != "")`)
      .join(' && ');
    return `"${code}": ${conditions}`;
  });
  return `"translations": { ${entries.join(', ')} }`;
}

function translationFlag(fields: string[], lang: Language): string {
  if (lang === DEFAULT_LANGUAGE) return '"hasTranslation": true';
  const conditions = fields
    .map((field) => `(defined(${field}_${lang}) && ${field}_${lang} != "")`)
    .join(' && ');
  return `"hasTranslation": ${conditions}`;
}

// ── Устойчивость к отказу Sanity ─────────────────────────────────────────────
//
// `sanity.fetch()` бросает на любой не-2xx (в том числе на HTTP 402, которым
// Sanity Free отвечает при исчерпанной квоте) и на сетевой сбой. Без перехвата
// это означало 500 на всех динамических маршрутах сразу. Поэтому наружу
// отдаётся `Fetched<T>`: данные плюс явный признак сбоя — чтобы страница могла
// отличить «в CMS пусто» от «CMS недоступна» и не выдавать второе за первое.

/** Таймаут запроса: воркер не должен висеть, пока Sanity молчит. */
const SANITY_TIMEOUT_MS = 8000;

export type Fetched<T> = {
  /** Результат запроса; при сбое — безопасное пустое значение. */
  data: T;
  /** `true` — запрос не удался, `data` содержит заглушку, а не выдачу CMS. */
  failed: boolean;
};

async function fetchOrDegrade<T>(
  label: string,
  fallback: T,
  query: string,
  params: Record<string, string> = {},
): Promise<Fetched<T>> {
  try {
    const data = await sanity.fetch<T>(query, params, {
      signal: AbortSignal.timeout(SANITY_TIMEOUT_MS),
    });
    return { data, failed: false };
  } catch (error) {
    // Логи Workers включены (`[observability]` в wrangler.toml) — видно
    // через `wrangler tail`. Пишем имя и сообщение, а не весь объект:
    // в него Sanity кладёт тело ответа целиком.
    console.error(
      `[sanity] ${label} failed:`,
      error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    );
    return { data: fallback, failed: true };
  }
}

/**
 * Ответ для страницы, чей основной контент не загрузился.
 *
 * 503, а не 200 с пустотой: пустая страница, отданная с 200, для краулера
 * неотличима от настоящей — он запомнит её без статей. 503 + `Retry-After`
 * означает «зайди позже», индекс не переписывается. `no-store` не даёт ни
 * edge-кэшу, ни браузеру закрепить сбой на TTL обычной страницы.
 *
 * Тип параметра описывает `Astro.response` (`ResponseInit` с изменяемыми
 * заголовками) — держим его структурным, чтобы не тянуть сюда типы Astro.
 */
export function markContentUnavailable(response: {
  status?: number;
  statusText?: string;
  headers: Headers;
}): void {
  response.status = 503;
  response.statusText = 'Service Unavailable';
  response.headers.set('Retry-After', '120');
  response.headers.set('Cache-Control', 'no-store');
}

// Лимиты запросов. Раньше их не было нигде: главная грузила все статьи и
// делала `slice(0, 7)` уже над готовым массивом.
/** Главная показывает 7 карточек; запас нужен на отсев по гео. */
const FEED_LIMIT = 24;
const SECTION_LIMIT = 60;
const SECTIONS_LIMIT = 50;
const FAQ_LIMIT = 100;
/** Sitemap обязан перечислить всё; предел — только страховка от аномалии. */
const SITEMAP_LIMIT = 5000;

// ── Запросы ──────────────────────────────────────────────────────────────────

/**
 * `bodyLang` подключает текст хаба (localized `body_*` с русским фолбэком и
 * флагом перевода). Он опционален намеренно: главная зовёт `getSections()` для
 * списка карточек, и тянуть ей тексты всех четырёх хабов — лишний трафик на
 * каждый рендер.
 */
export async function getSections(options: { bodyLang?: string } = {}): Promise<Fetched<SanitySection[]>> {
  const bodyProjection = options.bodyLang
    ? (() => {
        const code = safeLang(options.bodyLang);
        return `,
      ${localized('body', code)},
      ${translationFlag(['body'], code)}`;
      })()
    : '';

  return fetchOrDegrade<SanitySection[]>(
    `getSections(${options.bodyLang ?? ''})`,
    [],
    `*[_type == "section"] | order(order asc) [0...${SECTIONS_LIMIT}] {
      "id": slug.current,
      title,
      icon,
      description,
      order${bodyProjection}
    }`,
  );
}

/**
 * Лента карточек. `section` фильтруется в GROQ: страница раздела раньше
 * забирала все статьи портала и отсеивала лишние в JavaScript.
 */
export async function getArticles(
  lang: string,
  options: { section?: string; limit?: number } = {},
): Promise<Fetched<SanityArticleCard[]>> {
  const code = safeLang(lang);
  const limit = options.limit ?? (options.section ? SECTION_LIMIT : FEED_LIMIT);
  const filter = options.section
    ? '_type == "article" && section->slug.current == $section'
    : '_type == "article"';

  return fetchOrDegrade<SanityArticleCard[]>(
    `getArticles(${code}${options.section ? `, ${options.section}` : ''})`,
    [],
    `*[${filter}] | order(pubDate desc) [0...${limit}] {
      "id": slug.current,
      "section": section->slug.current,
      pubDate,
      readingTime,
      author,
      featured,
      blockedIn,
      "imageUrl": image.asset->url,
      youtube,
      ${localized('title', code)},
      ${localized('description', code)},
      ${translationFlag(['title'], code)}
    }`,
    options.section ? { section: options.section } : {},
  );
}

export async function getArticleBySlug(
  slug: string,
  lang: string,
): Promise<Fetched<SanityArticleFull | null>> {
  const code = safeLang(lang);

  return fetchOrDegrade<SanityArticleFull | null>(
    `getArticleBySlug(${code})`,
    null,
    `*[_type == "article" && slug.current == $slug][0] {
      "id": slug.current,
      "section": section->slug.current,
      "sectionIcon": section->icon,
      pubDate,
      _updatedAt,
      readingTime,
      // Документ автора главнее строки: строка остаётся фолбэком для статей,
      // у которых ссылка ещё не проставлена.
      "author": coalesce(authorRef->name, author),
      "authorSlug": authorRef->slug.current,
      featured,
      blockedIn,
      "imageUrl": image.asset->url,
      youtube,
      ${localized('title', code)},
      ${localized('description', code)},
      ${localized('body', code)},
      ${translationFlag(['title', 'body'], code)},
      ${translationsMap(['title', 'body'])}
    }`,
    { slug },
  );
}

export async function getAuthorBySlug(
  slug: string,
  lang: string,
): Promise<Fetched<SanityAuthor | null>> {
  const code = safeLang(lang);

  return fetchOrDegrade<SanityAuthor | null>(
    `getAuthorBySlug(${code})`,
    null,
    `*[_type == "author" && slug.current == $slug][0] {
      "id": slug.current,
      name,
      links,
      "photoUrl": photo.asset->url,
      ${localized('role', code)},
      ${localized('bio', code)},
      ${translationFlag(['bio'], code)},
      "articles": *[_type == "article" && authorRef._ref == ^._id] | order(pubDate desc) [0...${FEED_LIMIT}] {
        "id": slug.current,
        "section": section->slug.current,
        pubDate,
        readingTime,
        "author": coalesce(authorRef->name, author),
        featured,
        blockedIn,
        ${localized('title', code)},
        ${localized('description', code)},
        ${translationFlag(['title'], code)}
      }
    }`,
    { slug },
  );
}

export async function getFaqItems(lang: string): Promise<Fetched<SanityFaq[]>> {
  const code = safeLang(lang);

  return fetchOrDegrade<SanityFaq[]>(
    `getFaqItems(${code})`,
    [],
    `*[_type == "faqItem"] | order(order asc) [0...${FAQ_LIMIT}] {
      "id": slug.current,
      order,
      blockedIn,
      ${localized('question', code)},
      ${localized('answer', code)},
      ${translationFlag(['question', 'answer'], code)}
    }`,
  );
}

/**
 * Всё, что нужно sitemap'у, одним запросом: слаги, `blockedIn` для гео-фильтра
 * и `_updatedAt` для `<lastmod>`. Языковые поля ему не нужны вовсе — раньше он
 * звал `getArticles()`/`getFaqItems()` и вытягивал заодно весь текст на 7
 * языках, чтобы не воспользоваться ни одной строкой.
 */
export async function getSitemapContent(): Promise<Fetched<SitemapContent>> {
  return fetchOrDegrade<SitemapContent>(
    'getSitemapContent',
    { sections: [], articles: [], faqItems: [] },
    `{
      "sections": *[_type == "section"] | order(order asc) [0...${SECTIONS_LIMIT}] {
        "id": slug.current
      },
      "articles": *[_type == "article"] | order(pubDate desc) [0...${SITEMAP_LIMIT}] {
        "id": slug.current,
        pubDate,
        _updatedAt,
        blockedIn,
        ${translationsMap(['title', 'body'])}
      },
      "faqItems": *[_type == "faqItem"] [0...${FAQ_LIMIT}] {
        blockedIn
      }
    }`,
  );
}

// ── Копия для деградированного состояния ─────────────────────────────────────
//
// Живёт здесь, а не в `src/i18n/ui.ts`, потому что это текст про отказ слоя
// данных: он появляется только вместе с `Fetched.failed` и меняется вместе с
// ним. Показывать по-русски посетителю немецкой версии нельзя — это ровно тот
// случай, когда «пусто» и «сломалось» должны читаться по-разному.
export const DATA_ERROR_COPY: Record<Language, { title: string; body: string }> = {
  ru: {
    title: 'Контент временно недоступен',
    body: 'Не удалось загрузить материалы из системы управления контентом. Это временный сбой на нашей стороне — попробуйте обновить страницу через несколько минут.',
  },
  en: {
    title: 'Content temporarily unavailable',
    body: 'We could not load the content from our CMS. This is a temporary problem on our side — please refresh the page in a few minutes.',
  },
  es: {
    title: 'Contenido no disponible temporalmente',
    body: 'No hemos podido cargar el contenido desde nuestro CMS. Es un fallo temporal por nuestra parte: vuelve a cargar la página dentro de unos minutos.',
  },
  pt: {
    title: 'Conteúdo temporariamente indisponível',
    body: 'Não foi possível carregar o conteúdo do nosso CMS. É uma falha temporária do nosso lado — atualize a página dentro de alguns minutos.',
  },
  de: {
    title: 'Inhalte vorübergehend nicht verfügbar',
    body: 'Die Inhalte konnten nicht aus unserem CMS geladen werden. Das ist eine vorübergehende Störung auf unserer Seite — bitte laden Sie die Seite in einigen Minuten neu.',
  },
  fr: {
    title: 'Contenu temporairement indisponible',
    body: "Impossible de charger le contenu depuis notre CMS. Il s'agit d'une panne temporaire de notre côté — veuillez recharger la page dans quelques minutes.",
  },
  br: {
    title: 'Conteúdo temporariamente indisponível',
    body: 'Não foi possível carregar o conteúdo do nosso CMS. É uma falha temporária do nosso lado — atualize a página em alguns minutos.',
  },
};

// ── Types ────────────────────────────────────────────────────────────────────

export type SanitySection = {
  id: string;
  title: string;
  icon: string;
  description: string;
  order: number;
  /** Текст хаба; приходит только при `getSections({ bodyLang })`. */
  body?: string | null;
  hasTranslation?: boolean;
};

/** Статья в ленте: тексты уже сведены к одному языку в GROQ. */
export type SanityArticleCard = {
  id: string;
  section: string;
  pubDate: string;
  readingTime: number;
  author: string;
  featured: boolean;
  blockedIn: string[];
  imageUrl?: string;
  youtube?: string;
  title: string;
  description: string;
  /** `false` — показан русский фолбэк, а не перевод на запрошенный язык. */
  hasTranslation: boolean;
};

export type SanityArticleFull = SanityArticleCard & {
  sectionIcon: string;
  body: string;
  /** По индексируемым локалям: есть ли там полный перевод (title + body). */
  translations?: Partial<Record<Language, boolean>>;
  /** Слаг документа автора; null у статей, где проставлена только строка. */
  authorSlug?: string | null;
  /**
   * Отметка правки самой Sanity. Идёт в `dateModified` разметки и в строку
   * «Обновлено» — для YMYL это один из немногих сигналов актуальности,
   * который Google читает напрямую. Опциональна: у документа, ни разу не
   * правленного после создания, поле всё равно есть, но полагаться на это
   * в типе незачем.
   */
  _updatedAt?: string;
};

export type SanityFaq = {
  id: string;
  order: number;
  blockedIn: string[];
  question: string;
  answer: string;
  hasTranslation: boolean;
};

export type SanityAuthor = {
  id: string;
  name: string;
  links?: string[];
  photoUrl?: string;
  role: string;
  bio: string;
  hasTranslation: boolean;
  articles: SanityArticleCard[];
};

export type SitemapContent = {
  sections: { id: string }[];
  articles: {
    id: string;
    pubDate: string;
    _updatedAt?: string;
    blockedIn?: string[];
    translations?: Partial<Record<Language, boolean>>;
  }[];
  faqItems: { blockedIn?: string[] }[];
};
