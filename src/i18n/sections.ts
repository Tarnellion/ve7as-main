import type { Translation } from './ui';

/** Идентификаторы ниш портала. Единственный источник правды — ключи
 *  `sections` в `Translation`: раздел без перевода названия существовать
 *  не может, поэтому отдельный список пришлось бы держать в синхроне
 *  вручную. */
export type SectionId = keyof Translation['sections'];

const FALLBACK_COLOR = '#e8b34a';
const FALLBACK_ICON = '✦';

export const SECTION_COLORS: Record<SectionId, string> = {
  'casino-slots': '#e8b34a',
  'sports-betting': '#5fc9b8',
  'poker-table-games': '#d8718f',
  'lottery-esports': '#7c98f0',
};

/** НЕ мёртвый код. В вёрстке эмодзи не используются — они рисуются
 *  по-разному на каждой платформе и не поддаются стилизации, — но нужны
 *  генератору OG-карточек, где символ рисуется в картинку, а не в DOM.
 *  Не удалять вместе с `sectionIcon`. */
export const SECTION_ICONS: Record<SectionId, string> = {
  'casino-slots': '🎰',
  'sports-betting': '⚽',
  'poker-table-games': '♠️',
  'lottery-esports': '🎲',
};

/** Принимает `string`, а не `SectionId`: сюда приходят id разделов из CMS,
 *  которые типу не подчиняются. Для неизвестного значения — фолбэк. */
export function sectionColor(id: string): string {
  return (SECTION_COLORS as Record<string, string | undefined>)[id] ?? FALLBACK_COLOR;
}

/** См. `sectionColor` про `string` в параметре. */
export function sectionIcon(id: string): string {
  return (SECTION_ICONS as Record<string, string | undefined>)[id] ?? FALLBACK_ICON;
}
