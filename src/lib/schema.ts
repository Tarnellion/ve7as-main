/**
 * Сборка JSON-LD.
 *
 * Всё, что страница отдаёт в разметку, собирается здесь и складывается в один
 * `@graph` в `BaseLayout`. Причина — связность: `Article.publisher`,
 * `WebSite.publisher` и `BreadcrumbList` должны указывать на одну и ту же
 * сущность организации, а не на три её копии с разными полями. Через `@id`
 * это выражается один раз, и Google читает граф, а не набор разрозненных
 * блоков.
 *
 * Экранирование здесь не делается: сериализацией занимается `jsonLd()` в
 * `BaseLayout`, и это единственное место, где граф превращается в строку.
 */

import { HTML_LANG, type Language } from '../i18n/languages';

/** Узел графа: `@type` обязателен, остальное — по типу. */
export type SchemaNode = Record<string, unknown> & { '@type': string };

/**
 * Профили организации для `sameAs`.
 *
 * ПУСТО НАМЕРЕННО, и это не забытый TODO. `sameAs` — механизм, которым Google
 * связывает домен с сущностью, а сущность «VE7AS» в вебе уже занята: это
 * действующий позывной радиолюбителя из Британской Колумбии, и выдача по слову
 * принадлежит базам позывных. Пока у проекта нет ни одного внешнего профиля,
 * ссылаться не на что, а пустой массив в разметке — сигнал хуже отсутствующего
 * поля. Как только профили появятся, они добавляются сюда, и `sameAs` начинает
 * выводиться сам.
 */
export const ORGANIZATION_PROFILES: string[] = [];

export const ORG_ID = '#organization';
export const SITE_ID = '#website';

function abs(site: URL, hash = ''): string {
  return new URL(hash, site).toString();
}

export function organization(site: URL, tagline: string): SchemaNode {
  const node: SchemaNode = {
    '@type': 'Organization',
    '@id': abs(site, ORG_ID),
    name: 'Ve7as',
    url: site.toString(),
    description: tagline,
  };
  if (ORGANIZATION_PROFILES.length > 0) node.sameAs = ORGANIZATION_PROFILES;
  return node;
}

export function website(site: URL, lang: Language, tagline: string): SchemaNode {
  return {
    '@type': 'WebSite',
    '@id': abs(site, SITE_ID),
    name: 'Ve7as',
    url: site.toString(),
    description: tagline,
    publisher: { '@id': abs(site, ORG_ID) },
    inLanguage: HTML_LANG[lang],
  };
}

type ArticleInput = {
  url: URL;
  headline: string;
  description: string;
  datePublished: string;
  /** `_updatedAt` из Sanity; при отсутствии Google берёт `datePublished`. */
  dateModified?: string;
  authorName: string;
  /** Страница автора, если она есть: `Person` без `url` почти не даёт сигнала. */
  authorUrl?: string;
  imageUrl?: string;
  lang: Language;
  section?: string;
};

/**
 * `headline` обрезается до 110 символов: это документированный предел Google,
 * и более длинный заголовок делает разметку невалидной целиком, а не просто
 * усечённой. Обрезаем по границе слова, чтобы в выдачу не уехала половина.
 */
function headline(value: string): string {
  if (value.length <= 110) return value;
  const cut = value.slice(0, 110);
  const space = cut.lastIndexOf(' ');
  return (space > 60 ? cut.slice(0, space) : cut).trimEnd() + '…';
}

export function article(site: URL, input: ArticleInput): SchemaNode {
  const node: SchemaNode = {
    '@type': 'Article',
    headline: headline(input.headline),
    description: input.description,
    datePublished: input.datePublished,
    dateModified: input.dateModified || input.datePublished,
    inLanguage: HTML_LANG[input.lang],
    mainEntityOfPage: { '@type': 'WebPage', '@id': input.url.toString() },
    author: input.authorUrl
      ? { '@type': 'Person', name: input.authorName, url: input.authorUrl }
      : { '@type': 'Person', name: input.authorName },
    publisher: { '@id': abs(site, ORG_ID) },
    isPartOf: { '@id': abs(site, SITE_ID) },
  };
  if (input.imageUrl) node.image = input.imageUrl;
  if (input.section) node.articleSection = input.section;
  return node;
}

/** Элемент хлебных крошек: `name` — то, что видит читатель, `url` — абсолютный. */
export type Crumb = { name: string; url: string };

export function breadcrumbs(items: Crumb[]): SchemaNode {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * `FAQPage` собирается только из вопросов, реально отрисованных на странице.
 * Разметка, описывающая то, чего в HTML нет, — это несоответствие контенту,
 * за которое Google снимает расширенный сниппет целиком. Поэтому на вход
 * подаётся уже отфильтрованный по гео список, тот же, что идёт в разметку.
 */
export function faqPage(items: { question: string; answer: string }[]): SchemaNode {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}
