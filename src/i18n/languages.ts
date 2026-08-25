export const LANGUAGES = ['ru', 'en', 'es', 'pt', 'de', 'fr', 'br'] as const;

export type Language = (typeof LANGUAGES)[number];

/**
 * Корень фолбэка КОНТЕНТА. Девять существующих статей написаны по-русски,
 * остальные языки — переводы, поэтому пустое поле перевода подставляет
 * русский текст (см. `localized()` в src/lib/sanity.ts).
 *
 * Это НЕ канонический язык сайта — см. `PRIMARY_LANGUAGE`. Роли разведены
 * намеренно: склеивать их значит, что смена одной потянет вторую.
 */
export const DEFAULT_LANGUAGE: Language = 'ru';

/**
 * Канонический язык: цель корневого редиректа `/`, адресат `hreflang="x-default"`
 * и объект смоук-теста после деплоя. Обязан входить в `INDEXED_LANGUAGES` —
 * иначе точка входа на сайт закрыта от индексации.
 */
export const PRIMARY_LANGUAGE: Language = 'en';

/**
 * Локали, участвующие в поиске: sitemap, hreflang, переключатель языков,
 * `index, follow`.
 *
 * Решение от 24.08.2026 (см. docs/seo/roadmap.md, фаза 2): пока на приоритетном
 * английском нет 40+ материалов, пять локалей выведены из индекса — 133 URL на
 * 9 материалов размазывали бюджет обхода, а `pt` и `br` дословно дублировали
 * друг друга. Страницы остальных локалей ОСТАЮТСЯ доступными по прямой ссылке
 * (200, `noindex, follow`) — это обратимо правкой одной строки здесь, ссылочный
 * вес входящих ссылок не теряется.
 *
 * `x-default` указывает на `PRIMARY_LANGUAGE`, а не на первый элемент списка.
 * Порядок — как в `LANGUAGES`.
 */
export const INDEXED_LANGUAGES: readonly Language[] = ['en', 'es'];

export function isIndexable(lang: Language): boolean {
  return INDEXED_LANGUAGES.includes(lang);
}

/** Native display name shown in the language switcher. */
export const LANGUAGE_NAMES: Record<Language, string> = {
  ru: 'Русский',
  en: 'English',
  es: 'Español',
  pt: 'Português',
  de: 'Deutsch',
  fr: 'Français',
  br: 'Português (BR)',
};

/** BCP 47 tag used for the <html lang> attribute and hreflang annotations. */
export const HTML_LANG: Record<Language, string> = {
  ru: 'ru',
  en: 'en',
  es: 'es',
  pt: 'pt-PT',
  de: 'de',
  fr: 'fr',
  br: 'pt-BR',
};

export function isLanguage(value: string): value is Language {
  return (LANGUAGES as readonly string[]).includes(value);
}
