# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Ve7as (`ve7as.com`) is a multilingual SEO content portal about online casino/betting/poker/lottery niches. It is an **Astro 6 SSR app** deployed to **Cloudflare Workers**, with editorial content (articles, FAQ, niche sections) managed in **Sanity CMS**. Static legal/info pages (about, contacts, privacy, terms) are stored as local Markdown content collections.

## Commands

```bash
npm install         # install deps (Node >= 22.12.0)
npm run dev          # astro dev server
npm run build        # astro build -> dist/
npm run preview      # preview the built output (wrangler/cloudflare)
npx astro check      # typecheck (uses @astrojs/check + strict tsconfig)
```

Sanity Studio is a separate npm project in `studio/`:

```bash
cd studio
npm install
npm run dev          # local Sanity Studio
npm run deploy       # deploy hosted Studio
```

There is no test suite or linter configured at the root.

### Environment variables

Required at build/runtime (in `.env`, gitignored): `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_TOKEN`. These are consumed in `src/lib/sanity.ts` to create the Sanity client.

## Architecture

### Routing & i18n

- All public routes live under `src/pages/[lang]/...`, where `lang` is one of the 7 supported languages defined in `src/i18n/languages.ts`: `LANGUAGES = ['ru', 'en', 'es', 'pt', 'de', 'fr', 'br']`, with `DEFAULT_LANGUAGE = 'ru'`. The site root `/` redirects to `/ru/` (configured in `astro.config.mjs`).
- `src/i18n/utils.ts` provides `path(lang, ...segments)` to build language-prefixed URLs and `languagePaths()` for `getStaticPaths`.
- `src/i18n/ui.ts` holds all UI copy (nav labels, hero text, footer, etc.) per language as a typed `Translation` record, accessed via `useTranslations(lang)`.
- `src/i18n/sectionTheme.ts` maps niche section IDs (`casino-slots`, `sports-betting`, `poker-table-games`, `lottery-esports`) to accent colors/icons used across cards and page headers.
- Route groups: `[lang]/index.astro` (homepage feed), `[lang]/[section]/index.astro` (niche archive), `[lang]/articles/[slug].astro` (article page), `[lang]/faq.astro`, plus static pages `about`/`contacts`/`privacy`/`terms`.
- `src/pages/sitemap.xml.ts` is an SSR endpoint that builds `sitemap.xml` at request time from `getSections()`/`getArticles()` × `LANGUAGES`, with `hreflang` alternates and `lastmod`. Referenced from `public/robots.txt`.

### Content sources — Sanity is canonical for editorial content

- `src/lib/sanity.ts` creates the Sanity client and exposes `getSections()`, `getArticles()`, `getArticleBySlug()`, `getFaqItems()`, plus helpers `getArticleText`/`getArticleBody`/`getFaqText` (language fallback to `ru`) and `isBlockedInCountry`.
- Sanity documents (schemas in `studio/schemaTypes/`) store **per-language fields directly on each document** as `title_<lang>`, `description_<lang>`, `body_<lang>` / `question_<lang>`, `answer_<lang>` for each of the 7 languages — there is no separate translation document for articles/FAQ/sections.
- **Geo-blocking**: articles, sections and FAQ items can carry a `blockedIn` array of country codes. Pages read the visitor's country from the `cf-ipcountry` request header (Cloudflare) and filter content via `isBlockedInCountry(blockedIn, country)`.

### Static pages — local content collections

- `src/content.config.ts` defines two Astro content collections, used by `src/layouts/StaticPageLayout.astro`: `pages` (`src/content/pages/*.md` — Russian-canonical about/contacts/privacy/terms content) and `pageTranslations` (`src/content/translations/pages/<lang>/*.md` — translated copies). If no translation exists for a language, the Russian original is rendered with a "translation missing" notice.
- All other editorial content (articles, FAQ, niche sections) lives in Sanity — don't add new editorial content as local Markdown; add it in Sanity Studio instead.

### Styling

- All styles live in `src/styles/global.css`, organized into `/* ── Section ── */`-delimited blocks (Variables, Reset, Layout, Nav, Hero, Sections, Niche cards, Article feed/cards, Buttons, Prose, TOC, FAQ, Footer, Editorial feed, Responsive).
- Theme is driven by CSS custom properties in `:root` (`--bg`, `--bg-2/3`, `--accent`, `--accent-2`, `--text`, `--text-dim`, `--border`, `--radius`, `--max-w`, `--font-serif`) — reuse these instead of hardcoding values.
- Responsive breakpoints are consolidated at the bottom of `global.css`.

### Deployment

- Build output is SSR for Cloudflare (`@astrojs/cloudflare` adapter, `output: 'server'`).
- `scripts/patch-wrangler.mjs` strips the auto-added `kv_namespaces`/`images` bindings from `dist/server/wrangler.json` before deploy (these need Cloudflare account resources that aren't provisioned — without this step deploys fail with Error 1101).
- `.github/workflows/deploy.yml` runs on push to `main` or a `repository_dispatch` (`sanity-deploy`, triggered by a Sanity webhook): writes `.env` from secrets, `npm run build`, runs the wrangler patch script, then `wrangler deploy`.
