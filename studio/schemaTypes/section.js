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
  ],
  preview: {
    select: { title: 'title', subtitle: 'icon' },
  },
}
