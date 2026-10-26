/**
 * Заметки редактора к материалу новостного конвейера.
 *
 * ПОЧЕМУ ОТДЕЛЬНЫЙ ДОКУМЕНТ, А НЕ ПОЛЕ СТАТЬИ. Датасет `production` публичный:
 * любой может прочитать опубликованный документ через API целиком, со всеми
 * полями, — «на сайте не показывается» не значит «закрыто». Заметки содержат
 * критику, спорные утверждения и имена, которые модель пометила как рискованные.
 * Если держать их в статье, они становятся публичными в тот момент, когда
 * редактор нажимает Publish.
 *
 * Документ этого типа создаётся только как черновик (`drafts.` в идентификаторе)
 * и никогда не публикуется. По документации Sanity «neither drafts nor versions
 * are served to unauthenticated requests», поэтому такой документ доступен
 * только вошедшим в Studio. Создаёт его конвейер (scripts/news/deliver.mjs).
 *
 * НЕ НАЖИМАЙТЕ Publish НА ЭТОМ ДОКУМЕНТЕ: опубликованный, он станет публичным.
 */
export default {
  name: 'newsReview',
  title: 'News review (private — never publish)',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Article',
      type: 'string',
      readOnly: true,
    },
    {
      name: 'articleId',
      title: 'Article document id',
      description: 'The article this review belongs to. Open it from the Article list.',
      type: 'string',
      readOnly: true,
    },
    {
      name: 'mode',
      title: 'Delivered as',
      type: 'string',
      readOnly: true,
    },
    {
      name: 'wouldAutoPublish',
      title: 'Would have been published automatically',
      description: 'What the pipeline would have done in "auto" mode. Use it to judge whether auto mode is ready.',
      type: 'boolean',
      readOnly: true,
    },
    {
      name: 'notes',
      title: 'Notes',
      description:
        'Sources, claims to verify by hand, why a person is needed, the second-pass verdict. ' +
        'Do NOT publish this document: the dataset is public.',
      type: 'text',
      rows: 22,
      readOnly: true,
    },
    { name: 'createdAt', title: 'Created', type: 'datetime', readOnly: true },
  ],
  preview: {
    select: { title: 'title', subtitle: 'mode' },
  },
}
