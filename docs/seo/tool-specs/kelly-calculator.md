<!-- approved: True | verifier issues: 10 -->

# Tool spec: Kelly Criterion Calculator (with uncertainty band)

*Rev. 2 — adversarially reviewed 2026-08-27: demand re-verified with live queries, every formula and worked number recomputed and confirmed, defaults reconciled, feasibility claims checked against the repo. Changes from rev. 1 are marked ⟲.*

## Verdict

**Build — but as a long-tail / authority play, not a head-term play.** Route: `/[lang]/tools/kelly-calculator/` (EN + ES indexed, 5 noindex locales as usual).

SERP evidence behind the verdict (⟲ re-verified 2026-08-27 with fresh queries):

- **Demand is real and steady.** The head query is served by an exact-match domain (kellycriterioncalculator.com), maintained 2026-dated pages (cuantoapostar.com \"Calculadora Gratuita 2026\"), mobile apps on both stores, and a calculator on every major betting-tools property (betstamp, OddsJam, SportsbookReview, BetBurger, ProfitDuel, TopEndSports). ⟲ Re-run of \"kelly criterion calculator\" (EN) and \"calculadora criterio de kelly apuestas\" (ES) on 2026-08-27 returned exactly this inventory. Nobody maintains that inventory for a dead query. Free tooling gave no exact volume numbers — treat volume as \"steady, mid\" by proxy signals only.
- **The head term is out of reach.** ve7as is indexed since summer 2026 with no backlink profile; betstamp/OddsJam/SBR are DR-70+ sites with dedicated calculator hubs. Ranking for \"kelly criterion calculator\" in the next 12 months is not a realistic goal and must not be the success metric.
- **The original hypothesis is only half-true — and that matters.** \"Existing tools don't warn about edge estimation error\" is falsified for the best competitor: betstamp explicitly writes \"Full Kelly is mathematically optimal *if your win probability estimates are perfect*. In practice, nobody's estimates are perfect — and full Kelly produces brutal drawdowns.\" (⟲ quote verified verbatim against the live page 2026-08-27.) However, **no betting-SERP calculator quantifies the warning**: ⟲ betstamp confirmed to output only stake-$ and stake-% — no sensitivity band, no drawdown probability; none of the others shows what a ±2-point probability error does to the recommended stake or the closed-form probability of halving a bankroll at a given Kelly fraction; kellycriterioncalculator.com (the EMD) has no estimation-error warning at all. Monte-Carlo Kelly simulators exist (kellysimulator.com, sesen.ai, tradingcolosseum.com) but they target trader/quant queries, not betting ones. ⟲ The long-tail drawdown SERP (\"kelly criterion drawdown probability\") is served by trader-oriented position-sizing tools and blog prose — no betting calculator computes it live. The gap holds.
- **Strategic fit is strong even at modest traffic.** The tool is the interactive proof for the bankroll-management article, closes the tools cluster (odds → margin → fair probability → stake), and its \"the stake is only as good as your probability estimate\" angle is exactly the site's honest-price positioning. Same logic as the wagering calculator: differentiate on showing the cost, not on chasing the head term.

If the owner wants a pure-traffic decision instead: this would be *build-later* behind topics with weaker SERPs. As a cluster-completion and E-E-A-T asset: build now.

## Target queries

**Primary (aspirational, saturated — do not measure success on these):**
- kelly criterion calculator
- kelly calculator betting / kelly bet calculator

**Secondary (thinner competition, page must explicitly cover):**
- fractional kelly calculator; half kelly calculator; quarter kelly calculator
- kelly criterion calculator sports betting
- ES: calculadora criterio de kelly; kelly fraccionado apuestas; cuánto apostar criterio de kelly

**Long-tail (the actual target — the uncertainty feature answers these and no ranking calculator does):**
- why is full kelly too aggressive / kelly criterion overbetting
- kelly criterion drawdown probability / kelly risk of ruin
- kelly criterion if probability estimate is wrong / kelly estimation error
- what happens if you bet more than kelly / double kelly growth
- kelly criterion negative edge / when kelly says bet zero

## SERP snapshot

**EN top results (⟲ confirmed 2026-08-27):** betstamp, kellycriterioncalculator.com (EMD), OddsJam (403 to bots; markets multiplier presets), Sesen AI, BetBurger, SportsbookReview, ProfitDuel, TopEndSports, plus investing-oriented ones (fical.net, tradesearcher.ai, backtestbase.com).
**ES top results (⟲ confirmed 2026-08-27):** cuantoapostar.com (dedicated, fractional mode), legalbet.es (edu + calc), betburger ES, calculadora.now, plus content-only pages (librodeapuestasdeportivas, miscasasdeapuestas, ganarapuestasfutbol) and a Play Store app.

**What the ranked tools have:** odds in 3 formats, win-probability input, bankroll, Kelly multiplier presets (1 / 0.5 / 0.25), stake in $ and %, negative-Kelly → \"don't bet\" (kellycriterioncalculator.com: \"Because this number is below 0 you should not back the selection\"). Betstamp additionally takes devigged \"true odds\" and warns about imperfect estimates in prose — but outputs only stake, no quantification.

**What none of them do (the gap this spec fills):**
1. **Quantified sensitivity** — show the stake as a *range* under a stated probability-estimate error, and flag when the error band crosses break-even (i.e. \"your edge may not exist\").
2. **Closed-form drawdown numbers per Kelly fraction** — \"at full Kelly you have a 50% chance of ever halving your bankroll; at quarter Kelly, under 1%\" computed live, not asserted in a blog paragraph.
3. **An honest on-ramp for p** — every tool asks for \"your win probability\" as if bettors have one; none connects it to devigging a market. We link the margin calculator as the source of a defensible p.

## Functional spec

Pure client-side, no backend, no accounts, math in a plain TS module (mirroring `src/data/blackjack-house-edge.ts` separation: formulas in `src/lib/kelly.ts`, UI in the page). ⟲ Feasibility verified: every output below is closed-form — no data tables, no API, no auth, nothing that needs a server.

**Inputs**
1. **Odds** — decimal / American / fractional selector. ⟲ The odds-converter's parsing currently lives inline in `src/pages/[lang]/tools/odds-converter.astro` (verified — there is no shared module in `src/lib/`), so extracting parse/format into a shared `src/lib/odds.ts` is a **mandatory prerequisite**, not an option; both tools then import it. Internally normalized to decimal `d`; net payoff `b = d − 1`.
2. **Estimated win probability `p`** — percent, 0–100. Helper link: \"No estimate? Devig a market with the margin calculator first.\"
3. **Bankroll `B`** — currency-agnostic number.
4. **Kelly fraction `k`** — presets 0.25 (**default**), 0.5, 1.0, plus custom 0.05–1.0. No k > 1: over-Kelly is shown only in the educational double-Kelly block, never as a stakeable setting.
5. **Estimate error `ε`** — \"how far off could your probability be?\" — percentage points, default 2, range 0–10.

**Formulas (exact — ⟲ every one recomputed and confirmed in review)**
- Break-even probability: `p₀ = 1/d`.
- Edge per unit staked: `e = p·d − 1`.
- Full Kelly fraction: `f* = (p·d − 1)/(d − 1) = (b·p − (1−p))/b`. If `f* ≤ 0` → stake 0, show \"no edge at these odds\" state.
- Recommended stake: `k·f*·B` (currency) and `k·f*` (%).
- Expected log-growth per bet at fraction `f`: `g(f) = p·ln(1 + f·b) + (1−p)·ln(1 − f)`.
- Growth retained at fraction k: **display the exactly computed ratio `g(k·f*)/g(f*)`** (⟲ so the UI never disagrees with the live math); the small-edge approximation `2k − k²` (0.75 at half, 0.4375 at quarter) is for prose and verification only.
- Drawdown (Thorp continuous approximation): probability of *ever* dipping below fraction `x` of the starting bankroll when betting `k`-fraction Kelly: `P = x^(2/k − 1)`. Display for x = 0.5: k=1 → 50%, k=0.5 → 12.5%, k=0.25 → 0.78%. ⟲ On-page caveat required: this is a continuous-time, infinite-horizon approximation — real discrete betting deviates slightly; treat the numbers as the order of magnitude, not a promise.
- Sensitivity band: recompute `f*` at `p − ε` and `p + ε`; display stake range. ⟲ **Clamp the lower endpoint at 0** — `f*(p − ε)` can be negative, and the clamped-to-zero state is exactly the red-flag state. If `p − ε < p₀` → mandatory red flag: \"Within your own margin of error this bet may have no edge. Kelly's answer to 'no edge' is: bet nothing.\"
- Overbet check: compute `g(k·f*(p))` using probability `p − ε` as the true one; if negative, warn: \"If your estimate is ε points too high, this stake shrinks your bankroll on average.\"

**Worked example (ship this as the pre-filled default and as a test vector)**
⟲ Rev. 1 shipped a k = 0.5 example while declaring k = 0.25 the default — contradiction fixed; the default example is now quarter Kelly, matching the input default and the responsible-framing section.

Odds +110 (decimal 2.10), p = 50%, B = 1000, **k = 0.25**, ε = 2:
- p₀ = 1/2.10 = 47.62%; edge e = 0.50·2.10 − 1 = **5.0%**
- f* = 0.05/1.10 = **4.55%** → full Kelly $45.45; **quarter Kelly $11.36 (1.14% of bankroll)** — the displayed stake. (Half Kelly $22.73 shown when k = 0.5 is selected.)
- g(f*) = 0.5·ln(1.05) + 0.5·ln(0.954545) = **+0.1135% per bet**; g(¼f*) = **+0.0497%** → **43.8% of full-Kelly growth at a quarter of the stake** (exact ratio 43.78%; approximation 2k − k² gives 43.75%). At k = 0.5: g = +0.0852%, 75.0% of full-Kelly growth.
- Sensitivity, ε = 2 pts: p = 48% → f* = 0.73% ($7.27); p = 52% → f* = 8.36% ($83.64). Headline: **a 2-point estimate error moves the \"optimal\" stake 11.5×** (⟲ was \"11×\"; $83.64/$7.27 = 11.5 — exact) — this single number is the page's reason to exist.
- ⟲ **Default-state warning behavior, made explicit:** the band floor (48%) sits 0.38 pts *above* break-even (47.62%), so the red flag does **not** fire in the default state; copy under the slider invites the user to try ε = 3 and watch it appear. The overbet check at the k = 0.25 default computes g(¼f*; p = 48%) = **+0.0000199** — barely positive, no warning. At k = 0.5 with the same ε it computes **−0.000102** — the warning **fires**. Both boundaries are deliberate and ship as test vectors; an implementer seeing the warning at k = 0.5 is seeing correct behavior, not a bug.
- Drawdown at chosen k = 0.25: **0.78% chance of ever halving** the bankroll (12.5% at half Kelly, 50% at full).
- Double-Kelly sanity display (educational block): staking 2·f* gives g = 0 (exactly, at these inputs) — betting more than that has *negative* expected growth even with a real edge.

**Out of scope v1 (explicitly, to contain effort):** Monte-Carlo simulation, multi-outcome/simultaneous-bet Kelly, saving inputs. Closed-form drawdown replaces simulation.

## Data & verification

Same discipline as the blackjack tool (verified against Wizard of Odds): every constant and formula gets a named source and a pre-ship check. ⟲ All checks below were independently recomputed during this review and pass.

| Item | Authoritative source | Verification before ship |
|---|---|---|
| Even/uneven-payoff Kelly formula `f* = edge/payoff` | Wizard of Odds, \"The Kelly Criterion\" (wizardofodds.com/gambling/kelly-criterion/) | Reproduce WoO's sports example: p = 20%, payoff 9:2 → f* = 0.1/4.5 = **2.22%**. Must match to 2 decimals. ⟲ Confirmed: 0.022222. |
| Log-growth `g(f)` | Same WoO page (growth formula) + Kelly (1956) via Wikipedia \"Kelly criterion\" | `g(2f*) ≈ 0` for small edges (⟲ exactly 0 at the default inputs); `g` maximized at f* (numeric check on a grid). |
| Fractional-Kelly growth ratio 2k − k² | E. O. Thorp, \"The Kelly Criterion in Blackjack, Sports Betting, and the Stock Market\" (2007 Handbook chapter; PDF freely available) | Half Kelly → 75% growth / 50% volatility (⟲ exact ratio at default inputs: 75.02%); matches WoO's \"reduces volatility by 50%, growth by only 25%\". |
| Drawdown `P(dip to x) = x^(2/k−1)` | Thorp (same paper, continuous approximation section); corroborated by MacLean–Thorp–Ziemba, *The Kelly Capital Growth Investment Criterion* (2011) | k=1, x=0.5 → 0.5 (the classic \"X% chance of dropping to X%\"); k=0.5 → 0.125; k=0.25 → 0.0078. ⟲ All confirmed. Ship with the \"approximation\" caveat in UI copy. |
| Overbetting asymmetry claim in copy | MacLean–Thorp–Ziemba (2011): small input errors → large overbet | Cited in the article text, not computed. |

Mechanics: ship `f*`, `g`, ratio and drawdown as pure functions in `src/lib/kelly.ts` with a unit-test vector table in the repo: the worked example above, WoO's 2.22% case, edge-zero and p = p₀ boundaries, ⟲ plus the two overbet-check boundary vectors (k = 0.25 → +0.0000199 no-warn; k = 0.5 → −0.000102 warn). Property checks: `f*(p₀) = 0`; `f*` monotone in p; stake never negative; band endpoints ordered after clamping. Run the vectors in a CI-adjacent script or at minimum a documented manual check, exactly as done for blackjack-house-edge data.

## Responsible framing

The tool's stance: **Kelly is a brake, not an accelerator.** It exists to show how narrow the road is, not to promise growth.

Mandatory elements:
- **Lead copy** frames it as stake *limiting*: \"The Kelly criterion tells you the maximum stake that isn't self-destructive — assuming your probability estimate is right. It is not a way to win; with no real edge, its answer is zero.\"
- **Default k = 0.25** (quarter Kelly), not full — the conservative default is itself the message, matches professional practice cited in the article, ⟲ and is now consistent with the pre-filled worked example.
- **The margin reality check** (mandatory block): a typical bookmaker line carries a margin, so a bettor with no information advantage has p < p₀ *by construction* — for them Kelly outputs **0**. Link the margin calculator. This is the anti-\"way to win\" anchor.
- **Red state** whenever `p − ε < p₀` (\"your edge may not exist\") and whenever f* ≤ 0 (\"no edge — Kelly says don't bet\"). Never render a positive stake in these states' primary slot.
- ⟲ **Pre-filled example honesty note:** the default inputs presuppose a 2.4-point edge; the copy directly beneath the result must say so (\"this example assumes you know something the market doesn't — most bettors don't; see the margin reality check\") so the default state cannot be read as \"a typical bet looks like this.\"
- **No projected winnings.** Outputs are stake, growth *per bet* in %, and drawdown probabilities. Never \"you will earn…\", never currency projections over time, never the words \"guaranteed\", \"optimal profit\", \"system\".
- Standard site footer disclaimers: informational only, not betting advice, 18+, problem-gambling resources — same treatment as the four live tools.

## Integration

- **Section**: tools index `/[lang]/tools/` alongside the four live tools; EN + ES full copy (the ES SERP is real — cuantoapostar is beatable on the uncertainty angle), other 5 locales noindex per `INDEXED_LANGUAGES`. ⟲ Note: per the established pattern (verified in odds-converter.astro), the noindex locales still render and carry translated UI strings — all 7 locales need copy, budgeted below.
- **Articles → tool** (RELATED_TOOL mapping — ⟲ verified to exist in `src/pages/[lang]/articles/[slug].astro`):
  - `bankroll-management` → `kelly-calculator` (primary; the article's fractional-Kelly section becomes \"try it: move ε and watch the stake range explode\").
  - `how-bookmakers-set-odds` (brief in queue) → `kelly-calculator` (secondary; the \"where does p come from\" step).
- **Tool → tool cross-links**: margin-calculator (\"get a devigged p before trusting any stake\"), odds-converter (⟲ shares `src/lib/odds.ts` after the mandatory extraction — see Inputs).
- **Tool → article**: link back to bankroll-management from the drawdown block.
- Sitemap/hreflang: automatic via existing `[lang]/tools/` handling; verify EN/ES pair only, consistent with the 2026-08-25 language decision.

## Effort estimate

⟲ **12–16 hours total** (rev. 1 said 10–14; corrected for the mandatory odds-parsing extraction and the 7-locale copy reality):
- Extract odds parse/format from odds-converter.astro into `src/lib/odds.ts`, re-wire the converter, verify no regression: 1 h (**mandatory prerequisite**, no longer conditional)
- Math module (`src/lib/kelly.ts`) + test vectors + property checks: 3 h
- Page UI (inputs, band visualization, red states, drawdown table): 4–5 h
- Copy: EN + ES full incl. responsible-framing and educational blocks: 3 h; UI strings for the 5 noindex locales per house pattern: 1 h
- Verification pass against WoO/Thorp numbers + cross-links + RELATED_TOOL wiring: 1–2 h

**Main risk — scope creep toward a simulator.** The Monte-Carlo path (what kellysimulator.com does) doubles the effort and adds nothing the closed-form drawdown doesn't already say; it is explicitly out of scope for v1. Secondary risk: the sensitivity UI becoming a second calculator — keep it to one ε slider and one stake-range readout. SEO risk is expectation-level, not execution-level: head-term rankings will not come; judge the page on long-tail impressions and on engagement from the bankroll article.

---
*Sources consulted (rev. 1): Google SERPs for \"kelly criterion calculator\" (EN/ES) and fractional/drawdown variants; betstamp.com/calculators/kelly and kellycriterioncalculator.com (inspected); oddsjam.com (403, snippet only); wizardofodds.com/gambling/kelly-criterion/ (fetched, worked examples extracted); Thorp 2007 and MacLean–Thorp–Ziemba 2011 identified as canonical print sources for the drawdown/overbetting math.*

*⟲ Review verification (rev. 2, 2026-08-27): live re-run of \"kelly criterion calculator\" (EN), \"calculadora criterio de kelly apuestas\" (ES), \"kelly criterion drawdown probability half kelly\" — SERP snapshot confirmed; betstamp.com/calculators/kelly re-fetched — warning quote verbatim, outputs limited to stake-$/stake-% (no sensitivity band, no drawdown output), gap claim confirmed; every formula and worked number recomputed in a script and confirmed exact; repo checked — odds parsing not shared (inline in odds-converter.astro), RELATED_TOOL mapping present, all-7-locale copy pattern confirmed in existing tools.*