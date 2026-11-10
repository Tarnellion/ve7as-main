# ve7as.com search-visibility audit: action plan, wave 1 (2026-11-10)

## Headline

With zero external links this plan cannot make ve7as.com rank for head terms (blackjack basic strategy, odds converter, no-vig calculator) and cannot make Googlebot crawl the daily news by itself. What it can do: make the roughly 45 already-indexed en/es pages eligible for long-tail queries they cannot match today (searched words in titles and H1s, worked examples, tables, hub texts, rewritten guides), put the guides and calculators one click from the home page, remove the visible trust defects (Cyrillic byline, Russian card on a Spanish hub, a dead link) and open Bing. Realistic result: the first non-brand impressions, mostly Spanish long-tail (rollover, momios, overround) and Bing. Clicks in volume need the first external links, that is, the posting plan in `docs/seo/promotion/` that is written and not yet executed.

## Order of work (effect on en/es impressions and clicks per unit of effort)

| # | id | kind | impact | effort | title |
|---|----|------|--------|--------|-------|
| 1 | O1 | owner-action | medium | S | Connect Bing Webmaster Tools |
| 2 | L1 | local-content | medium | S | Tool pages: searched words in title, H1, description, labels (en/es) |
| 3 | O2 | owner-action | medium | S | Spend the manual indexing quota on changed tools and guides, never on news |
| 4 | L2 | local-content | medium | M | Wagering calculator: formula, 35x example, four Q&As (en/es) |
| 5 | C1 | code | medium | M | Home and hubs: guides band above news, translation guard |
| 6 | S1 | sanity-content | medium | M | Hub texts into the four section documents |
| 7 | S2 | sanity-content | high | L | Rewrite the priority explainers; rollover in the es wagering article |
| 8 | C2 | code | medium | M | Odds converter: conversion table, formulas, Q&As; shared `src/lib/odds.ts` |
| 9 | C3 | code | low | S | Margin calculator: overround row, explainer, examples, Q&As |
| 10 | L3 | local-content | low | S | Lottery calculator: worked example, method, Q&As |
| 11 | L4 | local-content | low | S | Spanish UI copy: «juegos de azar y apuestas», hub ledes, skip link, tú register |
| 12 | C4 | code | low | S | Byline: «Ve7as editorial team» for house articles, Organization as author |
| 13 | C5 | code | low | M | Related guides and news under every article |
| 14 | C6 | code | low | M | Blackjack calculator: rule-impact table from the data file, 6:5 example |
| 15 | C7 | code | low | S | Tool pages: sibling links, three-level breadcrumb |
| 16 | C8 | code | low | S | Hubs: BreadcrumbList, descriptive title once the hub has text |
| 17 | P1 | pipeline | low | S | Voice guide: stop asking the model for a link to an own tool |
| 18 | P2 | pipeline | low | S | IndexNow: daily changed-only ping that also covers hand-published news |
| 19 | S3 | sanity-content | low | S | Small Sanity fixes: dead link, es FAQ wording, untranslated guide |
| 20 | O3 | owner-action | low | S | Cloudflare: www redirect, Always Use HTTPS |
| 21 | C9 | code | low | M | Head hygiene: max-image-preview, og:type article, default share card, title suffix |
| 22 | P3 | pipeline | low | S | Spanish style rule for news translation and meta |
| 23 | C10 | code | low | M | Calculators print numbers in the page locale |
| 24 | C11 | code | low | M | Margin calculator: odds-format select, up to 12 outcomes |

