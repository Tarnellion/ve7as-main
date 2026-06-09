export const SECTION_COLORS: Record<string, string> = {
  'casino-slots': '#e8b34a',
  'sports-betting': '#5fc9b8',
  'poker-table-games': '#d8718f',
  'lottery-esports': '#7c98f0',
};

export const SECTION_ICONS: Record<string, string> = {
  'casino-slots': '🎰',
  'sports-betting': '⚽',
  'poker-table-games': '♠️',
  'lottery-esports': '🎲',
};

export function sectionColor(id: string): string {
  return SECTION_COLORS[id] ?? '#e8b34a';
}

export function sectionIcon(id: string): string {
  return SECTION_ICONS[id] ?? '✦';
}
