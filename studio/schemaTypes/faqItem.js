const LANGS = ['ru', 'en', 'es', 'pt', 'de', 'fr', 'br']
const LANG_LABELS = { ru: '🇷🇺 RU', en: '🇬🇧 EN', es: '🇪🇸 ES', pt: '🇵🇹 PT', de: '🇩🇪 DE', fr: '🇫🇷 FR', br: '🇧🇷 BR' }

const GEO_OPTIONS = [
  { title: 'Germany', value: 'DE' },
  { title: 'Spain', value: 'ES' },
  { title: 'France', value: 'FR' },
  { title: 'Portugal', value: 'PT' },
  { title: 'Brazil', value: 'BR' },
  { title: 'Russia', value: 'RU' },
]

const langFields = LANGS.flatMap((lang) => [
  {
    name: `question_${lang}`,
    title: 'Question',
    type: 'string',
    group: lang,
    validation: lang === 'ru' ? (Rule) => Rule.required() : undefined,
  },
  {
    name: `answer_${lang}`,
    title: 'Answer',
    type: 'text',
    rows: 8,
    group: lang,
  },
])

export default {
  name: 'faqItem',
  title: 'FAQ Item',
  type: 'document',
  groups: [
    { name: 'settings', title: '⚙️ Settings', default: true },
    ...LANGS.map((lang) => ({ name: lang, title: LANG_LABELS[lang] })),
  ],
  fields: [
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'settings',
      options: { source: 'question_ru', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'order',
      title: 'Order',
      type: 'number',
      group: 'settings',
      initialValue: 0,
    },
    {
      name: 'blockedIn',
      title: 'Hide in countries',
      type: 'array',
      of: [{ type: 'string' }],
      options: { list: GEO_OPTIONS },
      group: 'settings',
    },
    ...langFields,
  ],
  preview: {
    select: { title: 'question_ru' },
  },
}
