export default {
  name: 'section',
  title: 'Section',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title (RU)',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: Rule => Rule.required(),
    },
    {
      name: 'icon',
      title: 'Icon (emoji)',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Description (RU)',
      type: 'text',
      rows: 2,
    },
    {
      name: 'order',
      title: 'Order',
      type: 'number',
      initialValue: 0,
    },
    // Текст хаба: рендерится на странице рубрики под списком статей.
    // Хабу без текста нечем ранжироваться по категорийному запросу —
    // см. находку M2 в docs/seo/tech-audit-2026-08-24.md основного репо.
    ...['ru', 'en', 'es', 'pt', 'de', 'fr', 'br'].map((lang) => ({
      name: `body_${lang}`,
      title: `Hub text (${lang.toUpperCase()})`,
      description: 'Markdown, начинать с H2. 600–900 слов.',
      type: 'text',
      rows: 15,
    })),
  ],
  preview: {
    select: { title: 'title', subtitle: 'icon' },
  },
}
