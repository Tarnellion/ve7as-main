const LANGS = ['ru', 'en', 'es', 'pt', 'de', 'fr', 'br']
const LANG_LABELS = { ru: '🇷🇺 RU', en: '🇬🇧 EN', es: '🇪🇸 ES', pt: '🇵🇹 PT', de: '🇩🇪 DE', fr: '🇫🇷 FR', br: '🇧🇷 BR' }

// Языковые поля по образцу article: роль (короткая строка под именем)
// и биография. Русский обязателен, остальное — по мере перевода.
const langFields = LANGS.flatMap((lang) => [
  {
    name: `role_${lang}`,
    title: 'Role / position',
    description: 'Например: «QA-инженер игровой платформы». Выводится под именем.',
    type: 'string',
    group: lang,
    validation: lang === 'ru' ? (Rule) => Rule.required() : undefined,
  },
  {
    name: `bio_${lang}`,
    title: 'Bio',
    description: 'Markdown. Чем конкретнее опыт (индустрия, годы, чем занимается), тем сильнее E-E-A-T.',
    type: 'text',
    rows: 8,
    group: lang,
    validation: lang === 'ru' ? (Rule) => Rule.required() : undefined,
  },
])

export default {
  name: 'author',
  title: 'Author',
  type: 'document',
  groups: [
    { name: 'settings', title: '⚙️ Settings', default: true },
    ...LANGS.map((lang) => ({ name: lang, title: LANG_LABELS[lang] })),
  ],
  fields: [
    {
      name: 'name',
      title: 'Name',
      description: 'Публичное имя, одинаковое на всех языках.',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'links',
      title: 'Profile links (sameAs)',
      description: 'Публичные профили: LinkedIn, GitHub, отраслевые площадки. Идут в разметку Person.sameAs — это то, чем Google связывает автора с реальным человеком.',
      type: 'array',
      of: [{ type: 'url' }],
    },
    ...langFields,
  ],
  preview: {
    select: { title: 'name', subtitle: 'role_ru', media: 'photo' },
  },
}
