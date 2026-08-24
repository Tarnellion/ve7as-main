import { type Language } from './languages';

/** Builds an absolute, language-prefixed path, e.g. path('en', 'faq') -> '/en/faq/'. */
export function path(lang: Language, ...segments: string[]): string {
  const cleaned = segments
    .filter(Boolean)
    .flatMap((segment) => segment.split('/'))
    .filter(Boolean);
  return `/${[lang, ...cleaned].join('/')}/`;
}
