export const LANGUAGES = ['ru', 'en', 'es', 'pt', 'de', 'fr', 'br'] as const;

export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'ru';

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