Conventions used below. `B` is the base URL of a local preview: `npm run dev`, then `B=http://localhost:4321` (the same checks run against `https://ve7as.com` after deploy). Every code action ends with `npx astro check`. Every action that changes a tool page sets `updated` of that tool in `src/data/tools.ts` to the commit date (the file's own rule; it drives sitemap `lastmod`). No action adds a colour token, an inline margin, a second JSON-LD block, FAQPage markup on tool pages, or user-agent branching. Spanish copy uses «tú» everywhere.

---

## O1. Connect Bing Webmaster Tools (owner, 10 minutes)

Findings: 37.

1. Open https://www.bing.com/webmasters and sign in with a Microsoft account.
2. My Sites, Import, Google Search Console. Sign in with the Google account that owns the ve7as.com property, Allow, tick ve7as.com, Import. Do not revoke that Google access later without adding a second verification method: Bing re-checks ownership through it.
3. If the import fails or does not offer the Domain property: Add site manually, `https://ve7as.com/`, XML file method; hand the downloaded `BingSiteAuth.xml` to an engineer to commit unchanged as `public/BingSiteAuth.xml`, click Verify after the deploy (the CNAME record in Cloudflare DNS is the no-deploy alternative). Do not use the meta-tag method.
4. Sitemaps: confirm `https://ve7as.com/sitemap.xml` is listed; add it by hand if not.
5. URL Inspection: inspect `https://ve7as.com/en/` and `https://ve7as.com/en/tools/blackjack-house-edge/`, note the verdict text.
6. IndexNow section: check that submissions with the site key appear and how many were crawled.
7. Only if step 5 shows pages not indexed: URL Submission within the quota shown, in this order: `/en/` and `/es/`; tools index and five calculators per language; four hubs per language; nine guides per language.
8. After 48 hours save: indexed-page count from Site Explorer, everything under Recommendations and crawl errors, the Search Performance export.

Acceptance: the site shows as verified, the sitemap is listed with about 147 URLs, and the two inspection verdicts plus the 48-hour export are saved under `docs/seo/`.

## L1. Tool pages: searched words in title, H1, description and labels (en/es)

Findings: 11, 29 (code part), 31 (register, tools part), 32, 33, 35. Files: the five tool pages, `src/pages/[lang]/tools/index.astro`, `src/data/tools.ts`.

Mechanism (all five tool pages): the copy type gets `metaTitle?: string`; `<BaseLayout title={c.metaTitle ?? c.title}>`. `<h1>{c.title}</h1>`, `SoftwareApplication.name` and the breadcrumb name stay on `c.title`. In `wagering-calculator.astro` change the type from `metaTitle: string` to `metaTitle?: string` and DELETE the `metaTitle` key from the ru, pt, de, fr and br blocks, so those five locales keep today's `<title>`; it is dead code there (never passed to the layout). Only en and es strings change. Do not touch `methodBefore` / `methodLink` / `methodAfter` semantics or the `WOO_CALCULATOR` link on the blackjack page.

**wagering-calculator.astro**
- en `metaTitle`: `Wagering requirement calculator: the cost of a bonus`
- en `description`: `Enter the bonus, the multiplier (e.g. 35x), game contribution and RTP: get the turnover you must stake and the expected loss of clearing the bonus. No sign-up.`
- en `lede`: `The turnover a bonus demands (its wagering requirement, also called playthrough or rollover) and what that turnover costs on average at a given RTP. Everything runs in your browser.`
- en `weighting`: `Game contribution (weighting), %`
- es `title`: `Calculadora de rollover (requisito de apuesta)`
- es `metaTitle`: `Calculadora de rollover de bonos (requisito de apuesta)`
- es `description`: `Calcula el rollover (requisito de apuesta) de un bono: cuánto hay que apostar con x30, x35… y cuánto cuesta de media según el RTP del juego. Gratis, sin registro.`
- es `lede`: `El volumen que exige el bono (su rollover o requisito de apuesta) y cuánto cuesta ese volumen de media con un RTP dado. Todo se calcula en tu navegador.`
- es `depositHint`: `Deja 0 si las condiciones solo exigen apostar el bono.`
- es `weightingHint`: `Las tragaperras (tragamonedas) suelen contar el 100 %; los juegos de mesa, menos.`
- es `disclaimer`: `La calculadora muestra la esperanza matemática, no una predicción de tu sesión. Comprueba siempre las condiciones del operador.`

**odds-converter.astro**
- en `metaTitle`: `Odds converter: American, decimal, fractional odds`
- en `description`: `Convert American (moneyline), decimal and fractional odds in any direction and see the implied probability: +150 = 2.50 = 6/4 = 40%. Free, no ads, no sign-up.`
- en `american`: `American (moneyline)`
- es `title`: `Conversor de cuotas de apuestas (momios)`
- es `description`: `Convierte cuotas (momios) entre formato decimal, americano y fraccionario y muestra la probabilidad implícita: +150 = 2,50 = 6/4 = 40 %. Gratis, sin registro.`
- es `lede`: `Edita cualquier campo y los demás se recalculan. La probabilidad implícita incluye el margen de la casa de apuestas.`
- es `american`: `Americano (momio)`; es `fractional`: `Fraccionario (Reino Unido)`
- es `marginLink`: `Calcular el margen de un mercado`
- es `disclaimer`: replace the last sentence `Verifique los cálculos.` with `Verifica los cálculos.`
- markup: `<input id="oc-fractional" … value="3/2">` becomes `value="6/4"` (the tool's own ladder prints 6/4 for 2.50, so raw HTML and hydrated page agree).

**margin-calculator.astro**
- en `title`: `Bookmaker margin and no-vig calculator`
- en `metaTitle`: `No-vig & bookmaker margin calculator (overround)`
- en `description`: `Enter a market’s decimal odds to get the bookmaker’s margin (overround, vig) and the fair no-vig odds for each outcome. Free, no sign-up, no operator links.`
- es `title`: `Calculadora de margen de casas de apuestas (overround)`
- es `description`: `Calcula el margen (overround) de una casa de apuestas en un mercado a partir de las cuotas decimales y muestra las cuotas justas sin margen (no-vig).`
- es `lede`: `Introduce las cuotas decimales de cada resultado: dos para mercados sin empate, tres para mercados con empate (1X2). El tercer campo puede quedar vacío.`
- es `sumHint`: `Un mercado sin margen sumaría exactamente el 100 %. Lo que pase de ahí es el margen incluido en las cuotas.`
- es `margin`: `Margen de la casa de apuestas`
- es `marginHint`: `(S − 1) / S, donde S es la suma de probabilidades. La parte de lo apostado que la casa retiene de media.`
- es `fair`: `Cuotas justas (sin margen, no-vig)`
- es `fairHint`: `Cuotas tras normalizar las probabilidades al 100 %: cómo serían sin comisión.`
- es `converterLink`: `Conversor de cuotas de apuestas`
- es `disclaimer`: last sentence `Verifique los cálculos.` becomes `Verifica los cálculos.`

**blackjack-house-edge.astro**
- en `metaTitle`: `Blackjack house edge calculator: 3:2 vs 6:5, any rules`
- en `description`: `Set the table rules (decks, 3:2 or 6:5 payout, soft 17, double after split, surrender) and see the house edge and the expected loss per 100 hands.`
- es `title`: `Calculadora de la ventaja de la casa en blackjack`
- es `description`: `Calcula la ventaja de la casa en blackjack según las reglas de la mesa: pago 3:2 o 6:5, barajas, crupier con 17 blando (S17/H17), doblar tras dividir y rendición.`
- es `lede`: `Configura las reglas de la mesa: la calculadora muestra la ventaja de la casa y su coste por 100 manos. Menos ventaja significa perder menos de media, no una forma de ganar.`
- es `decks`: `Barajas (mazos)`; es `rsa`: `Volver a dividir ases`; es `hsa`: `Pedir carta tras dividir ases`
- es `edgeHint` (template literal): `` `Estrategia básica según el total de la mano (total-dependent), con carta de corte. Modelo aditivo: en los conjuntos comprobados la desviación no superó ${String(BJ_MODEL_TOLERANCE).replace('.', ',')} pp del valor exacto.` ``
- es `negativeNote`: `La ventaja sale negativa, es decir, a favor del jugador. En la práctica no se ofrecen mesas con esta combinación: comprueba que las reglas elegidas sean reales.`
- es `methodBefore`: `Datos: efecto de cada regla tomado el 27/08/2026 de la calculadora de ` (trailing space kept)

**lottery-expected-value.astro** (its COPY has only en and es)
- en `description`: `Expected value of a Powerball, Mega Millions or EuroMillions ticket after tax, jackpot splitting and the cash-value discount, plus the break-even jackpot.`
- es `title`: `Calculadora de lotería: probabilidades y valor esperado`
- es `description`: `Probabilidad de cada premio y valor esperado de un boleto de Euromillones, Powerball o Mega Millions, con impuestos y reparto del bote. Sin registro.`
- es `lede`: `Configura el sorteo y la calculadora mostrará el valor esperado (la esperanza matemática) del boleto y lo que cuesta realmente. Esa cifra es el tamaño de la pérdida media, no una forma de evitarla.`
- es `bonusPick`: `Números adicionales (estrellas, Powerball)`
- es `cashHint`: `EuroMillones` becomes `Euromillones`
- es `ticketsHint`: `Si lo deja vacío` becomes `Si lo dejas vacío`
- es `rtpHint`: `de lo que paga` becomes `de lo que pagas`
- es `plusEv`: `El valor esperado sale positivo o nulo. Es una media sobre cientos de millones de boletos, no una predicción para el tuyo: una varianza de 1 entre 292 millones no la aguanta ningún presupuesto. Las ventanas históricas con valor esperado positivo se cerraron solas, por explosión de ventas y reparto.`
- es `pariNote`: `Los premios de este juego son de reparto (pari-mutuel): cada categoría se reparte una parte del fondo, así que las cantidades son medias a largo plazo y varían en cada sorteo.`
- es `noStrategies`: `Aquí no hay números «calientes» ni «fríos», ni sistemas ni combinaciones reducidas: las bolas no recuerdan sorteos anteriores, y elegir números nunca cambia el valor esperado, solo con quién compartes el premio.`
- es `method`: `Las probabilidades de cada categoría se recalculan con la fórmula hipergeométrica y se verificaron con las tablas oficiales el 26/10/2026; la parte del bote al ganar sale de un modelo de Poisson.`
- es `articleLink`: `Formatos de lotería: qué estás comprando en realidad`
- markup: `<option value="euromillions">{lang === 'es' ? 'Euromillones' : 'EuroMillions'}</option>`
- new copy key `cashShort` (en `cash`, es `en efectivo`); render `data-cash-label={c.cashShort}` on `<small id="lv-breakeven-assumptions">`; in the client script replace the literal word `cash` in the assumptions string (near line 462) with `out('lv-breakeven-assumptions').dataset.cashLabel ?? 'cash'`, the same way `data-jackpot-label` is already passed.

**tools/index.astro** (es block only)
- `description`: `Calculadoras gratuitas de Ve7as: rollover y coste de liberación, conversor de cuotas, margen de las casas de apuestas, ventaja de la casa en blackjack, valor esperado de la lotería. Todo se calcula en tu navegador.`
- `lede`: `Calculadoras sin registro y sin red: todo se calcula en tu navegador.`

**src/data/tools.ts** (card names are the anchors on home, hubs and the index)
- wagering `name.en`: `Wagering requirement calculator`
- odds `name.es`: `Conversor de cuotas de apuestas`; `blurb.es`: `Cuotas decimales, americanas (momios) y fraccionarias, más la probabilidad implícita.`
- margin `name.en`: `Bookmaker margin and no-vig calculator`; `name.es`: `Calculadora de margen de casas de apuestas`; `blurb.es`: `Margen (overround) de un mercado y cuotas justas sin margen (no-vig).`
- blackjack `name.es`: `Calculadora de la ventaja de la casa en blackjack`
- lottery `name.es`: `Calculadora de lotería: probabilidades y valor esperado`
- `updated` of all five tools: the commit date.

Acceptance:
- `npx astro check` passes.
- `curl -s $B/es/tools/wagering-calculator/ | grep -c '<h1>Calculadora de rollover (requisito de apuesta)</h1>'` prints 1, and its `<title>` starts with `Calculadora de rollover de bonos`.
- `curl -s $B/es/tools/odds-converter/ | grep -c 'momios'` is at least 2; `curl -s $B/en/tools/odds-converter/ | grep -c 'value="6/4"'` prints 1.
- `curl -s $B/en/tools/margin-calculator/ | grep -o '<title>[^<]*'` contains `No-vig`.
- `for p in "" wagering-calculator/ odds-converter/ margin-calculator/ blackjack-house-edge/ lottery-expected-value/; do curl -s "$B/es/tools/$p"; done | grep -ciE 'su navegador|Introduzca|Configure |Verifique|Edite |Deje |EuroMillones|fraccional'` prints 0.
- `curl -s $B/de/tools/wagering-calculator/ | grep -o '<title>[^<]*'` is unchanged from before the change.

## O2. Spend the manual indexing quota on changed tools and guides, never on news (owner, routine)

Findings: 18 (step 5), discovery decision record, context (a manual request gets a page crawled in about 2 minutes; quota about 11 a day).

1. After each deploy of L1, L2, C2, C3, L3, C6: in Search Console, URL Inspection, Request indexing for the changed tool URL in es, then en. Order across days: wagering calculator, odds converter, margin calculator, lottery, blackjack, tools index.
2. After C1 is live: request `/en/` and `/es/`, then the four hubs in each language.
3. After each Sanity edit from S1 or S2: request the edited URL in both languages the same day.
4. Do not spend any request on news URLs, and do not add further discovery channels for news (sitemap, news sitemap, RSS and depth-1 links already exist; none has produced a crawl).
5. In 2 to 3 weeks, or right after the first external link lands, re-run the inspection over the sitemap URLs (`node scripts/seo/gsc.mjs inspect <url>`), save the result as a dated file under `docs/seo/`, and compare with the 10 November snapshot. The signal to watch: a news URL with a `lastCrawlTime` that nobody requested.
6. 28 days after L1 and L2 are live, export Search Console Performance (queries, pages, en and es). First non-brand queries on tool URLs are the success sign of this plan.

Acceptance: a dated inspection file and a Performance export exist under `docs/seo/`; every URL changed by the actions above shows a crawl date later than its change.

## L2. Wagering calculator: formula, 35x example, four Q&As (en/es)

Findings: 12, 19, 39 (worked-example part). Files: `src/pages/[lang]/tools/wagering-calculator.astro`, `src/data/tools.ts`. Depends on L1.

Add optional fields to `ToolCopy`: `explainer?: { h2: string; body: string }[]`, `faqTitle?: string`, `faq?: { q: string; a: string }[]`. Fill en and es only. Render inside the existing section, after `<p class="calc-article-link">…</p>` and before `<ResponsibleGaming>`, only when present:

```astro
{(c.explainer || c.faq) && (
  <div class="prose">
    {c.explainer?.map((b) => (<><h2>{b.h2}</h2><p>{b.body}</p></>))}
    {c.faq && <h2>{c.faqTitle}</h2>}
    {c.faq?.map((f) => (<><h3>{f.q}</h3><p>{f.a}</p></>))}
  </div>
)}
```

Plain interpolation only, no `set:html`, no `<details>`, no new CSS, no FAQPage JSON-LD. The example equals the form defaults (bonus 100, x35, contribution 100 %, RTP 96); add a one-line comment at the inputs saying that the prose example depends on them.

en `explainer`:
1. `How the wagering requirement is calculated` / `Required turnover = (bonus + deposit, if the terms say "deposit + bonus") × multiplier. If a game counts for less than 100%, divide by its contribution: at 10% you must stake ten times more. Expected loss = actual turnover × (100% − RTP).`
2. `Worked example: a $100 bonus at 35x` / `A $100 bonus with a 35x requirement on the bonus means $3,500 in bets. On a 96% RTP slot the average loss over that turnover is $3,500 × 4% = $140, more than the bonus itself. On average the bonus covers the cost of the full turnover only at an RTP of 1 − 100 / 3,500 = 97.14% or higher. If the same 35x applies to deposit + bonus ($100 + $100), the turnover is $7,000 and the expected loss $280.`

en `faqTitle`: `Questions`. en `faq`:
1. `What does a 35x wagering requirement mean?` / `You must place bets worth 35 times the bonus (or the bonus plus the deposit, depending on the terms) before the bonus money can be withdrawn. $100 at 35x is $3,500 in bets, not $3,500 in losses.`
2. `Is wagering the same as playthrough or rollover?` / `Yes. Wagering requirement, playthrough and rollover name the same condition.`
3. `How do I know whether a bonus is worth taking?` / `Compare the bonus with the expected loss on the turnover. If turnover × (100% − RTP) is larger than the bonus, clearing it costs more on average than it gives. This is an average: a single session can end well above or below it.`
4. `What does the calculator leave out?` / `Maximum-bet rules, win caps, time limits, variance and the chance of losing the balance before the turnover is finished. The figure is the average cost of completing the full turnover; a real outcome can differ in either direction.`

es `explainer`:
1. `Cómo se calcula el rollover` / `Volumen requerido = (bono + depósito, si las condiciones dicen «depósito + bono») × rollover. Si un juego contribuye menos del 100 %, divide por su contribución: con un 10 % hay que apostar diez veces más. Pérdida esperada = volumen real × (100 % − RTP).`
2. `Ejemplo: bono de 100 € con rollover x35` / `Un bono de 100 € con rollover x35 sobre el bono exige 3.500 € en apuestas. En una tragaperras con RTP del 96 % la pérdida media sobre ese volumen es 3.500 € × 4 % = 140 €, más que el propio bono. De media, el bono solo cubre el coste del volumen completo con un RTP de 1 − 100 / 3.500 = 97,14 % o superior. Si el mismo x35 se aplica a depósito + bono (100 € + 100 €), el volumen sube a 7.000 € y la pérdida esperada a 280 €.`

es `faqTitle`: `Preguntas frecuentes`. es `faq`:
1. `¿Qué significa un rollover x35?` / `Que hay que apostar 35 veces el importe del bono (o del bono más el depósito, según las condiciones) antes de poder retirar. 100 € con x35 son 3.500 € en apuestas, no 3.500 € de pérdidas.`
2. `¿Rollover y requisito de apuesta son lo mismo?` / `Sí. Rollover, requisito de apuesta, wagering y playthrough nombran la misma condición.`
3. `¿Cómo saber si un bono compensa?` / `Compara el bono con la pérdida esperada: si volumen × (100 % − RTP) supera el bono, liberarlo cuesta de media más de lo que da. Es una media; una sesión concreta puede acabar muy por encima o por debajo.`
4. `¿Qué no tiene en cuenta la calculadora?` / `La apuesta máxima, los topes de ganancia, el plazo, la varianza y la posibilidad de perder el saldo antes de completar el volumen. La cifra es el coste medio de completar todo el volumen; un resultado real puede desviarse en cualquier sentido.`

Acceptance: `curl -s $B/en/tools/wagering-calculator/ | grep -c '97.14%'` prints 1; `curl -s $B/es/tools/wagering-calculator/ | grep -c '97,14 %'` prints 1 and `grep -c '¿Qué significa un rollover x35?'` prints 1; `curl -s $B/de/tools/wagering-calculator/ | grep -c 'Worked example'` prints 0; `curl -s $B/en/tools/wagering-calculator/ | grep -c FAQPage` prints 0; `npx astro check` passes.

## C1. Home and hubs: guides band above news, translation guard

Findings: 1, 5, 6, 7 (part A), 9, 22 (list part). Files: `src/lib/sanity.ts`, `src/pages/[lang]/index.astro`, `src/pages/[lang]/[section]/index.astro`, `src/i18n/ui.ts`.

Why: `/en/` and `/es/` list the 24 newest articles, all pipeline news; none of the 9 guides is linked from the home page, and the casino hub (36 items, one more a day) would start cutting its guides at 60, about 4 December.

1. `src/lib/sanity.ts`
   - Export two constants next to the limits:
     `export const GUIDE_PREDICATE = '(articleKind == "explainer" || (!defined(articleKind) && !defined(aiDisclosure)))';`
     `export const NEWS_PREDICATE = '(articleKind == "news" || (!defined(articleKind) && defined(aiDisclosure)))';`
     Comment: no document has `articleKind` yet; the field is planned in `docs/news/player-explainers-plan.md` (pipeline-written explainers will carry `aiDisclosure`, so a bare `!defined(aiDisclosure)` would file them under news). A document whose `articleKind` is neither value appears in neither list.
   - `const GUIDES_LIMIT = 50;` and correct the stale comment above `FEED_LIMIT` («Главная показывает 7 карточек»): it is the news cap of the home page.
   - Extract the card projection of `getArticles` into `function cardProjection(code: Language): string` and change its flag from `translationFlag(['title'], code)` to `translationFlag(['title', 'body'], code)`. `getArticles` keeps its signature and uses the helper (it still serves `rss.xml.ts` and `sitemap-news.xml.ts`; their `hasTranslation` filter becomes as strict as the article page's own noindex rule, no current item is lost).
   - Add
     `export async function getIndexLists(lang: string, options: { section?: string } = {}): Promise<Fetched<{ guides: SanityArticleCard[]; news: SanityArticleCard[] }>>`
     with `const code = safeLang(lang)`, the same `filter` and `$section` parameter as `getArticles`, `newsLimit = options.section ? SECTION_LIMIT : FEED_LIMIT`, ONE query through `fetchOrDegrade` with fallback `{ guides: [], news: [] }`:
     `{ "guides": *[${filter} && ${GUIDE_PREDICATE}] | order(pubDate desc) [0...${GUIDES_LIMIT}] { ${cardProjection(code)} }, "news": *[${filter} && ${NEWS_PREDICATE}] | order(pubDate desc) [0...${newsLimit}] { ${cardProjection(code)} } }`.
2. `src/i18n/ui.ts`: add `index: { guides: string; news: string }` to `Translation` and to all seven locales: ru `Разборы` / `Новости`; en `Guides` / `News`; es `Guías` / `Noticias`; pt `Guias` / `Notícias`; de `Ratgeber` / `Nachrichten`; fr `Guides` / `Actualités`; br `Guias` / `Notícias`.
3. `src/pages/[lang]/index.astro`: import `isIndexable` from `../../i18n/languages` and `getIndexLists` instead of `getArticles`. `const [sectionsResult, listsResult] = await Promise.all([getSections(), getIndexLists(lang)])`. `const visible = (a) => !isBlockedInCountry(a.blockedIn, country) && (!isIndexable(lang) || a.hasTranslation !== false)`; `guides` and `news` are the two lists filtered with it. `dataFailed = sectionsResult.failed || listsResult.failed`; `if (listsResult.failed) markContentUnavailable(Astro.response)`. Markup after the page head, each band its own `<section class="section"><div class="container">…</div></section>`, no inline styles:
   - a first band only when `dataFailed` (the existing error notice) or when both lists are empty and nothing failed (the existing `<p class="section-sub">—</p>`);
   - guides band when `guides.length > 0`: `<h2 class="nf-sections-title">{t.index.guides}</h2><div class="idx">{guides.map((article) => <ArticleCard lang={lang} article={article} />)}</div>`;
   - news band when `news.length > 0`: the same with `t.index.news`;
   - the existing tools band, unchanged.
   Rewrite the comment that describes a single chronological list of explainers.
4. `src/pages/[lang]/[section]/index.astro`: the same with `getIndexLists(lang, { section: sectionId })`; guides band, news band, then the existing tools band and hub text. `if (listsResult.failed) markContentUnavailable(Astro.response)` replaces the `articlesResult` check; the section-not-found and `sectionsResult.failed` logic stays as is. A hub with no news (poker-table-games today) renders the guides band only.

Edge cases: the five noindex locales keep fallback cards (the guard applies only when `isIndexable(lang)`); geo-blocked items are removed from both lists before rendering; a 503 is never stored by the edge cache, a 200 is, so a failed lists query must always end in `markContentUnavailable`.

Acceptance:
- `npx astro check` passes.
- `curl -s $B/en/ | grep -o 'href="/en/articles/[^"]*' | sort -u | wc -l` prints 33; for `/es/` 32.
- The first nine article links of `curl -s $B/en/ | grep -o 'href="/en/articles/[^"]*' | head -9` are the guide slugs (bankroll-management, blackjack-basic-strategy, esports-betting-basics, football-betting-basics, how-to-choose-casino, how-to-develop-igaming-slots, lottery-formats-overview, poker-formats-guide, wagering-explained, in any order).
- `curl -s $B/es/casino-slots/ | grep -c 'how-to-develop-igaming-slots'` prints 0 (until the article is translated); `curl -s $B/ru/casino-slots/ | grep -c 'how-to-develop-igaming-slots'` is at least 1.
- `curl -s $B/es/casino-slots/ | perl -CSD -ne 'print if /\p{Cyrillic}{3,}/' | wc -l` prints 0.
- The first three article links on `$B/en/casino-slots/` are the three casino guides.

## S1. Hub texts into the four section documents (owner, Sanity Studio, no deploy)

Findings: 2, 18 (hub part).

1. Open `docs/content-drafts/hubs/*.en.md` (four files). Resolve the one VERIFY marker in `casino-slots.en.md` and the one in `sports-betting.en.md`; delete the `<!-- OWNER NOTES -->` comments; check that every internal link resolves.
2. Paste each text into `body_en` of the matching `section` document (casino-slots, sports-betting, poker-table-games, lottery-esports). If `body_en` is not visible in Studio: `cd studio && npm run deploy` first.
3. Translate the same four texts into Spanish (Spain Spanish readable in Latin America, «tú», internal links with `/es/`) and paste into `body_es`.
4. Do NOT paste the Russian drafts into `body_ru` before `body_es` is filled: the projection falls back to `body_ru`, so the indexable `/es/` hubs would show Russian text under a «translation missing» notice.
5. Request indexing for the eight hub URLs (O2).

Acceptance: `curl -s https://ve7as.com/en/casino-slots/ | grep -c hub-text` prints 1 within 5 minutes of publishing, the same for the other three hubs and for `/es/` after step 3; no `/es/` hub contains Cyrillic.

## S2. Rewrite the priority explainers; rollover in the es wagering article (owner, Sanity Studio, no deploy)

Findings: 18, 40, 29 (Sanity part), 23 (Sanity part).

1. Order: wagering-explained, blackjack-basic-strategy, football-betting-basics, lottery-formats-overview. The other five only after these show whether it pays.
2. wagering-explained, en: take `docs/content-drafts/articles/wagering-explained.en.md`, confirm or edit its 6 VERIFY markers, delete OWNER NOTES, replace `{{TOOL: wagering-calculator}}` with `[wagering calculator](/en/tools/wagering-calculator/)`, paste into `body_en`. Translate into `body_es` with the link `/es/tools/wagering-calculator/`.
3. wagering-explained, es wording: `title_es` = `Qué es el rollover (requisito de apuesta) y cómo se calcula`; first sentence of `body_es` = `El rollover o requisito de apuesta (en inglés, wagering requirement) es una condición…`; `description_es` = `Qué significa un requisito de apuesta (rollover) «x30» en las condiciones de un bono, cómo se calcula y cómo reconocer condiciones desfavorables.`
4. For each article, in `body_en` and `body_es` (leave `body_ru` and the other locales alone):
   - `description_*` states the answer itself in at most 155 characters (it is the meta description and the visible lede), not «We explain…».
   - The first body sentence is the one-sentence definition.
   - One Markdown table whose numbers match the site's own calculator. wagering-explained: Multiplier | Turnover on a 100 bonus | Expected cost at 96 % RTP; rows x20 2,000 / 80, x30 3,000 / 120, x35 3,500 / 140, x40 4,000 / 160. blackjack-basic-strategy: the hard-totals chart with the rule set and its source named in the caption sentence. football-betting-basics: one 1X2 line with decimal odds, implied probabilities and the margin by (S − 1) / S, plus one in-body link to `/en/tools/margin-calculator/` (`/es/…` in `body_es`). lottery-formats-overview: format | jackpot odds | share of sales returned as prizes, only rows backed by the operator's own page.
   - Every figure names its primary source in the sentence, with a date and a Markdown link; a figure without one is left out. Three to five links to related articles. No promise of winnings. No word-count target: stop when the definition, the worked example, the table and the sources are there.
5. Paste the three ready Spanish titles from `docs/seo/meta-fixes-sanity-2026-08-27.md` (esports-betting-basics, poker-formats-guide, lottery-formats-overview).
6. On every edited document set `readingTime` = max(1, round(words / 200)).
7. A person checks every number against its source before pasting (the public editorial policy promises that). Make all changes to one article in one sitting: `dateModified`, the «Updated» line and sitemap `lastmod` move to the edit date.
8. Request indexing for each edited URL (O2).

Acceptance: for each rewritten slug, `curl -s https://ve7as.com/en/articles/<slug>/ | grep -c '<table'` is at least 1 and the page has at least three external source links inside `.prose`; `curl -s https://ve7as.com/es/articles/wagering-explained/ | grep -ci rollover` is at least 3 and the `<title>` contains `rollover`.

## C2. Odds converter: conversion table, formulas, Q&As; shared `src/lib/odds.ts`

Findings: 15, 19, 39 (table part). Files: new `src/lib/odds.ts`, `src/pages/[lang]/tools/odds-converter.astro`, `src/data/tools.ts`. Depends on L1.

1. New `src/lib/odds.ts`: move from the page's client script, unchanged in behaviour, and export `LADDER`, `sternBrocot`, `toFraction`, `fromAmerican`, `fromFractional`, plus `export function toAmerican(d: number): number` (`d >= 2 ? Math.round((d - 1) * 100) : -Math.round(100 / (d - 1))`, the expression now inline in `render`). The page imports them in the frontmatter and in the client `<script>` (the blackjack page already imports a TS module from its script).
2. Copy type: `tableTitle?`, `tableCols?: [string, string, string, string]`, `formulasTitle?`, `formulas?: string[]`, `faqTitle?`, `faq?: { q: string; a: string }[]`; en and es only.
3. Frontmatter builds the rows from ladder fractions, never from typed decimals: `[[1,5],[1,2],[10,11],[1,1],[6,4],[2,1],[3,1],[4,1],[10,1]]`; `d = 1 + p / q`; decimal printed as `String(Math.round(d * 1000) / 1000)`; American `toAmerican(d)` with an explicit `+` or `−` (U+2212); fraction `${p}/${q}`; implied `(100 / d).toFixed(2)`. For es replace the decimal point with a comma in the decimal and implied columns and print the percent as `83,33 %`; en prints `83.33%`.
   Expected en rows: 1.2 | −500 | 1/5 | 83.33%; 1.5 | −200 | 1/2 | 66.67%; 1.909 | −110 | 10/11 | 52.38%; 2 | +100 | 1/1 | 50.00%; 2.5 | +150 | 6/4 | 40.00%; 3 | +200 | 2/1 | 33.33%; 4 | +300 | 3/1 | 25.00%; 5 | +400 | 4/1 | 20.00%; 11 | +1000 | 10/1 | 9.09%.
4. Render after `<p class="notice">{c.disclaimer}</p>`, before `<ResponsibleGaming>`, only when the fields exist: `<div class="prose">` with `<h2>{c.tableTitle}</h2>`, a plain `<table>` (thead from `tableCols`, tbody from the rows; existing `.prose table` styles), `<h2>{c.formulasTitle}</h2><ul>` of `formulas`, `<h2>{c.faqTitle}</h2>` and `<h3>{q}</h3><p>{a}</p>` per item. No new CSS.

en: `tableTitle` `Odds conversion table`; `tableCols` `Decimal`, `American`, `Fractional`, `Implied probability`; `formulasTitle` `Conversion formulas`; `formulas`:
- `American to decimal: positive odds ÷ 100 + 1 (+150 → 2.50); negative odds: 100 ÷ |odds| + 1 (−200 → 1.50).`
- `Decimal to American: (decimal − 1) × 100 when the decimal is 2.00 or more; −100 ÷ (decimal − 1) when it is below 2.00.`
- `Fractional to decimal: numerator ÷ denominator + 1 (5/2 → 3.50).`
- `Odds to implied probability: 1 ÷ decimal odds (2.50 → 40%).`

en `faqTitle` `Questions`; `faq`:
1. `How do I convert American odds to decimal?` / `For plus odds divide by 100 and add 1: +150 is 2.50. For minus odds divide 100 by the number and add 1: −110 is 1.909.`
2. `What does +150 mean?` / `A 100 stake wins 150 in profit. That is 2.50 in decimal, 6/4 in fractional (bookmakers write 3/2 as 6/4) and an implied probability of 40%.`
3. `Is implied probability the real chance of winning?` / `No. It is the price the bookmaker set and it includes the margin: the implied probabilities of all outcomes in a market add up to more than 100%.`
4. `Why does the fraction sometimes show "≈"?` / `Bookmakers quote fractional odds from a traditional ladder (10/11, 15/8, 85/40...). The converter picks the nearest step and marks it with "≈" when it is not exactly equal to the decimal price.`

es: `tableTitle` `Tabla de conversión de cuotas`; `tableCols` `Decimal`, `Americano (momio)`, `Fraccionario`, `Probabilidad implícita`; `formulasTitle` `Fórmulas de conversión`; `formulas`:
- `De americana a decimal: cuota positiva ÷ 100 + 1 (+150 → 2,50); cuota negativa: 100 ÷ |cuota| + 1 (−200 → 1,50).`
- `De decimal a americana: (decimal − 1) × 100 si la decimal es 2,00 o más; −100 ÷ (decimal − 1) si es menor que 2,00.`
- `De fraccionaria a decimal: numerador ÷ denominador + 1 (5/2 → 3,50).`
- `De cuota a probabilidad implícita: 1 ÷ cuota decimal (2,50 → 40 %).`

es `faqTitle` `Preguntas frecuentes`; `faq`:
1. `¿Cómo se convierte una cuota americana (momio) a decimal?` / `Si es positiva, divide entre 100 y suma 1: +150 es 2,50. Si es negativa, divide 100 entre el número y suma 1: −110 es 1,909.`
2. `¿Qué significa un momio de +150?` / `Que una apuesta de 100 gana 150 de beneficio. Equivale a 2,50 en decimal, 6/4 en fraccionaria (las casas escriben 3/2 como 6/4) y una probabilidad implícita del 40 %.`
3. `¿La probabilidad implícita es la probabilidad real?` / `No. Es el precio fijado por la casa e incluye su margen: las probabilidades implícitas de todos los resultados de un mercado suman más del 100 %.`
4. `¿Por qué a veces la fracción lleva «≈»?` / `Las casas publican las cuotas fraccionarias con una escala tradicional (10/11, 15/8, 85/40...). El conversor elige el escalón más cercano y lo marca con «≈» cuando no coincide exactamente con la cuota decimal.`

Acceptance: `curl -s $B/en/tools/odds-converter/ | grep -c '<table'` prints 1 and the HTML contains `10/11`, `6/4`, `52.38%` and no `3/2`; `curl -s $B/es/tools/odds-converter/ | grep -c '52,38 %'` prints 1; in a browser, typing 2.5 in the decimal field still yields +150 and 6/4 (the script uses the shared module); `curl -s $B/fr/tools/odds-converter/ | grep -c '<table'` prints 0; `npx astro check` passes.

## C3. Margin calculator: overround row, explainer, examples, Q&As

Findings: 14 (part A), 19, 39. Files: `src/pages/[lang]/tools/margin-calculator.astro`, `src/data/tools.ts`. Depends on L1.

1. New results row ABOVE the existing margin row: `<div class="calc-row"><span class="calc-label">{c.overround}</span><span class="calc-value" id="mc-overround">—</span><small>{c.overroundHint}</small></div>`. Client script: `out('mc-overround').textContent = \`${((S - 1) * 100).toFixed(2)} %\``; add `mc-overround` to the reset branch that writes dashes.
2. Copy type gets required `overround`, `overroundHint` for all seven locales: en `Overround (vig)` / `How far the implied probabilities exceed 100%.`; es `Overround (vig)` / `Cuánto superan el 100 % las probabilidades implícitas.`; ru `Оверраунд` / `На сколько сумма подразумеваемых вероятностей превышает 100 %.`; pt and br `Overround (vig)` / `Quanto as probabilidades implícitas ultrapassam 100 %.`; de `Overround (Vig)` / `Um wie viel die impliziten Wahrscheinlichkeiten 100 % übersteigen.`; fr `Overround (vig)` / `De combien les probabilités implicites dépassent 100 %.`
3. en `margin` becomes `Margin (theoretical hold)`. The es label stays `Margen de la casa de apuestas` (L1).
4. Optional fields `explainer?`, `examplesTitle?`, `examples?: string[]`, `faqTitle?`, `faq?` for en and es, rendered in `<div class="prose">` after `<p class="notice">`, before `<ResponsibleGaming>`: `<h2>` + `<p>` for the explainer, `<h2>{examplesTitle}</h2>` + one `<p>` per example, `<h2>{faqTitle}</h2>` + `<h3>`/`<p>` per Q&A.

en explainer: `How bookmaker margin is calculated` / `Convert each price to an implied probability (1 ÷ decimal odds) and add them up. A fair market sums to 100%; the excess is the overround, also called vig or juice. Margin, or theoretical hold, is the overround as a share of the total: (S − 1) ÷ S. Fair no-vig odds are each price multiplied by S.`
en `examplesTitle` `Worked examples`; `examples`:
- `Two-way market at −110 / −110 (decimal 1.909 each): 52.38% + 52.38% = 104.76%. Overround 4.76%, margin 4.55%, fair odds 2.00 / 2.00 (+100 / +100).`
- `Three-way football market at 2.10 / 3.40 / 3.60: 47.62% + 29.41% + 27.78% = 104.81%. Overround 4.81%, margin 4.59%, fair odds 2.201 / 3.563 / 3.773.`
en `faqTitle` `Questions`; `faq`:
1. `What is the difference between margin, overround, vig and hold?` / `Overround (vig, juice) is how far the implied probabilities exceed 100%: S − 1. Margin, or theoretical hold, is the share of all stakes the book keeps when its action is balanced: (S − 1) ÷ S. For −110 / −110 they are 4.76% and 4.55%.`
2. `What are no-vig odds?` / `The prices left after the margin is removed so that the probabilities sum to exactly 100%. They estimate the bookmaker’s own view of the fair price; they are not a guaranteed true probability.`
3. `Which method does the calculator use?` / `Proportional (multiplicative) normalisation: every probability is divided by the same total. Other models (Shin, power, additive) spread the margin differently and give different fair odds on longshots.`

es explainer: `Cómo se calcula el margen de una casa de apuestas` / `Convierte cada cuota en probabilidad implícita (1 ÷ cuota decimal) y súmalas. Un mercado justo suma el 100 %; el exceso es el overround, también llamado vig o juice. El margen es ese exceso como parte del total: (S − 1) ÷ S. Las cuotas justas sin margen son cada cuota multiplicada por S.`
es `examplesTitle` `Ejemplos`; `examples`:
- `Mercado de dos resultados a 1,909 / 1,909 (−110 / −110 en formato americano): 52,38 % + 52,38 % = 104,76 %. Overround 4,76 %, margen 4,55 %, cuotas justas 2,00 / 2,00.`
- `Mercado 1X2 a 2,10 / 3,40 / 3,60: 47,62 % + 29,41 % + 27,78 % = 104,81 %. Overround 4,81 %, margen 4,59 %, cuotas justas 2,201 / 3,563 / 3,773.`
es `faqTitle` `Preguntas frecuentes`; `faq`:
1. `¿Qué diferencia hay entre margen y overround?` / `El overround es cuánto superan el 100 % las probabilidades implícitas: S − 1. El margen es la parte de todo lo apostado que retiene la casa cuando el dinero está equilibrado: (S − 1) ÷ S. Para 1,909 / 1,909 son 4,76 % y 4,55 %.`
2. `¿Qué son las cuotas justas o sin margen (no-vig)?` / `Las cuotas que quedan al quitar el margen para que las probabilidades sumen exactamente el 100 %. Son una estimación del precio justo según la propia casa, no una probabilidad real garantizada.`
3. `¿Qué método usa la calculadora?` / `Normalización proporcional: todas las probabilidades se dividen por el mismo total. Otros modelos (Shin, potencia, aditivo) reparten el margen de otra forma y dan cuotas justas distintas en los resultados poco probables.`

Keep the lede and description wording «decimal odds»; they change only in C11.

Acceptance: `curl -s $B/en/tools/margin-calculator/ | grep -c 'id="mc-overround"'` prints 1 and the page contains `104.81%`; the es page contains `104,81 %`; in a browser the defaults 1.90 / 1.90 show overround 5.26 %, margin 5.00 %, fair odds 2.000 · 2.000; `npx astro check` passes.

## L3. Lottery calculator: worked example, method, Q&As (en/es)

Findings: 16, 19, 39. Files: `src/pages/[lang]/tools/lottery-expected-value.astro`, `src/data/tools.ts`. Depends on L1.

Add to `Copy` (both blocks, en and es): `exampleTitle`, `example`, `howTitle`, `how`, `faqTitle`, `faq: { q: string; a: string }[]`. Render inside `<div class="prose">` placed after the tier table's `.calc-table-wrap` and before `<p class="calc-note">{c.noStrategies}</p>`: `<h2>{c.exampleTitle}</h2><p>{c.example}</p><p>{c.breakEvenCaveat}</p><h2>{c.howTitle}</h2><p>{c.how}</p><h2>{c.faqTitle}</h2>` then `<h3>`/`<p>` per Q&A. The existing string `breakEvenCaveat` is printed right after the example on purpose: the tool spec says the break-even figure never appears without its caveat. The example equals the form defaults (500,000,000 advertised, 230,000,000 cash, 25,000,000 tickets, 37 %, threshold 5,000, price 2); the numbers are the gate's acceptance scenario.

en:
- `exampleTitle`: `Worked example: a $500 million Powerball draw`
- `example`: `Advertised jackpot $500M, cash value $230M, 25 million tickets sold, 37% federal withholding assumed on prizes of $5,000 or more, ticket $2. The chance of sharing the jackpot cuts its value by about 4%; after tax the jackpot is worth $0.475 per ticket and the lower tiers add about $0.27. Expected payout: $0.74. The ticket really costs $1.26, or 63% of its price. Under these assumptions the draw would break even only at an advertised jackpot of about $1.82 billion.`
- `howTitle`: `How lottery expected value is calculated`
- `how`: `For each prize tier, multiply the prize (after tax, and for the jackpot after the cash-value discount and the expected split) by the probability of winning it; add the tiers up and subtract the ticket price. A negative result is the average loss per ticket.`
- `faqTitle`: `Questions`; `faq`:
  1. `Is a lottery ticket ever worth it mathematically?` / `Almost never. A positive expected value needs a very large jackpot and few tickets sold at the same time; in practice large jackpots drive sales up and the higher chance of splitting removes the edge. And an average over hundreds of millions of tickets says nothing about one ticket.`
  2. `Why use the cash value instead of the advertised jackpot?` / `For US games the advertised figure is a 30-year annuity. The lump sum actually paid is published for every draw; this calculator defaults to 46% of the advertised amount. EuroMillions pays the advertised amount in cash.`
  3. `Does choosing different numbers change the expected value?` / `No. Every combination has the same probability; the choice only changes how many people you would share a prize with.`

es:
- `exampleTitle`: `Ejemplo: un sorteo de Powerball con bote de 500 millones`
- `example`: `Bote anunciado de 500 millones de dólares, pago en efectivo de 230 millones, 25 millones de boletos vendidos, se supone una retención del 37 % en premios desde 5.000 $, boleto de 2 $. La probabilidad de compartir el bote reduce su valor alrededor de un 4 %; después de impuestos el bote aporta 0,475 $ por boleto y las categorías inferiores unos 0,27 $. Pago esperado: 0,74 $. El boleto cuesta de verdad 1,26 $, el 63 % de su precio. Con estos supuestos el sorteo solo quedaría a la par con un bote anunciado de unos 1.820 millones de dólares.`
- `howTitle`: `Cómo se calcula el valor esperado (esperanza matemática) de la lotería`
- `how`: `Para cada categoría de premio se multiplica el premio (neto de impuestos y, en el bote, tras el descuento del pago en efectivo y el reparto esperado) por la probabilidad de acertarla; se suman todas las categorías y se resta el precio del boleto. Un resultado negativo es la pérdida media por boleto.`
- `faqTitle`: `Preguntas frecuentes`; `faq`:
  1. `¿Merece la pena jugar a la lotería desde el punto de vista matemático?` / `Casi nunca. Un valor esperado positivo exige a la vez un bote muy grande y pocos boletos vendidos; en la práctica los botes grandes disparan las ventas y la mayor probabilidad de reparto elimina la ventaja. Y una media sobre cientos de millones de boletos no dice nada de un boleto concreto.`
  2. `¿Por qué se usa el pago en efectivo y no el bote anunciado?` / `En los juegos de EE. UU. la cifra anunciada es una anualidad a 30 años. El pago único real se publica en cada sorteo; la calculadora usa por defecto el 46 % del bote anunciado. Euromillones paga en efectivo la cifra anunciada.`
  3. `¿Elegir otros números cambia el valor esperado?` / `No. Todas las combinaciones tienen la misma probabilidad; la elección solo cambia con cuánta gente compartirías el premio.`

Acceptance: `node scripts/verify-lottery-data.mjs` passes; `curl -s $B/en/tools/lottery-expected-value/ | grep -c '1.82 billion'` prints 1; `curl -s $B/es/tools/lottery-expected-value/ | grep -c 'esperanza matemática'` is at least 2 and `grep -c '¿Merece la pena'` prints 1; in a browser the default state shows the same $1.26 and the same break-even order of magnitude as the example; `npx astro check` passes.

## L4. Spanish UI copy: «juegos de azar y apuestas», hub ledes, skip link, tú register

Findings: 30, 31 (B and register outside tools), 36 (parts 1 and 2). Files: `src/i18n/ui.ts`, `src/content/translations/pages/es/about.md`, `src/layouts/BaseLayout.astro`, `src/pages/[lang]/[section]/index.astro`, `src/pages/[lang]/articles/[slug].astro`, `src/pages/[lang]/authors/[slug].astro`.

1. `src/i18n/ui.ts`, es block:
   - `site.tagline`: `Guía independiente de juegos de azar y apuestas`
   - `hero.title`: `Una guía de juegos de azar y apuestas, sin rankings ni publicidad`
   - `footer.about`: `Portal informativo independiente sobre juegos de azar y apuestas. No somos un operador de juego.`
   - `sectionDescriptions['casino-slots']`: `Cómo funcionan las tragaperras (tragamonedas o slots): RTP, volatilidad, proveedores y cómo elegir plataformas fiables. Sin rankings ni publicidad de operadores.`
   - `sectionDescriptions['sports-betting']`: `Tipos de apuestas, cómo fijan las cuotas las casas de apuestas, gestión del bankroll y estrategias: explicamos cómo funcionan las apuestas deportivas por dentro.`
   - `sectionDescriptions['lottery-esports']`: `Formatos de lotería y sorteos, y las apuestas en torneos de esports, un terreno todavía reciente. Analizamos cómo funcionan y en qué se diferencian.`
2. `src/i18n/ui.ts`, type and all seven locales: add `skip: string; breadcrumb: string;` to `nav`: ru `Перейти к содержимому` / `Навигационная цепочка`; en `Skip to content` / `Breadcrumb`; es `Saltar al contenido` / `Ruta de navegación`; pt `Saltar para o conteúdo` / `Navegação estrutural`; de `Zum Inhalt springen` / `Brotkrumennavigation`; fr `Aller au contenu` / `Fil d’Ariane`; br `Pular para o conteúdo` / `Navegação estrutural`.
3. `src/layouts/BaseLayout.astro`: the skip link text becomes `{t.nav.skip}`. In `[section]/index.astro`, `articles/[slug].astro`, `authors/[slug].astro`: `aria-label="Breadcrumb"` becomes `aria-label={t.nav.breadcrumb}`.
4. `src/content/translations/pages/es/about.md`: front-matter `description` becomes `"Ve7as es un portal independiente sobre juegos de azar y apuestas: explicaciones claras de la matemática del juego, sin publicidad de operadores."`; in the first paragraph `sobre el\nentretenimiento de azar.` becomes `sobre juegos de azar y apuestas.`; set `updated` to the commit date.
5. `src/pages/[lang]/articles/[slug].astro`, `RELATED_TOOL` es labels: `Convierte las cuotas: conversor de formatos`; `Lo que realmente cuesta un boleto: calculadora de valor esperado` (unchanged); `Calcula la ventaja de tu mesa: calculadora de la ventaja de la casa`; `Calcula tu bono: calculadora de rollover`.

Acceptance: `grep -rn 'entretenimiento de azar' src` returns nothing; `curl -s $B/es/ | grep -o '<title>[^<]*'` prints `<title>Ve7as — Guía independiente de juegos de azar y apuestas`; `curl -s $B/es/ | grep -c 'Skip to content'` prints 0 and `grep -c 'Saltar al contenido'` prints 1; `curl -s $B/es/sports-betting/ | grep -c 'betting'` counts only URLs and class names, no prose; `npx astro check` passes (it fails until all seven locales have both new keys).

## C4. Byline: «Ve7as editorial team» for house articles, Organization as author

Findings: 3, 20, 26, 41. Files: `src/lib/schema.ts`, `src/pages/[lang]/articles/[slug].astro`, `src/i18n/ui.ts`, `studio/schemaTypes/article.js`.

1. `src/i18n/ui.ts`: add `editorialTeam: string` to `Translation['article']` (next to `author`) and all seven locales: ru `Редакция Ve7as`; en `Ve7as editorial team`; es `Redacción de Ve7as`; pt `Redação do Ve7as`; de `Ve7as-Redaktion`; fr `Rédaction de Ve7as`; br `Redação do Ve7as`.
2. `src/pages/[lang]/articles/[slug].astro`:
   `const HOUSE = new Set(['', 'редакция', 've7as']);`
   `const rawAuthor = (article?.author ?? '').trim();`
   `const isHouse = !!article && !article.authorSlug && HOUSE.has(rawAuthor.toLowerCase());`
   `const byline = isHouse ? (article.aiDisclosure ? 'Ve7as' : t.article.editorialTeam) : rawAuthor;`
   Visible byline: with `authorSlug` the existing link, otherwise `{byline}`. Pass `authorName: byline, authorIsOrganization: isHouse` to `articleSchema`. Pipeline items stay exactly `Ve7as` (the byline must not claim an editorial team read an item whose notice says it was published automatically). `Tarnel` stays a Person.
3. `src/lib/schema.ts`: add `authorIsOrganization?: boolean` to `ArticleInput`; in `article()` emit `author: { '@id': abs(site, ORG_ID) }` when it is true (the node `publisher` already references), otherwise the two existing Person branches unchanged. Never key this on «authorUrl is undefined». Still one `@graph` through `jsonLd()`.
4. `studio/schemaTypes/article.js`: `initialValue: 'редакция'` of the `author` field becomes `initialValue: 'Ve7as'`. The owner redeploys Studio afterwards (`cd studio && npm run deploy`, see S3). No Sanity document is edited: the eight stored «редакция» strings are mapped by the template, so `dateModified` and sitemap `lastmod` do not move.

Acceptance: `curl -s $B/en/articles/blackjack-basic-strategy/ | grep -c 'редакция'` prints 0 and the page shows `Author: Ve7as editorial team`; its JSON-LD Article node has `"author":{"@id":"https://ve7as.com/#organization"}` (for a local preview the origin is whatever `Astro.site` resolves to); `curl -s $B/en/articles/dutch-cruks-register-maintenance-november-2026/ | grep -c 'Author: Ve7as<'` prints 1 with the same `@id` author; `curl -s $B/en/articles/how-to-develop-igaming-slots/` still has a Person named Tarnel; validator.schema.org reports no errors; `npx astro check` passes.

## C5. Related guides and news under every article

Findings: 8. Files: `src/lib/sanity.ts`, `src/pages/[lang]/articles/[slug].astro`, `src/i18n/ui.ts`, `src/styles/global.css`. Depends on C1.

1. `src/lib/sanity.ts`, inside the single query of `getArticleBySlug`, two flat keys (so `^` is the article):
   `"relatedGuides": *[_type == "article" && _id != ^._id && ${GUIDE_PREDICATE}${translated}] | order(pubDate desc) [0...${GUIDES_LIMIT}] { "id": slug.current, "section": section->slug.current, blockedIn, ${localized('title', code)} }`
   `"relatedNews": *[_type == "article" && _id != ^._id && section._ref == ^.section._ref && ${NEWS_PREDICATE}${translated}] | order(pubDate desc) [0...3] { "id": slug.current, blockedIn, ${localized('title', code)} }`
   where `translated` is `''` unless `isIndexable(code)`, and then `` ` && defined(title_${code}) && title_${code} != "" && defined(body_${code}) && body_${code} != ""` ``, built only from the value returned by `safeLang()`. Types: `export type RelatedLink = { id: string; title: string; section?: string; blockedIn?: string[] }`; `SanityArticleFull` gets `relatedGuides?: RelatedLink[]; relatedNews?: RelatedLink[]`.
2. `src/pages/[lang]/articles/[slug].astro`: `guides` = `relatedGuides` without geo-blocked items, stable-sorted so items with `section === article.section` come first, cut to 5 (NOT limited to the article's section: three hubs hold two guides each). `news` = `relatedNews` without geo-blocked items. After `<ResponsibleGaming lang={lang} />`, before `.prose-foot`, when either list is non-empty:
   `<nav class="related">` and, per non-empty list, `<h2 class="nf-sections-title">{t.article.relatedGuides | t.article.relatedNews}</h2><ul>{items.map((item) => <li><a href={path(lang, 'articles', item.id)}>{item.title}</a></li>)}</ul>`. Title text as the anchor, plain interpolation, nothing added to JSON-LD.
3. `src/i18n/ui.ts`, `article`: `relatedGuides`: ru `Разборы по теме`, en `Guides on this topic`, es `Guías sobre este tema`, pt `Guias sobre este tema`, de `Ratgeber zum Thema`, fr `Guides sur ce sujet`, br `Guias sobre este tema`. `relatedNews`: ru `Ещё новости раздела`, en `More news in this section`, es `Más noticias de esta sección`, pt `Mais notícias desta secção`, de `Weitere Nachrichten der Rubrik`, fr `Autres actualités de la rubrique`, br `Mais notícias desta seção`.
4. `src/styles/global.css`, block «Проза», existing tokens only:
   ```css
   /* Блок «по теме» под материалом: разборы и свежие новости рубрики. */
   .related { max-width: var(--measure); margin-top: var(--s-6); padding-top: var(--s-4); border-top: 1px solid var(--rule); }
   .related ul { list-style: none; padding: 0; margin: 0 0 var(--s-5); }
   .related li { padding: var(--s-2) 0; border-bottom: 1px solid var(--rule); }
   .related a { color: var(--ink); text-decoration: none; }
   .related a:hover { color: var(--mark); }
   ```

Acceptance: `curl -s $B/en/articles/how-to-choose-casino/ | grep -o 'href="/en/articles/[^"]*' | sort -u | wc -l` is at least 6 (5 guides plus news); the same for `/es/articles/wagering-explained/` shows 5 translated guides and no `how-to-develop-igaming-slots`; a news page has up to 5 guide links and up to 3 news links; `curl -s $B/ru/articles/wagering-explained/` renders without error; `npx astro check` passes.

## C6. Blackjack calculator: rule-impact table from the data file, 6:5 example

Findings: 13, 19, 39. Files: `src/pages/[lang]/tools/blackjack-house-edge.astro`, `src/data/tools.ts`. Depends on L1.

Framing rule: these numbers are NOT original data (rule effects come from the Wizard of Odds calculator; only the 6:5 term is an own closed-form calculation). Do not call the table unique or original anywhere.

1. Frontmatter: import `BJ_BASE_EDGE`, `BJ_DELTAS` next to `BJ_MODEL_TOLERANCE`. `const sign = (v: number) => (v > 0 ? '+' : '−') + Math.abs(v).toFixed(2)`; for es replace `.` with `,` in every printed number. No number below is typed by hand.
2. Rows in this order (data key, en label, es label):
   - `pay65[8]` | `Blackjack pays 6:5 instead of 3:2` | `El blackjack paga 6:5 en vez de 3:2`
   - `h17` | `Dealer hits soft 17 (H17)` | `El crupier pide con 17 blando (H17)`
   - `double['10-11']` | `Double on 10–11 only` | `Doblar solo con 10–11`
   - `noDas` | `No double after split` | `Sin doblar tras dividir`
   - `enhcFullLoss` | `European no hole card, all bets lost` | `Regla europea sin carta tapada, se pierde todo`
   - `double['9-11']` | `Double on 9–11 only` | `Doblar solo con 9–11`
   - `resplit[2]` | `Split to 2 hands only` | `Dividir solo hasta 2 manos`
   - `decks[6]` | `6 decks instead of 8` | `6 barajas en vez de 8`
   - `rsa` | `Resplit aces` | `Volver a dividir ases`
   - `lateSurrender` | `Late surrender` | `Rendición tardía`
   - `hsa` | `Hit split aces` | `Pedir carta tras dividir ases`
   - `decks[2]` | `2 decks` | `2 barajas`
   - `decks[1]` | `1 deck` | `1 baraja`
   Expected en values today: +1.36, +0.21, +0.19, +0.14, +0.11, +0.09, +0.05, −0.02, −0.07, −0.08, −0.19, −0.19, −0.48.
3. Computed for the example: `e32 = BJ_BASE_EDGE + BJ_DELTAS.decks[6] + BJ_DELTAS.h17` (0.64), `e65 = e32 + BJ_DELTAS.pay65[6]` (2.00), `base = BJ_BASE_EDGE.toFixed(2)` (0.45), `lo`/`hi` = min and max of `Object.values(BJ_DELTAS.pay65)` to two decimals (1.36, 1.39).
4. Render in `<div class="prose">` after `<p class="calc-article-link">`, before `<ResponsibleGaming>`, en and es only (other locales render nothing): H2, intro, table (two columns, existing `.prose table` styles), source line, H2 example, H2 questions with `<h3>`/`<p>`.

en:
- H2 `How much each rule changes the house edge`; intro `Baseline: 8 decks, dealer stands on soft 17, double on any two cards, double after split, split to 4 hands, blackjack pays 3:2. House edge {base}%. Each row changes one rule.`; columns `Rule` | `Change, percentage points`.
- Source line directly under the table: `Rule effects: ` + `<a href={WOO_CALCULATOR} rel="noopener">Wizard of Odds calculator</a>` + `, captured 2026-08-27; the 6:5 row is our own closed-form calculation.`
- H2 `Worked example: what 6:5 costs`; text `Six decks, dealer hits soft 17, double after split, blackjack pays 3:2: house edge {e32}%. The same table paying 6:5: {e65}%. Per 100 hands of one unit each that is {e32} units against {e65} units on average, about three times as much.`
- H2 `Questions`:
  1. `What is the house edge in blackjack?` / `The average share of the initial bet the casino keeps when the player follows basic strategy. With common 6–8 deck rules and a 3:2 payout it is about 0.4–0.7%; with 6:5 about 1.8–2.0%.`
  2. `Why is 6:5 blackjack worse than 3:2?` / `A natural pays 1.2 units instead of 1.5, so the player gives up 0.3 of a bet on every blackjack the dealer does not tie. That adds {lo}–{hi} percentage points to the house edge, depending on the number of decks.`
  3. `Does a lower house edge mean I can win?` / `No. Every real rule set is negative for the player; a lower edge only means a smaller average loss per hand.`
  4. `How accurate is the calculator?` / `It adds up rule effects measured on the Wizard of Odds calculator on 2026-08-27. On the combined rule sets we checked the sum stayed within {BJ_MODEL_TOLERANCE} percentage points of the exact figure. The 6:5 penalty is our own closed-form calculation.`

es:
- H2 `Cuánto cambia la ventaja de la casa cada regla`; intro `Base: 8 barajas (mazos), el crupier se planta con 17 blando (17 suave), doblar con dos cartas cualesquiera, doblar tras dividir, dividir hasta 4 manos, blackjack 3:2. Ventaja de la casa: {base} %. Cada fila cambia una sola regla.`; columns `Regla` | `Cambio, puntos porcentuales`.
- Source line: `Efectos de las reglas: ` + link `calculadora de Wizard of Odds` + `, capturados el 27/08/2026; la fila del 6:5 es cálculo propio.`
- H2 `Ejemplo: lo que cuesta el pago 6:5`; text `Seis barajas, el crupier pide con 17 blando, doblar tras dividir, blackjack 3:2: ventaja de la casa {e32} %. La misma mesa pagando 6:5: {e65} %. Por cada 100 manos de una unidad son {e32} unidades frente a {e65} de media, unas tres veces más.`
- H2 `Preguntas frecuentes`:
  1. `¿Qué es la ventaja de la casa en el blackjack?` / `La parte media de la apuesta inicial que se queda el casino cuando el jugador sigue la estrategia básica. Con reglas habituales de 6–8 barajas y pago 3:2 ronda el 0,4–0,7 %; con pago 6:5, el 1,8–2,0 %.`
  2. `¿Por qué el blackjack 6:5 es peor que el 3:2?` / `El blackjack natural paga 1,2 unidades en lugar de 1,5: el jugador pierde 0,3 apuestas en cada blackjack que el crupier no empata. Eso suma entre {lo} y {hi} puntos porcentuales a la ventaja de la casa, según el número de barajas.`
  3. `¿Una ventaja menor significa que se puede ganar?` / `No. Toda mesa real es negativa para el jugador; una ventaja menor solo significa una pérdida media más pequeña por mano.`
  4. `¿Qué precisión tiene la calculadora?` / `Suma los efectos de cada regla medidos en la calculadora de Wizard of Odds el 27/08/2026. En los conjuntos combinados que comprobamos, la suma se desvió como máximo {BJ_MODEL_TOLERANCE con coma} puntos porcentuales del valor exacto. La penalización del 6:5 es cálculo propio.`

Units, never money. No single-deck sentence (the model's tolerance was not measured on one deck).

Acceptance: `node scripts/verify-blackjack-data.mjs` passes; `curl -s $B/en/tools/blackjack-house-edge/ | grep -c '<table'` prints 1 and the HTML contains `+1.36`, `−0.48`, `0.64%` and `2.00%`; the es page contains `+1,36` and `2,00 %`; `grep -n '1\.36\|0\.64\|2\.00' src/pages/\[lang\]/tools/blackjack-house-edge.astro` finds no typed figure in the new block; `npx astro check` passes.

## C7. Tool pages: sibling links, three-level breadcrumb

Findings: 17, 28 (tools part). Files: new `src/components/RelatedTools.astro`, `src/data/tools.ts`, `src/pages/[lang]/tools/index.astro`, the five tool pages. Depends on L1, L4.

1. `src/data/tools.ts`: `export const TOOLS_INDEX_TITLE: Record<Language, string> = { ru: 'Инструменты', en: 'Gambling calculators', es: 'Calculadoras de apuestas y casino', pt: 'Ferramentas', de: 'Rechner', fr: 'Outils', br: 'Ferramentas' };` (the seven titles now in `COPY` of `tools/index.astro`). `tools/index.astro` drops `title` from its `Copy` and reads `TOOLS_INDEX_TITLE[lang]`; its description and lede stay untouched.
2. New `src/components/RelatedTools.astro`, props `lang: Language`, `current: string`, markup identical to the home-page tools band:
   `<section class="section"><div class="container"><h2 class="nf-sections-title">{t.footer.tools}</h2><div class="nf-sections">{TOOLS.filter((tool) => tool.id !== current).map((tool) => (<a href={path(lang, ...tool.segments)} class="nf-section"><strong>{tool.name[lang]}</strong><span class="section-sub">{tool.blurb[lang]}</span></a>))}</div></div></section>`.
   Place `<RelatedTools lang={lang} current="<tool id>" />` in each tool page after the calculator's closing `</section>`, before `</BaseLayout>`. Keep the two contextual links (margin to converter, converter to margin).
3. In each of the five tool pages: JSON-LD `breadcrumbs([{ name: t.nav.home, url: home }, { name: TOOLS_INDEX_TITLE[lang], url: new URL(path(lang, 'tools'), Astro.site).toString() }, { name: c.title, url: pageUrl.toString() }])`, and a matching visible trail above the `<h1>` inside `.page-head .container`: `<nav class="breadcrumb" aria-label={t.nav.breadcrumb}><a href={path(lang)}>{t.nav.home}</a><span class="sep">/</span><a href={path(lang, 'tools')}>{TOOLS_INDEX_TITLE[lang]}</a></nav>`.
4. No copy change on the index, no hard-coded count of tools, no `updated` bump (navigation is not a content change).

Acceptance: `curl -s $B/en/tools/wagering-calculator/ | grep -o 'href="/en/tools/[a-z-]*/"' | sort -u | wc -l` is at least 4 (the four siblings); its BreadcrumbList has three items with `Gambling calculators` second; `grep -c 'class="breadcrumb"'` prints 1; `curl -s $B/en/tools/ | grep -c '<h1>Gambling calculators</h1>'` prints 1; `npx astro check` passes.

## C8. Hubs: BreadcrumbList, descriptive title once the hub has text

Findings: 23 (hub part), 28 (hub part), 2 (optional follow-up). Files: `src/pages/[lang]/[section]/index.astro`, `src/i18n/ui.ts`. Depends on C1.

1. `[section]/index.astro`: import `breadcrumbs` from `lib/schema`; pass `schema={section ? [breadcrumbs([{ name: t.nav.home, url: new URL(path(lang), Astro.site).toString() }, { name: sectionTitle, url: new URL(path(lang, sectionId), Astro.site).toString() }])] : []}` to `BaseLayout` (nothing on the 503 branch).
2. `src/i18n/ui.ts`: optional `sectionSeoTitles?: Partial<Record<keyof Translation['sections'], string>>`, filled for en and es only:
   - en: casino-slots `Online Casino & Slots Explained: RTP, Volatility, Bonuses`; sports-betting `Sports Betting Explained: Odds, Margin and Bankroll`; poker-table-games `Poker & Table Games: Rules, House Edge, Basic Strategy`; lottery-esports `Lottery Odds and Esports Betting Explained`.
   - es: casino-slots `Casino y tragaperras: RTP, volatilidad y bonos explicados`; sports-betting `Apuestas deportivas: cuotas, margen y gestión del bankroll`; poker-table-games `Póquer y juegos de mesa: reglas y ventaja de la casa`; lottery-esports `Loterías y apuestas en esports: probabilidades explicadas`.
3. `<BaseLayout title={hubHtml && !hubIsFallback ? (t.sectionSeoTitles?.[knownId] ?? sectionTitle) : sectionTitle}>`. The descriptive title turns on by itself when S1 fills the hub body in that language; a hub without text keeps the bare section name, so the title never promises content the page lacks. H1, breadcrumb and nav labels stay on `sectionTitle`.

Acceptance: `curl -s $B/en/casino-slots/ | grep -c BreadcrumbList` prints 1; while `body_en` is empty the `<title>` is `Casino &amp; Slots — Ve7as`; after S1 it starts with `Online Casino &amp; Slots Explained`; `npx astro check` passes.

## P1. Voice guide: stop asking the model for a link to an own tool

Findings: 21 (pipeline part). Files: `docs/news/voice-guide.md` (above the `<!-- ДАЛЬШЕ ТОЛЬКО ДЛЯ ЛЮДЕЙ` marker, so the model receives it verbatim).

In the paragraph «1. Собственные данные.»:
- `Четыре работающих калькулятора.` becomes `Пять работающих калькуляторов.`
- the sentence `**в каждом материале, где тема это допускает, ровно один такой абзац со ссылкой на собственный инструмент.**` (it is wrapped over three lines) becomes `**в каждом материале, где тема это допускает, ровно один такой абзац с расчётом; ссылок в тексте не ставить и не утверждать, что расчёт воспроизводится нашим калькулятором.**`

Why: the guide asks for a link while `postcheck.mjs` rejects every link, and the one time a link got through it was an invented URL (`/calculators/house-edge/`, 404). No gate, threshold or check changes, so the editorial-policy page needs no edit. Do not relax the link check.

Acceptance: `grep -c 'со ссылкой на' docs/news/voice-guide.md` prints 0 for that paragraph; `grep -c 'Пять работающих калькуляторов' docs/news/voice-guide.md` prints 1; `node -e "import('./scripts/news/prompts.mjs').then(m => m.systemPrompt())"` does not throw (marker still present); `node scripts/news/selftest-postcheck.mjs` passes.

## P2. IndexNow: daily changed-only ping that also covers hand-published news

Findings: 10, 38. Files: `scripts/seo/indexnow.mjs`, `.github/workflows/news-daily.yml`.

Why: the ping step ran in 2 of the last 25 news runs (it is skipped when the run publishes nothing, and most news is published by hand later), and when it runs it resubmits all 147 URLs.

1. `scripts/seo/indexnow.mjs`:
   - After fetching the sitemap: if `!res.ok` or the response `Cache-Control` contains `no-store` (the sitemap sends that when Sanity is unreachable and it has shrunk to static routes), log `[indexnow] sitemap недоступен или деградировал (HTTP <status>) — пинг не отправлен` and `process.exit(0)`.
   - Parse each `<url>…</url>` block into `{ loc, lastmod }` (`lastmod` may be absent).
   - `const raw = process.env.INDEXNOW_SINCE_HOURS`. If it is set and `Number(raw)` is finite and > 0: keep only entries whose `lastmod` parses and lies within that many hours before now. If it is set but invalid: print a warning and keep the whole sitemap. If unset: whole sitemap (today's behaviour, used after a deploy).
   - If the filter leaves nothing: log `[indexnow] нет изменившихся URL — пинг не отправлен` and exit 0.
   - Keep KEY, HOST, `keyLocation`, the count-and-status log line and the «never fail the job» behaviour. Replace the stale «их 38» comment with a description of the two modes.
2. `.github/workflows/news-daily.yml`, step «Пинг IndexNow»:
   - `if: ${{ !cancelled() }}` (no longer conditional on `published`), keep `continue-on-error: true`;
   - `env: INDEXNOW_SINCE_HOURS: '30'` and `PUBLISHED: ${{ steps.deliver.outputs.published }}` on this step only;
   - `run`: `if [ -n "$PUBLISHED" ] && [ "$PUBLISHED" != "0" ]; then sleep 330; fi` then `node scripts/seo/indexnow.mjs` (330 s outlasts the 300 s edge TTL of the list pages that are now submitted by name).
3. `.github/workflows/deploy.yml` stays unchanged: a deploy changes every template, the whole-sitemap ping is the documented case for that.

Result: an article published by hand at any hour is submitted by the next daily run (within 24 hours instead of up to 6 days), together with the home and hub pages whose `lastmod` moved; nothing is sent on a day with no change. No state file, no bot commits, no new workflow.

Acceptance: `INDEXNOW_SINCE_HOURS=30 node scripts/seo/indexnow.mjs` on a day with one new article logs about 6 URLs (the article in en and es, both home pages, the hub in en and es); `INDEXNOW_SINCE_HOURS=abc node scripts/seo/indexnow.mjs` prints the warning and the full count; to test without sending, point HOST at an unreachable sitemap or run the parsing part in `node --input-type=module` against a saved `sitemap.xml`; the next scheduled news run shows the step executed, not skipped.

## S3. Small Sanity fixes (owner, Sanity Studio, no deploy)

Findings: 21 (content part), 30 and 31 (Sanity parts), 5/9/22 (translation), 27 (images), C4 follow-up.

1. Document `news-0f6ac8d4b838` (buenos-aires-online-betting-fee-bill): delete the sentence «The arithmetic can be reproduced with our house edge calculator.» from `body_en` and `body_ru` and its Spanish counterpart from `body_es`. Do not re-point the link: no tool performs that calculation.
2. `faq-about-content.answer_es`: «sobre el entretenimiento de azar» becomes «sobre juegos de azar y apuestas». `lottery-formats-overview.body_es`: «formatos de entretenimiento de azar» becomes «formatos de juegos de azar».
3. `faq-sources.question_es`: «¿En qué se basan las guías de Ve7as?». `faq-update-frequency.question_es`: «¿Con qué frecuencia se publican artículos nuevos?». `faq-safety.answer_es`: «Casinos y tragaperras» becomes «Casino y tragaperras».
4. Article `how-to-develop-igaming-slots`: it is the only guide without Spanish. It was flagged in August as needing a rewrite, so do not machine-translate it as is: either rewrite and then fill `title_es`, `description_es`, `body_es` (the page then becomes indexable, enters the sitemap and hreflang, and C1 lets its card back in automatically), or leave it; after C1 it no longer shows on indexable lists.
5. Optional: give the rewritten explainers (S2) a real topic-specific 16:9 image at least 1200 px wide in the existing `image` field.
6. After C4 is merged: `cd studio && npm run deploy` so new documents default to the author string «Ve7as».

Acceptance: `curl -s https://ve7as.com/en/articles/buenos-aires-online-betting-fee-bill/ | grep -c '/calculators/'` prints 0; `curl -s https://ve7as.com/es/faq/ | grep -c 'entretenimiento de azar'` prints 0.

## O3. Cloudflare: www redirect, Always Use HTTPS (owner, dashboard)

Findings: 25.

1. SSL/TLS, Edge Certificates: Always Use HTTPS on.
2. HSTS on with max-age 6 months, WITHOUT includeSubDomains and WITHOUT preload for now.
3. DNS: proxied record for `www` (CNAME `www` to `ve7as.com`). Do not add `www` to the Worker's routes.
4. Rules, Redirect Rules, Single Redirect: hostname equals `www.ve7as.com`, dynamic target `concat("https://ve7as.com", http.request.uri.path)`, status 301, preserve query string.

Acceptance: `curl -sI http://ve7as.com/en/` answers 301 to `https://ve7as.com/en/`; `curl -sI https://www.ve7as.com/en/tools/` answers 301 to `https://ve7as.com/en/tools/`; the deploy smoke test still passes.

## C9. Head hygiene: max-image-preview, og:type article, default share card, title suffix

Findings: 4, 23 (suffix part), 24, 27 (parts a and b). Files: `src/layouts/BaseLayout.astro`, `src/pages/[lang]/articles/[slug].astro`, new `public/og/default.png`, new `scripts/og/default-card.svg`.

1. `BaseLayout.astro`, robots: `content={noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}`.
2. New props `ogType?: 'website' | 'article'` (default `'website'`), `publishedTime?: string`, `modifiedTime?: string`. Emit `<meta property="og:type" content={ogType}>`, always `<meta property="og:site_name" content="Ve7as">` and `<meta property="og:locale" content={OG_LOCALE[lang]}>` with `const OG_LOCALE: Record<Language, string> = { ru: 'ru_RU', en: 'en_US', es: 'es_ES', pt: 'pt_PT', de: 'de_DE', fr: 'fr_FR', br: 'pt_BR' }`; when `ogType === 'article'`, `article:published_time` and `article:modified_time` if given.
3. Share image: `const shareImage = ogImage ?? (ogType === 'article' ? undefined : new URL('/og/default.png', Astro.site).toString())`. When `shareImage` exists emit `og:image`, `og:image:width` 1200, `og:image:height` 630, `twitter:card` `summary_large_image`, `twitter:image`; otherwise `twitter:card` `summary`. Article pages never get the generic card (Google asks not to use generic images in `og:image` for articles), and it never goes into `Article.image`.
4. Title: `const SUFFIX = ' — Ve7as'; const pageTitle = !currentPath ? \`Ve7as — ${title}\` : (title.length + SUFFIX.length > 60 ? title : title + SUFFIX);` (`og:title` follows).
5. `articles/[slug].astro`: pass `ogType="article" publishedTime={article.pubDate} modifiedTime={article._updatedAt}`; `ogImage` URL becomes `${article.imageUrl}?w=1200&h=630&fit=crop&fm=jpg&q=80` (without `fm` the CDN serves a 1.9 MB PNG to clients that send no Accept header); `imageUrl` for the schema becomes `${article.imageUrl}?w=1200&h=675&fit=crop&fm=jpg&q=80` when the article has an image, `undefined` otherwise.
6. `scripts/og/default-card.svg` (source, committed): 1200×630, `<rect>` fill `#f4f5f2`, centred wordmark `Ve7as` in a system serif (Georgia), 180 px, fill `#16211e`, the «7» as a `<tspan>` fill `#0f5c4e`; a 2 px line `#d6dbd7` 60 px below the wordmark; no other text (one file serves seven locales). Rasterise once with the already-installed `sharp`: `node -e "import('sharp').then(({default:s})=>s('scripts/og/default-card.svg').png().toFile('public/og/default.png'))"` and commit `public/og/default.png`. Nothing loads from an external domain.

Acceptance: `curl -s $B/en/tools/odds-converter/ | grep -cE 'og:image"|twitter:card|max-image-preview'` is at least 3; `curl -sI $B/og/default.png` is 200 `image/png`; `file public/og/default.png` reports 1200 x 630; `curl -s $B/en/articles/dutch-cruks-register-maintenance-november-2026/ | grep -c 'og:type" content="article"'` prints 1 and that page has no `og:image` and no `"image"` key in its Article node; `curl -s $B/ru/ | grep -c 'max-image-preview'` prints 0; no article `<title>` longer than 60 characters ends in ` — Ve7as`; `npx astro check` passes.

## P3. Spanish style rule for news translation and meta

Findings: 34. Files: `scripts/news/prompts.mjs`.

Add `export const ES_STYLE` and append it (a) in `translatePrompt` after `…запрещены так же, как английские.` and before the text, (b) in `metaPrompt` when `lang === 'es'`, before the text. Do not touch `verifyPrompt`. Text of the constant:

> Вариант языка: испанский Испании, понятный в Латинской Америке. Если в тексте есть обращение к читателю — на «tú»; «usted» и «vosotros» не использовать. Глоссарий, одно слово на понятие в тексте, заголовке и описании: odds → cuotas; bookmaker, sportsbook → casa de apuestas; slots → tragaperras; wagering requirement → rollover; house edge → ventaja de la casa; online → «online», не «en línea»; website → «sitio», не «web». Регуляторы: аббревиатура всегда в одном написании — KSA, MGA, UKGC, GGL, DGOJ; в тексте при первом упоминании испанское описание с аббревиатурой («el regulador neerlandés KSA»), далее только аббревиатура. Числа: десятичная запятая, пробел перед %, четырёхзначные без разделителя (1400), от пяти знаков с точкой (12.500); суммы словами — «215 millones de dólares»; «M$» и «M€» не использовать, в заголовке при нехватке места — «215 millones».

No gate or threshold changes, so the editorial-policy page needs no edit. Published articles stay as they are.

Acceptance: `node scripts/news/selftest-postcheck.mjs` and `node scripts/news/selftest-policy.mjs` pass; `node -e "import('./scripts/news/prompts.mjs').then(m=>{const t=m.translatePrompt('x')[0].content; if(!t.includes('casa de apuestas')) process.exit(1)})"` exits 0; after the next two or three runs read the private `newsReview` drafts for new es holds (never the Actions log).

## C10. Calculators print numbers in the page locale

Findings: 36 (part 3). Files: `margin-calculator.astro`, `odds-converter.astro`, `blackjack-house-edge.astro`, `lottery-expected-value.astro`. Depends on C2, C3, C6, L3.

In the client scripts replace `x.toFixed(n)` used for TEXT output with `new Intl.NumberFormat(document.documentElement.lang, { minimumFractionDigits: n, maximumFractionDigits: n }).format(x)` (one small helper per script; the lottery page already has `locale()`, use it): margin `mc-sum`, `mc-overround`, `mc-margin`, `mc-fair`; odds `oc-implied`; blackjack `bj-edge`, `bj-per100`; lottery lines near 349, 450 and 462. Do NOT touch values written back into inputs (`dec.value = …` in the odds converter): `<input type="number">` accepts only a point. The wagering page already formats by locale.

Acceptance: in a browser on `$B/es/tools/margin-calculator/` the defaults show `105,26 %`, `5,00 %` and `2,000 · 2,000`; on `$B/en/…` the output is unchanged; editing the decimal field of the es odds converter still works; `npx astro check` passes.

## C11. Margin calculator: odds-format select, up to 12 outcomes

Findings: 14 (part B). Files: `margin-calculator.astro`, `src/lib/odds.ts`, `src/data/tools.ts`. Depends on C2, C3, C10.

Purpose: the repo's own promotion note (`docs/seo/promotion/margin-calculator.md`) makes N outcomes a precondition for outreach; searchers of «no-vig calculator» hold American prices. Not a ranking change by itself.

1. One `<select id="mc-format">` above the fields, default Decimal. Labels: en `Odds format`: `Decimal` / `American` / `Fractional`; es `Formato de cuota`: `Decimal` / `Americano` / `Fraccionario`; ru `Формат коэффициента`: `Десятичный` / `Американский` / `Дробный`; pt and br `Formato das odds`: `Decimal` / `Americano` / `Fracionário`; de `Quotenformat`: `Dezimal` / `Amerikanisch` / `Bruch`; fr `Format de cote`: `Décimale` / `Américaine` / `Fractionnaire`. NO auto-detection of the format (a decimal longshot such as 101 would be read as +101).
2. Fields become `type="text"`, `inputmode="decimal"` for Decimal and `inputmode="text"` otherwise. Parse per selected format: decimal `Number(value.replace(',', '.'))`, American `fromAmerican`, fractional `fromFractional` (both from `src/lib/odds.ts`); a field that does not parse or gives d ≤ 1.001 is ignored, as an empty one is today.
3. Start with two fields plus `<button type="button" class="btn" id="mc-add">`: en `Add outcome`, es `Añadir resultado`, ru `Добавить исход`, pt and br `Adicionar resultado`, de `Ergebnis hinzufügen`, fr `Ajouter une issue`; each click appends one field up to 12, then the button is disabled. Existing classes only.
4. Fair odds print in the selected format: decimal as today, American through `toAmerican`, fractional through `toFraction(d − 1)`.
5. Only now change the copy: en `lede` `Enter the odds of every outcome in decimal, American or fractional format: two for a no-draw market, three for 1X2, more for outrights.`; en `description` `Enter a market’s odds (decimal, American or fractional) to get the overround, the bookmaker’s margin and the fair no-vig odds. Free, no sign-up.`; es `lede` `Introduce las cuotas de todos los resultados en formato decimal, americano o fraccionario: dos para un mercado sin empate, tres para un 1X2, más para apuestas a ganador.`; es `description` `Introduce las cuotas de un mercado (decimales, americanas o fraccionarias) y obtén el overround, el margen de la casa de apuestas y las cuotas justas sin margen (no-vig).`

Acceptance (browser, `$B/en/tools/margin-calculator/`): format American, `-110` and `-110` give overround 4.76 %, margin 4.55 %, fair `+100 · +100`; format Decimal, `101` and `1.01` are read as decimal prices; twelve fields can be added and the thirteenth cannot; format Fractional, `10/11` twice gives the same 4.76 %; `npx astro check` passes.

---

## Dropped or redesigned

| Proposal | Reason |
|---|---|
| Archive and pagination routes `/[lang]/articles/` and `/page/[n]/` (finding 7, part B) | The only search-relevant consequence (guides falling off a hub at 60 items) is removed by C1. What remains is internal links for old news, the URLs Google declines to crawl anyway; M effort for reader value only. Revisit after the first external links. |
| Conditional language-switcher link threaded through BaseLayout into Header (findings 9c, 22b) | One article is affected and the translation removes the case; a link from an indexed page to a `noindex, follow` page is not an error; it would thread article state into a component that knows only `lang` and `currentPath`. |
| Letting the pipeline write links to the site's calculators by relaxing the link check (finding 21, step 3) | It relaxes a publication gate through a helper shared with the meta check, and CLAUDE.md requires the public editorial-policy text to change in the same commit. P1 removes the contradiction without touching a gate. |
| Static per-section cards as `og:image` of articles and as `Article.image`; per-article cards built at deploy time (finding 24) | Google's Article and Discover guidance rules out generic images for articles; build-time cards contradict «content changes do not need a deploy» (a new article's image would 404 until the next deploy). |
| Pipeline-generated `socialImage` per article and a backfill of the 48 published items (finding 27d) | Any patch bumps `_updatedAt`, which feeds `dateModified`, the «Updated» line and sitemap `lastmod`: 48 news items would falsely announce an update. Share previews only, no search effect. Owner decision between the Sanity-asset and the R2 route is still open. |
| Hourly IndexNow workflow with a state file committed to main (finding 38) | Redesigned as P2: a stateless daily window gives the same coverage for hand-published news without bot commits to main, a new workflow, or a `paths-ignore` change. |
| Five `src/lib/calc/*` modules and server-rendering of all 16 result cells (finding 39, parts 1 and 2) | Googlebot renders the page, so the dashes matter only to non-rendering fetchers; the static examples and tables of L2, C2, C3, L3, C6 give those fetchers the numbers. Only `src/lib/odds.ts` is extracted (C2). Revisit when O1 shows how Bing treats the tool pages. |
| FAQPage JSON-LD on tool pages (findings 12, 13, 14, 15) | No rich result for this kind of site; the page type is SoftwareApplication. The visible Q&A text is kept. |
| Presenting the blackjack rule table as a unique data asset; the single-deck 6:5 sentence (finding 13) | The deltas come from Wizard of Odds and the owner's 4 November review found no novelty; the additive model's tolerance was never measured on one deck. The table ships in C6 with its source and without that claim. |
| Auto-detecting the odds format in the margin calculator (finding 14) | A decimal price of 100 or more would be read as American. Replaced by an explicit format select in C11. |
| Wiring the existing `metaTitle` of the wagering page for all seven locales as it is (finding 11), or leaving it unwired (finding 29) | Merged: `metaTitle` becomes optional, is set for en and es only and removed from the five noindex locales, so no title changes by accident. |
| Relabelling the pipeline byline «Ve7as» as «Ve7as editorial team»; treating every author without a profile as the Organization (findings 3, 41, original fixes) | The first would claim editorial review of automated items; the second would mislabel the named author «Tarnel». C4 keeps both distinctions. |
| Editing the `author` field of the eight guides in Sanity (finding 20a) | Not needed (the template maps the stored string) and it would move `dateModified` and `lastmod` of eight indexed pages for no content change. |
| Two separate `getArticles` calls with a `kind` option and a bare `!defined(aiDisclosure)` discriminator (finding 1, verifier variant) | Replaced in C1 by one query and predicates that survive the planned `articleKind` field. |
| New index copy with «Five calculators…» and an H2 block on the tools index (findings 17c, 19) | The index title, H1 and description were rewritten today (d5dff7d); a hard-coded count is the staleness that commit removed; the index already lists every tool with its blurb. |
| Regional hreflang for Spanish; the form label «Bote (pozo)» (finding 31) | A bare `es` is the correct catch-all; the label is regional even within Latin America and has no search value. |
| Extra sentence in `verifyPrompt` exempting glossary glosses (finding 34) | It loosens the last check before auto-publication and no self-test can show the effect. P3 uses no glosses, so the exemption is not needed. |
| HSTS preload and includeSubDomains (finding 25) | Hard to undo; not needed for the search goal. O3 enables plain HSTS only. |
| More discovery channels for news (discovery decision record) | Sitemap, news sitemap, RSS and depth-1 links exist and none produced a crawl of a news URL; the bottleneck is crawl demand, which needs links. |
