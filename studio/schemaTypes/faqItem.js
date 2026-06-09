const GEO_OPTIONS = [
  { title: 'Germany', value: 'DE' },
  { title: 'Spain', value: 'ES' },
  { title: 'France', value: 'FR' },
  { title: 'Portugal', value: 'PT' },
  { title: 'Brazil', value: 'BR' },
  { title: 'Russia', value: 'RU' },
]

export default {
  name: 'faqItem',
  title: 'FAQ Item',
  type: 'document',
  fields: [
    {
      name: 'question',
      title: 'Question (RU)',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'question', maxLength: 96 },
      validation: Rule => Rule.required(),
    },
    {
      name: 'answer',
      title: 'Answer (RU)',
      type: 'text',
    },
    {
      name: 'order',
      title: 'Order',
      type: 'number',
      initialValue: 0,
    },
    {
      name: 'blockedIn',
      title: 'Hide in countries',
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
            { name: 'question', title: 'Question', type: 'string' },
            { name: 'answer', title: 'Answer', type: 'text' },
          ],
          preview: { select: { title: 'lang' } },
        },
      ],
    },
  ],
  preview: {
    select: { title: 'question' },
  },
}
