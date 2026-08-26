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

Required at build/runtime (in `.env`, gitignored): `SANITY_PROJECT_ID` and `SANITY_DATASET`, consumed in `src/lib/sanity.ts`.

There is deliberately **no** `SANITY_API_TOKEN` — see Security invariants. A write token will be needed later by the news pipeline, but it lives in GitHub Secrets and never in the site client. Planned secrets are tracked, names only, in `docs/pipeline-secrets.md`.

## Architecture

### Routing & i18n

- All public routes live under `src/pages/[lang]/...`, where `lang` is one of the 7 supported languages defined in `src/i18n/languages.ts`: `LANGUAGES = ['ru', 'en', 'es', 'pt', 'de', 'fr', 'br']`, with `DEFAULT_LANGUAGE = 'ru'`. The site root `/` redirects to `/ru/` (configured in `astro.config.mjs`). **Only `INDEXED_LANGUAGES = ['en', 'es']` participate in search**: sitemap, hreflang and the language switcher list them alone, the other five render with `noindex, follow` (owner's decision of 2026-08-25 superseding the ru/en pair — reverting a locale is a one-line change in `src/i18n/languages.ts`). `PRIMARY_LANGUAGE = 'en'` is the root-redirect target, the `x-default` target and the smoke-test URL; it is deliberately separate from `DEFAULT_LANGUAGE = 'ru'`, which remains the CONTENT fallback root. Articles rendered from the Russian fallback get `noindex` and are excluded from the sitemap and from hreflang alternates (`translationsMap` in `src/lib/sanity.ts`, `alternates` prop of `BaseLayout`).
- `src/i18n/utils.ts` provides `path(lang, ...segments)`, which builds language-prefixed URLs with a trailing slash — the canonical form the middleware redirects to.
- `src/i18n/ui.ts` holds all UI copy (nav labels, hero text, footer, etc.) per language as a typed `Translation` record, accessed via `useTranslations(lang)`.
- `src/i18n/sections.ts` exports `SectionId` (derived from the keys of `Translation['sections']`, so a section without a translated name cannot exist) plus per-section colors and icons. **Neither is used in the markup any more** — the theme has a single accent and no emoji. They are kept for the OG-card generator, which encodes a section as colour and glyph inside a raster where CSS tokens do not exist. Both carry a do-not-delete comment; `grep` will not find callers.
- Route groups: `[lang]/index.astro` (homepage index), `[lang]/[section]/index.astro` (niche archive), `[lang]/articles/[slug].astro` (article page), `[lang]/faq.astro`, `[lang]/authors/[slug].astro` (author profile), `[lang]/tools/wagering-calculator.astro` (client-side calculator), plus static pages `about`/`contacts`/`privacy`/`terms`/`editorial-policy`, and `src/pages/404.astro`.
- **`src/middleware.ts` runs before every route** and does three things, in this order: rejects an unknown language prefix with `rewrite('/404')`; 301-redirects any path without a trailing slash to the canonical form; serves and stores HTML in `caches.default`. Order matters — validating the language first means `/wp-login.php` gets a 404 directly instead of a redirect to a 404, and neither garbage URLs nor redirects ever enter the cache.
- The edge cache key is `/__edge/<country><pathname>`. **The country is mandatory**: pages vary by `cf-ipcountry` through `blockedIn`, so a country-less key would serve one jurisdiction's HTML to another. Query strings are deliberately excluded from the key — no page reads `searchParams`, and leaving them out stops `?utm_source=…` from fragmenting the cache. Any future page that does read `searchParams` must revisit `cacheKey()`.
- `src/pages/sitemap.xml.ts` is an SSR endpoint that builds `sitemap.xml` at request time from `getSections()`/`getArticles()` × `LANGUAGES`, with `hreflang` alternates and `lastmod`. Referenced from `public/robots.txt`.

### Content sources — Sanity is canonical for editorial content

- `src/lib/sanity.ts` creates the client and exposes `getSections(opts)` (pass `{ bodyLang }` to pull the hub text), `getArticles(lang, opts)`, `getArticleBySlug(slug, lang)`, `getAuthorBySlug(slug, lang)`, `getFaqItems(lang)`, `getSitemapContent()`, plus `renderMarkdown`, `isBlockedInCountry`, `markContentUnavailable` and `DATA_ERROR_COPY`.
- **Queries are narrowed to one language in GROQ**, not filtered in JS: the projection resolves `title`/`description`/`body` for the requested language with a fallback to `ru`, and returns a `hasTranslation` flag alongside. Fetching all seven languages cost roughly 4× the payload and grew linearly with the article count. The language is validated *inside* the data layer, not only in the route — a GROQ field name is interpolated, so an unvalidated value is an injection.
- **Every query goes through `fetchOrDegrade()`**, which returns `{ data, failed }` instead of throwing. A CMS outage must not turn into a 500: pages render an explicit notice and call `markContentUnavailable()` for a 503, and `sitemap.xml` falls back to static routes. Distinguishing «the CMS is empty» from «the CMS is unreachable» is the point — do not collapse the two.
- Sanity documents (schemas in `studio/schemaTypes/`) store **per-language fields directly on each document** as `title_<lang>`, `description_<lang>`, `body_<lang>` / `question_<lang>`, `answer_<lang>` for each of the 7 languages — there is no separate translation document for articles/FAQ/sections.
- **Geo-blocking**: articles and FAQ items can carry a `blockedIn` array of country codes. Sections cannot — there is no such field in `studio/schemaTypes/section.js`. Pages read `cf-ipcountry` and filter via `isBlockedInCountry(blockedIn, country)`. Absent header means no filtering, so local development shows everything.

### Static pages — local content collections

- `src/content.config.ts` defines two Astro content collections, used by `src/layouts/StaticPageLayout.astro`: `pages` (`src/content/pages/*.md` — Russian-canonical about/contacts/privacy/terms content) and `pageTranslations` (`src/content/translations/pages/<lang>/*.md` — translated copies). If no translation exists for a language, the Russian original is rendered with a "translation missing" notice.
- All other editorial content (articles, FAQ, niche sections) lives in Sanity — don't add new editorial content as local Markdown; add it in Sanity Studio instead.

### Styling

The theme is direction A, «Указатель». It is grounded in the subject: the portal is about probability — RTP, odds, wagering, basic strategy — which is a world of tables and numbers, not glamour. Dark-with-gold is the visual cliché of the niche the editorial line explicitly rejects, so the palette is paper in a cool green instead.

- All styles live in `src/styles/global.css`, organized into `/* ── Section ── */`-delimited blocks, in this order: **Токены · Сброс · Каркас · Шапка · Подвал · Индекс · Шапка страницы · Проза · FAQ · Плашки · Инструменты · 404 · Адаптив**.
- **Colour is five tokens, and that is deliberate**: `--paper`, `--paper-2`, `--ink`, `--soft`, `--rule`, plus the single accent `--mark`. Do not add a second accent.
- Type scale `--t-xs … --t-4xl`, spacing scale `--s-1 … --s-8`, frame `--measure` (reading column), `--rail` and `--rail-gap` (the reading-time rail), `--page-w`. Never hardcode a value that a token already covers.
- Fonts are system stacks: `--serif` for reading, `--sans` for labels. **No external font domains** — Google Fonts were removed on purpose (render-blocking request plus handing EU readers' IPs to a third party). Self-host from `public/` if a face is ever needed.
- `.section` is the single owner of vertical rhythm between page bands; children must not add their own margins. The previous theme lost this and ended up with inline `style="margin-top:…"` in the markup.
- The signature element is reading time as a large numeral in the left rail, identical on the index and inside an article. It reads from the existing `readingTime` field.
- Responsive rules are consolidated at the bottom of the file. On narrow screens the rail collapses into the section label line — it would otherwise eat a quarter of the width.
- **There is no dark theme yet.** Tokens are ready for one, but every colour is currently defined once, on `:root`. When the dark pair is added, no colour may have its only definition inside a media query.

### Deployment

- Build output is SSR for Cloudflare (`@astrojs/cloudflare` adapter, `output: 'server'`).
- **Redirected configuration — the non-obvious part.** The root `wrangler.toml` does *not* drive the deploy on its own. The build writes `.wrangler/deploy/config.json`, which points wrangler at the adapter-generated `dist/server/wrangler.json` (`main: entry.mjs`, `assets.directory: ../client`). So `[assets] directory` in the root file is inert; `compatibility_date` and `[observability]` *do* propagate. Don't "fix" the root `wrangler.toml` without running `npx wrangler deploy --dry-run` first.
- `scripts/patch-wrangler.mjs` runs between build and deploy. The adapter unconditionally declares a KV binding `SESSION` (for Astro sessions) with no `id`; deploying that fails with Error 1101. Sessions aren't used here, so the script strips bindings that have no `id` and loudly warns about any other binding that needs a Cloudflare account resource (D1, R2, Durable Objects…) instead of letting the deploy fail opaquely.
- `.github/workflows/deploy.yml` runs on push to `main` (or manual `workflow_dispatch`): writes `.env` from secrets, `npx astro check`, `npm run build`, the wrangler patch script, `wrangler deploy`, then a smoke test against `https://ve7as.com/ru/`.
- **Content changes do not need a deploy.** Every route is SSR and reads Sanity per request, so new or edited articles appear immediately. The old `repository_dispatch` (`sanity-deploy`) trigger was removed for this reason — deploy only when code, styles, `src/i18n/` strings, or `src/content/` Markdown change.

### Security invariants

- `SANITY_API_TOKEN` is **not** used: the `production` dataset is public and the client reads anonymously. A token made the client return `drafts.*` and disabled CDN caching. Keep `perspective: 'published'` and `apiVersion >= '2025-02-19'` in `src/lib/sanity.ts`.
- Markdown from the CMS is rendered with `set:html`, so `renderMarkdown()` in `src/lib/sanity.ts` sanitizes in two layers: a `marked` renderer that escapes raw HTML and allow-lists URL schemes, then an `ultrahtml` tag/attribute allow-list. Never bypass it or feed CMS strings into `set:html` directly.
- JSON-LD goes through `jsonLd()` in `BaseLayout.astro`, which escapes `<` — `JSON.stringify` alone lets a `</script>` in CMS text break out of the block. Structured data is a single `@graph` per page assembled in `src/lib/schema.ts` (`Organization`/`WebSite` always; pages pass `Article`, `BreadcrumbList`, `FAQPage`, `Person`, `SoftwareApplication` via the `schema` prop) — add new JSON-LD through that module, never as a second `<script>` block.
- Never put secrets into `.claude/settings.local.json` permission rules; Claude Code stores approved commands verbatim. That file is gitignored, and the repository is public.
