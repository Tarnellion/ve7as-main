const LANGS = ['ru', 'en', 'es', 'pt', 'de', 'fr', 'br']
const LANG_LABELS = { ru: '🇷🇺 RU', en: '🇬🇧 EN', es: '🇪🇸 ES', pt: '🇵🇹 PT', de: '🇩🇪 DE', fr: '🇫🇷 FR', br: '🇧🇷 BR' }

const GEO_OPTIONS = [
  { title: 'Germany', value: 'DE' },
  { title: 'Spain', value: 'ES' },
  { title: 'France', value: 'FR' },
  { title: 'Portugal', value: 'PT' },
  { title: 'Brazil', value: 'BR' },
  { title: 'Russia', value: 'RU' },
  { title: 'United Kingdom', value: 'GB' },
  { title: 'United States', value: 'US' },
]

const langFields = LANGS.flatMap((lang) => [
  {
    name: `title_${lang}`,
    title: 'Title',
    type: 'string',
    group: lang,
    validation: lang === 'ru' ? (Rule) => Rule.required() : undefined,
  },
  {
    name: `description_${lang}`,
    title: 'Description',
    type: 'text',
    rows: 2,
    group: lang,
  },
  {
    name: `body_${lang}`,
    title: 'Body',
    type: 'text',
    rows: 20,
    group: lang,
  },
])

export default {
  name: 'article',
  title: 'Article',
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
      options: { source: 'title_ru', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'section',
      title: 'Section',
      type: 'reference',
      to: [{ type: 'section' }],
      group: 'settings',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'pubDate',
      title: 'Publish Date',
      type: 'datetime',
      group: 'settings',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'author',
      title: 'Author',
      type: 'string',
      group: 'settings',
      initialValue: 'редакция',
    },
    {
      name: 'readingTime',
      title: 'Reading Time (min)',
      type: 'number',
      group: 'settings',
    },
    {
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      group: 'settings',
      initialValue: false,
    },
    {
      name: 'blockedIn',
      title: 'Hide in countries',
      description: 'Article will NOT be shown to users from selected countries',
      type: 'array',
      of: [{ type: 'string' }],
      options: { list: GEO_OPTIONS },
      group: 'settings',
    },
    ...langFields,
  ],
  preview: {
    select: { title: 'title_ru', subtitle: 'section.title' },
  },
}
