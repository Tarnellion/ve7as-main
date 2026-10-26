// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

/**
 * Идентификатор сборки. Попадает в ключ edge-кэша (`src/middleware.ts`),
 * поэтому выкатка новой сборки делает прошлые записи недостижимыми.
 *
 * Зачем: HTML лежит в `caches.default` 300 с и ссылается на ассеты по
 * хэшу имени. Деплой, меняющий CSS или клиентский JS, выдаёт новый хэш и
 * удаляет старый файл — и закэшированный HTML пять минут указывает на 404.
 * Наблюдалось на проде 26.10.2026: главная отдавала `BaseLayout.DkKNR9mX.css`
 * при живом `BaseLayout.BPAgKiIh.css`, то есть сайт стоял без стилей.
 *
 * Берём SHA коммита: он детерминирован, поэтому повторная сборка того же
 * коммита даёт тот же ключ — и правильно, ассеты у неё те же, сбрасывать
 * нечего. Вне CI подставляется время старта: локально Cache API всё равно
 * нет (`astro dev` крутится на Node), значение нужно лишь для типа.
 */
const BUILD_ID = (process.env.GITHUB_SHA ?? '').slice(0, 8) || `dev${Date.now().toString(36)}`;

export default defineConfig({
  site: 'https://ve7as.com',
  output: 'server',
  adapter: cloudflare({ imageService: 'passthrough' }),
  redirects: {
    '/': '/en/',
  },
  vite: {
    define: {
      __BUILD_ID__: JSON.stringify(BUILD_ID),
    },
  },
});
