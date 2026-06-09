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

export default {
  name: 'article',
  title: 'Article',
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
      name: 'section',
      title: 'Section',
      type: 'reference',
      to: [{ type: 'section' }],
      validation: Rule => Rule.required(),
    },
    {
      name: 'description',
      title: 'Description (RU)',
      type: 'text',
      rows: 2,
    },
    {
      name: 'pubDate',
      title: 'Publish Date',
      type: 'datetime',
      validation: Rule => Rule.required(),
    },
    {
      name: 'author',
      title: 'Author',
      type: 'string',
      initialValue: 'редакция',
    },
    {
      name: 'readingTime',
      title: 'Reading Time (min)',
      type: 'number',
    },
    {
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
    },
    {
      name: 'body',
      title: 'Body (RU)',
      type: 'text',
    },
    {
      name: 'blockedIn',
      title: 'Hide in countries',
      description: 'This article will NOT be shown to users from selected countries',
      type: 'array',
      of: [{ type: 'string' }],
      options: { list: GEO_OPTIONS },
    },
    {
      name: 'translations',
      title: 'Translations',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'translation',
          fields: [
            { name: 'lang', title: 'Language', type: 'string', options: { list: ['en','es','pt','de','fr','br'] } },
            { name: 'title', title: 'Title', type: 'string' },
            { name: 'description', title: 'Description', type: 'text', rows: 2 },
            { name: 'body', title: 'Body', type: 'text' },
          ],
          preview: { select: { title: 'lang' } },
        },
      ],
    },
  ],
  preview: {
    select: { title: 'title', subtitle: 'section.title' },
  },
}
