<!-- approved: True | verifier issues: 10 -->

# Tool spec: Lottery expected value calculator

URL: `/[lang]/tools/lottery-expected-value/` (en/es indexed; 5 noindex locales). H1: "Lottery expected value calculator" / ES "Calculadora de valor esperado de la lotería". Page file: `src/pages/[lang]/tools/lottery-expected-value.astro`; data file: `src/data/lottery-ev.ts`.

## Verdict: BUILD

SERP evidence, checked 2026-08-27 and **independently re-verified the same day by adversarial review** (curl + live SERP re-runs):

1. **The #1 dedicated tool is dead.** [lottolibrary.com/expected-value-calculator](https://lottolibrary.com/expected-value-calculator/) still ranks top-3 for "lottery expected value calculator" but 301-redirects to `pafidistrikwarsa.org`, an unrelated domain (confirmed by direct HTTP check, 2026-08-27: `HTTP/2 301`, `location: https://pafidistrikwarsa.org/`). The SERP for the exact primary query is about to churn — a rare timing window for a young domain.
2. **The strongest analytical competitor is stale.** [DQYDJ's Mega Millions EV calculator](https://dqydj.com/mega-millions-expected-value-calculator/) is the only one that models jackpot splitting (Poisson) and taxes properly, but its dataset is 789 drawings ending ~2012 and it does not reflect the April 2025 Mega Millions overhaul ($5 ticket, 24-ball Mega Ball pool, 1 in 290,472,336). It is also Mega-Millions-only (both facts re-confirmed by fetching the page, 2026-08-27).
3. **The rest of the SERP is either articles or thin generic calculators.** [Statistics How To](https://www.statisticshowto.com/powerball-expected-value/), [Scientific American](https://www.scientificamerican.com/article/is-the-lottery-ever-a-good-bet/) and lotterycodex answer "is it worth it" as prose, no tool. Generic calculators ([onlycalculators](https://www.onlycalculators.com/statistics/probability-theory-and-odds/lottery-calculator/), [omnicalculator](https://www.omnicalculator.com/statistics/lottery), calcbe) do odds and naive tier-EV but not the three things that change the answer: **taxes, jackpot splitting, cash-vs-annuity discount**. Our intent map (docs/seo/intent-map-2026-08.md, rows 50–52) already found Quora ranking for "is lottery ever +EV" — weak competition confirmed.
4. **ES gap is real.** Spanish SERP ("valor esperado lotería" / "calculadora valor esperado lotería") re-checked 2026-08-27: generic calculators (calc-site, calcbe, takeonepiece), sports-betting EV calculators with mismatched intent (oddsscanner, betburger), a Khan Academy video, and 2000s-era educational pages. No modern ES tool models EuroMillones with splitting, or Spain's 20% gravamen especial. We are one of very few sites with a native ES indexed pair.
5. **Demand is evergreen and news-spiked.** Every record jackpot produces a wave of "is it +EV now" coverage (Aug 2026: the $905M Powerball run generated exactly these articles). The tool catches every future spike without new content.

This is the same pattern that justified the blackjack tool: tool-shaped intent, competitors are either dead, stale, or article-only, and our angle (honest cost, not winning) is structurally different.

## Target queries

**Primary:**
- lottery expected value calculator
- lottery expected value

**Secondary:**
- expected value of a lottery ticket
- is the lottery worth it mathematically
- powerball expected value (after taxes)
- mega millions expected value
- lottery odds calculator

**Long-tail:**
- is the lottery ever positive expected value / is powerball ever +EV
- how to calculate lottery expected value
- what jackpot makes powerball worth playing (break-even jackpot)
- odds of splitting the lottery jackpot
- lottery ticket expected return per dollar

**ES:**
- valor esperado de la lotería / calculadora valor esperado lotería
- esperanza matemática de la lotería
- ¿merece la pena jugar a la lotería? (matemáticamente)
- probabilidad de ganar euromillones / valor esperado euromillones

## SERP snapshot

| Ranks today | Type | What it lacks |
|---|---|---|
| lottolibrary.com | tool (top-3) | **Dead — 301 to spam domain (HTTP-verified 2026-08-27).** Position is up for grabs |
| dqydj.com | tool + essay | Pre-2025 game data (789 drawings, ~2012), MM-only, needs sales estimates, US-only, no ES |
| statisticshowto, SciAm, lotterycodex, Quora | articles | No interactive tool; SciAm is 2016-era; lotterycodex sells "wheeling" upsells |
| omnicalculator, onlycalculators, calcbe | generic calculators | Odds + naive EV only: no taxes, no split modeling, no cash-value discount, no break-even jackpot |
| ES SERP: calc-site.com, takeonepiece, betting-EV tools | thin/mismatched calculators | No EuroMillones split/tax model, no Spanish tax rule, translated copy |

**Our differentiators:** (a) the full honest chain — advertised jackpot → cash value → split expectation → tax → EV per ticket; (b) "honest price of a ticket" framing consistent with the wagering calculator; (c) break-even jackpot with the sales-explosion caveat; (d) native ES with EuroMillones preset and the Spanish 20% tax rule; (e) verifiable constants with a published verification artifact, like the blackjack tool.

## Functional spec

**Presets:** Powerball, Mega Millions, EuroMillions, Custom game. Preset fills the game matrix, tier table, ticket price, default tax rate; everything stays editable.

**Inputs:**
1. Game matrix: pick `k` of `n` main balls + `b` of `m` bonus balls (Powerball: 5/69 + 1/26; MM: 5/70 + 1/24; EuroMillions: 5/50 + 2/12)
2. Advertised jackpot `J` (annuity for US games)
3. Cash value `J_cash` — direct input (published per draw); fallback slider ratio, default 0.46, range 0.30–1.00 (EuroMillions pays cash: ratio 1.0)
4. Ticket price `c` (preset: $2 PB, $5 MM, €2.50 EM)
5. Estimated tickets sold `N` (optional; blank = "no split modeling" mode, both results labeled)
6. Tax rate `t` (preset defaults: US 37%, ES 20%; editable 0–60%) and tax-free threshold (US $5,000; ES €40,000)

**Math (all client-side, no backend):**

Probability of matching exactly `i` main + `j` bonus (hypergeometric):

```
P(i,j) = [C(k,i)·C(n−k, k−i) / C(n,k)] × [C(b,j)·C(m−b, b−j) / C(m,b)]
```

Jackpot probability `p_J = 1 / (C(n,k)·C(m,b))`. Sanity check Powerball: C(69,5) = 11,238,513, ×26 = **292,201,338**. ✓ (MM: C(70,5)×24 = 290,472,336 ✓; EM: C(50,5)×C(12,2) = 139,838,160 ✓)

Jackpot splitting — other winners `K ~ Poisson(μ)`, `μ = N·p_J`; your expected share of the jackpot conditional on winning:

```
E[1/(1+K)] = (1 − e^(−μ)) / μ
```

Per-ticket EV:

```
EV = p_J · J_cash · (1−e^(−μ))/μ · (1−t)  +  Σ_tiers p_i · prize_i · (1 − t·[prize_i ≥ threshold])  −  c
```

Outputs: EV per ticket; **"honest price"** = −EV (headline number, same visual pattern as the wagering calculator); expected return per currency unit (RTP-style %); odds of any prize; full tier table with per-tier EV contribution; **break-even advertised jackpot**. Note: EV is *linear* in `J_cash` when `N` is held fixed, so break-even is a closed-form expression, not an iterative solver — `J_cash* = (c − Σ_tiers) · C(n,k)·C(m,b) / [ (1−e^(−μ))/μ · (1−t) ]`, then divide by the cash ratio for the advertised figure. **The break-even number must always render with its assumptions inline** (cash ratio, N, tax rate) and with the mandatory caveat text (see Responsible framing) — the figure will be quoted out of context otherwise.

**Worked example (Powerball; use as the page's default state and as the acceptance test — all figures independently recomputed 2026-08-27):**
Inputs: J = $500M, J_cash = $230M, N = 25,000,000 tickets, t = 37% on tiers ≥ $5,000, c = $2.
- μ = 25,000,000 / 292,201,338 = 0.08556; share factor = (1 − e^(−0.08556))/0.08556 = **0.9584**
- Jackpot contribution: 230,000,000 × 0.9584 × 0.63 / 292,201,338 = **$0.475**
- Fixed tiers (official odds): $1M @ 1/11,688,053.52 and $50k @ 1/913,129.18, both ×0.63 → 0.0539 + 0.0345 = **$0.088**; untaxed small tiers ($100 @ 1/36,525.17; $100 @ 1/14,494.11; $7 @ 1/579.76; $7 @ 1/701.33; $4 @ 1/91.98; $4 @ 1/38.32) sum to **$0.180**
- EV = 0.475 + 0.088 + 0.180 − 2.00 = **−$1.26 per ticket**; expected return $0.74 per $2 (37%); honest price **$1.26**
- Break-even: cash value ≈ **$838M**, i.e. advertised jackpot ≈ **$1.82B** at these assumptions (0.46 cash ratio, N and share factor held). Cross-checks with the independently published ~$1.8B threshold ([Kiplinger](https://www.kiplinger.com/taxes/powerball-lottery-jackpot-tax)-cited coverage), a good external sanity anchor. *(Earlier draft said ≈$1.75B — that was an arithmetic error; $1.82B is the value the spec's own formula produces and is the acceptance-test figure.)*

## Data & verification

Pattern mirrors the blackjack tool (docs/seo/woo-blackjack-matrix-2026-08-27.json): every constant in `src/data/lottery-ev.ts` carries `source` URL + `dateChecked`; a capture artifact goes to `docs/seo/lottery-odds-verification-<date>.json`.

| Constant | Authoritative source | Verification |
|---|---|---|
| Powerball matrix, 9 tiers, fixed prizes, odds | [powerball.com/powerball-prize-chart](https://www.powerball.com/powerball-prize-chart) | Recompute each tier's odds from the hypergeometric formula; assert equality with the official chart to 2 decimals. **Footnote in copy: non-jackpot "fixed" prizes are pari-mutuel in California by state law — the table shows the standard fixed amounts** |
| Mega Millions matrix (post-Apr-2025: $5, 5/70 + 1/24, jackpot 1:290,472,336, overall 1:23.08) | [megamillions.com](https://www.megamillions.com/News/2025/New-Mega-Millions%C2%AE-arrives-in-April.aspx) + [MD Lottery changes page](https://www.mdlottery.com/games/mega-millions/changes/) | Same combinatoric recompute. **Caveat:** post-2025 MM has a built-in random multiplier on non-jackpot prizes — the preset must use the official multiplier-odds table; if it cannot be captured verbatim, ship MM as jackpot-EV + odds only, tiers labeled "base prize before multiplier" |
| EuroMillions matrix, 13 tiers (jackpot 1:139,838,160, overall ~1:13) | [euro-millions.com/odds-of-winning](https://www.euro-millions.com/odds-of-winning) cross-checked against an official operator (FDJ / loteriasyapuestas.es) | Recompute odds. Non-jackpot tiers are pari-mutuel: use official prize-fund percentage allocations or long-run averages, always labeled "average, varies by draw". **This is the slowest data task in the build — no fixed official constants exist; budget it explicitly (see Effort)** |
| US default tax 37% (24% withholding note) | IRS top marginal bracket, [Kiplinger summary](https://www.kiplinger.com/taxes/powerball-lottery-jackpot-tax) | Editable field, footnoted; state taxes explicitly out of scope, said so in copy |
| ES tax: 20% above €40,000 exempt | Agencia Tributaria, gravamen especial (Ley 16/2012) | Editable field, footnoted |

**Pre-ship gate:** `scripts/verify-lottery-data.mjs` (plain Node, no deps, run manually like the blackjack capture) recomputes every preset's tier odds from `C(n,k)` and diffs against the stored official values; any mismatch > rounding fails loudly. It must also reproduce the worked example above (EV = −$1.26, break-even ≈ $1.82B) as an acceptance assertion. The combinatorics make this tool *self*-verifying in a way blackjack wasn't — the math IS the source, the official charts are the cross-check. Zero budget respected: no API, no build-time fetches, no backend, no sign-up, all constants static.

## Responsible framing

- Framing throughout: **"what a ticket really costs"**, never "should you play" answered with yes. Headline result is the expected loss ("honest price"), identical in spirit to the wagering calculator's expected-cost angle.
- Mandatory always-visible line: "Almost every lottery draw has negative expected value. This tool shows the size of the loss, not a way to avoid it."
- **+EV guard:** if user inputs produce EV ≥ 0, render a mandatory warning instead of a green number: expected value is an average over hundreds of millions of tickets, not a prediction; the 1-in-292M variance is not survivable by any bankroll; real +EV windows historically collapsed via ticket-sale explosions and splitting (link to the planned Cash WinFall roll-down article when it exists). Never a "buy now" visual cue, no green/positive styling for +EV.
- Break-even jackpot always ships with its caveat: "at that jackpot size, sales surge and the split probability eats the edge — the threshold is a mirage that recedes as you approach it." The number never renders without its assumptions (cash ratio, N, tax) printed beside it.
- No number picking, no hot/cold numbers, no wheeling, no "strategies" — explicitly rejected in copy (differentiates us from lotterycodex-style competitors).
- `ResponsibleGaming` component on the page, as on articles.
- Tax figures labeled as simplified defaults, not tax advice.

## Integration

- **Section:** lottery-esports (exists in `src/i18n/ui.ts`) — this becomes the hub's first tool asset (open need per intent map §4 and this brief's premise).
- **`RELATED_TOOL`** in `src/pages/[lang]/articles/[slug].astro` (the record starts at line 16): add `'lottery-formats-overview' → { segments: ['tools', 'lottery-expected-value'] }` with 7-language labels (en: "What a ticket really costs: expected value calculator"; es: "Lo que realmente cuesta un boleto: calculadora de valor esperado"; ru: "Сколько на самом деле стоит билет: калькулятор матожидания"; + pt/de/fr/br). **Pre-wire check: confirm in Sanity Studio that the article's slug/id is exactly `lottery-formats-overview`** — RELATED_TOOL is keyed on `article.id` and a mismatched key fails silently (the link simply never renders).
- **Planned content pairing:** the intent-map row 51 article ("expected value of a lottery ticket / is lottery ever +EV") gets this tool as its primary internal link and worked-example source; the roll-down/Cash WinFall case study (row 52) links to it as the historical exception that proves the rule. Both briefs should name the tool URL.
- **Tools index** `src/pages/[lang]/tools/index.astro`: add card. i18n strings in `src/i18n/ui.ts` for all 7 languages. Sitemap/hreflang pick up en/es automatically.
- **Schema:** `SoftwareApplication` via the existing `schema` prop pattern in `src/lib/schema.ts` — same as the other four tools.

## Effort estimate

**13–17 hours.** Data capture + verification script + artifact: 4–5h (three official charts, one tax rule pair; the extra hour is EuroMillions pari-mutuel average-prize capture, which has no fixed official constants and needs cross-source averaging plus labeling). Page + client-side JS (hypergeometric, Poisson share, tier table, closed-form break-even): 5–6h. i18n strings ×7 languages + ES copy quality pass: 2–3h. Styling reuses the existing `Инструменты` CSS block: 1h. QA against worked example + official charts: 1–2h.

**Main risk:** Mega Millions' post-2025 built-in multiplier makes non-jackpot tiers non-constant — mitigated by the fallback scope (jackpot-EV-only MM preset, base prizes labeled) already defined above. Secondary risk: EuroMillions pari-mutuel averages could be mistaken for guarantees — mitigated by mandatory "average, varies by draw" labels. Tax simplification is a documented caveat, not a bug: one editable rate + threshold, no state/country tax engine, ever.