import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 've7as',

  projectId: 'g2lmhk5n',
  dataset: 'production',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },

  document: {
    /**
     * У заметок редактора новостного конвейера (newsReview) нет действия Publish.
     *
     * Датасет публичный, а черновики анонимным запросам не отдаются
     * («neither drafts nor versions are served to unauthenticated requests»),
     * поэтому заметки с именами и критикой безопасны, пока остаются черновиком.
     * Нажатие Publish сделало бы их публично читаемыми через API. Это не сетевая
     * защита (токен с правом записи опубликует что угодно), а защита от случайного
     * нажатия редактором, который перебирает список документов.
     */
    actions: (prev, {schemaType}) =>
      schemaType === 'newsReview' ? prev.filter(({action}) => action !== 'publish') : prev,
  },
})
