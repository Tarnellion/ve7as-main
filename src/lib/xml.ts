/**
 * Экранирование для XML-выдач: sitemap, news sitemap, RSS.
 *
 * Жило в `sitemap.xml.ts`, пока выдача была одна. С появлением фида и
 * новостного sitemap копий стало бы три, а это ровно тот случай, когда
 * расхождение между копиями не заметно глазом и всплывает дырой: заголовок
 * статьи приходит из CMS, и незакрытая кавычка или `&` ломают весь документ
 * целиком — парсер XML не прощает, в отличие от HTML.
 *
 * Порядок замен важен: `&` первым, иначе он испортит уже вставленные
 * `&lt;` и `&quot;`.
 */
export function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Управляющие символы, которых в XML 1.0 быть не может ни в каком виде —
 * даже экранированными. В текст из CMS они попадают копипастом из PDF и
 * Word: один такой символ делает документ невалидным целиком.
 * Разрешены только табуляция, перевод строки и возврат каретки.
 */
export function stripControlChars(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

/** Текст из CMS, пригодный для вставки в XML. */
export function xmlText(value: string): string {
  return xmlEscape(stripControlChars(value));
}
