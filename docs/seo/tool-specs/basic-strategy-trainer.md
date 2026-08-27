<!-- approved: True | verifier issues: 8 -->

# Tool spec: Blackjack Basic Strategy Trainer

*(Rev. 2 — adversarial review 2026-08-27: demand re-verified with fresh SERPs; verification design corrected — rule set moved from 8 to 6 decks because Appendix 9 has no 8-deck-with-peek variant; the 4.38% example constant demoted to provisional after WoO's own sources were found to disagree by >2× across rule sets; ship-gate tolerances made achievable; worked examples recomputed.)*

## Verdict (build / build-later / skip, with reasoning from SERP evidence)

**SKIP the standalone trainer.** **Build-later (small):** a \"mistake cost\" module merged into the existing blackjack cluster (house-edge tool + basic-strategy article), which captures the only gap the research actually found.

Reasoning from the SERP, not from taste (re-run independently 2026-08-27; both verdicts reproduced):

1. **The head SERP is saturated with strong free tools.** \"blackjack basic strategy trainer\" returns: an app pack (Google Play / App Store take 4+ slots), BlackjackInfo's trainer (Ken Smith's authority site), and purpose-built exact-match domains — blackjack.training, basicstrategy.app, learn-blackjack.com, blackjack-trainer.net, blackjackpro.us — plus aggregators (bojoko, blackjacksimulator.net, casinointellect, ace-ten). Wizard of Odds also hosts two free trainers (they did not appear in the review's top-10 for the head term, but the saturation case holds without them).
2. **Our planned differentiators are not differentiators.** Feature audit of BlackjackInfo's trainer (re-verified 2026-08-27): free, no sign-up, rule-aware engine (decks, S17/H17, double restrictions, DAS, surrender, peek), accuracy stats with per-hand-type breakdown and \"most common mistakes\", available in 8 languages **including Spanish and Russian**, plus a free Android app. blackjack-trainer.net also updates its strategy per table rules. \"Free no-signup rule-aware trainer\" already exists several times over. The only paid gate in the niche is Blackjack Apprenticeship ($397/yr membership; freemium app) — and the market routed around it years ago.
3. **The ES SERP is equally closed.** BlackjackInfo serves a native ES version of the same trainer; basicstrategy.app, learn-blackjack.com and blackjacksimulator.net also rank for \"entrenador estrategia básica blackjack\".
4. **Domain reality.** ve7as has been indexed since summer 2026 with no backlink profile. Against authority domains plus exact-match domains, a me-too trainer has no plausible ranking path in 12–18 months — and it would be our most expensive tool to verify (a trainer that teaches one wrong play is a worse incident than a calculator being off).
5. **The one real gap** (verified across two queries, re-verified 2026-08-27): **no incumbent shows the expected-value cost of a wrong decision.** Queries like \"how much does a basic strategy mistake cost\" return the WoO basics page, an Ask-the-Wizard page, a Wizard of Vegas forum thread and listicle blogs (casinocenter, uscasinoadvantage, gamblingsites, BlackjackInfo's own top-ten listicle) — no interactive tool anywhere in the top 10. BlackjackInfo's trainer, the strongest incumbent, was specifically confirmed to say only \"wrong, correct play is X\" with no cost figure. That gap is exactly ve7as's editorial line (\"the mathematical cost of gambling, not ways to win\"), and it is an article + small calculator gap, not a trainer gap. It is also cheap: a bounded, double-sourceable constants table instead of a ~2,700-cell decision engine.

## Target queries (primary, secondary, long-tail — from research)

**Queries we are NOT contesting (trainer head terms — evidence above says unwinnable):**
- blackjack basic strategy trainer / blackjack strategy trainer free / no download / no signup
- practice blackjack basic strategy, blackjack strategy drill
- ES: entrenador de estrategia básica blackjack, practicar estrategia básica blackjack

**Queries the merge module targets (weak SERPs — forums and listicles rank, no tool does):**
- Primary: *how much do basic strategy mistakes cost*, *blackjack mistake cost*, *cost of basic strategy errors*
- Secondary: *blackjack expected value of a hand*, *EV of hitting vs standing 16 vs 10*, *what does not splitting 8s cost*
- Long-tail: *\"hit instead of split\" cost blackjack*, *blackjack house edge with mistakes*, *how much worse is playing by feel than basic strategy*
- ES: *cuánto cuestan los errores de estrategia básica en el blackjack*, *valor esperado de una mano de blackjack*

Honest caveat: these are low-volume long-tail queries. That is consistent with the domain's stage — a winnable long-tail beats an unwinnable head term, and the module strengthens the existing blackjack cluster rather than opening a new front.

## SERP snapshot (what ranks, what existing tools lack)

| Who ranks | Type | Free / no signup | Rule-aware engine | Stats | ES | Shows EV cost of a mistake |
|---|---|---|---|---|---|---|
| Google Play / App Store apps (4+ slots) | apps | freemium | varies | yes | some | no |
| blackjackinfo.com trainer (Ken Smith) | web, authority | yes / yes | yes (decks, S17/H17, DAS, surrender, peek) | yes, incl. per-hand-type | yes (native, 8 langs incl. RU) | **no (re-verified 2026-08-27)** |
| wizardofodds.com (two trainers) | web, authority | yes / yes | yes + combinatorial \"analyze\" per situation | partial | no | on demand via \"analyze\", not in the drill loop |
| blackjack.training, basicstrategy.app, learn-blackjack.com, blackjack-trainer.net, blackjackpro.us | exact-match dedicated sites | yes / yes | partially (blackjack-trainer.net yes) | yes | partial | no |
| bojoko, blackjacksimulator.net, casinointellect, ace-ten | affiliate/aggregator pages | yes | partial | partial | partial | no |
| blackjackapprenticeship.com | paid course + trainer | trainer paid ($397/yr; app freemium) | yes | yes | no | no |

**What they collectively lack:** the price tag on the error. Every trainer says \"wrong, the correct play is X\"; none says \"and that wrong play costs N% of your bet in expectation — here is what your error rate does to the house edge per hour.\" That framing (cost, not correction) is unclaimed and is our positioning verbatim.

Key sources: [BlackjackInfo trainer](https://www.blackjackinfo.com/blackjackinfo-blackjack-strategy-trainer/) ([ES version](https://www.blackjackinfo.com/es/blackjackinfo-entrenador-de-estrategia-de-blackjack/)), [Wizard of Odds trainer](https://wizardofodds.com/play/blackjack/) and [trainer v2](https://wizardofodds.com/play/blackjack-v2/), [blackjack.training](https://blackjack.training/), [basicstrategy.app](https://basicstrategy.app/), [learn-blackjack.com](https://learn-blackjack.com/), [blackjack-trainer.net](https://blackjack-trainer.net/), [blackjackpro.us](https://blackjackpro.us/), [BJA plans & pricing](https://www.blackjackapprenticeship.com/plans-and-pricing/), [Ask the Wizard: specific hands](https://wizardofodds.com/ask-the-wizard/blackjack/basic-strategy-hands/), [WoO blackjack basics (cost of imperfect play)](https://wizardofodds.com/games/blackjack/basics/), [Wizard of Vegas: least costly mistakes](https://wizardofvegas.com/forum/gambling/blackjack/39090-least-costly-bs-mistakes/), [gamblingsites: 10 errors and their cost](https://www.gamblingsites.com/blog/10-worst-blackjack-mistakes-131795/).

## Functional spec (inputs, outputs, formulas — exact math, worked example with numbers)

### A. What the full trainer would require (documented so the skip is auditable)

A rule-aware engine needs total-dependent basic strategy tables for at least {1/2/6/8 decks} × {S17/H17} × {DAS/noDAS} × {surrender/none} — ≥8 chart variants × ~340 decision cells ≈ **2,700+ cells**, every one verifiable against the Wizard of Odds strategy calculator, plus drill UI with weighted sampling of borderline hands, streak tracking, and i18n × 7. That is 40–60 h to tie for feature parity with free incumbents on authority domains. Not built.

### B. The recommended merge module: \"What mistakes cost\" (Цена ошибки)

Client-side only, no backend, no accounts. A constants table plus arithmetic. Ships as a new band on `/[lang]/tools/blackjack-house-edge/` (below the existing calculator) or as a section of the basic-strategy article page — decision at build time; no new route needed.

**Fixed rule set: 6 decks, S17, DAS, double any two, resplit to 4 hands, peek, no surrender, BJ 3:2.** *(Changed from 8 decks in rev. 1 — review finding: Wizard of Odds Appendix 9, the second verification artifact, has no 8-deck-with-peek variant; the two-source ship gate was unsatisfiable as originally specced. The 6-deck variant `6ds17r4` exists and matches this rule set exactly.)* One rule set — because the point is the order of magnitude of error costs, and one rule set keeps the dataset boundedly verifiable. The projector's base edge for this rule set derives from constants the repo has already verified — `BJ_BASE_EDGE + BJ_DELTAS.decks[6] = 0.44686 − 0.02064 = 0.42622%` — computed from `src/data/blackjack-house-edge.ts`, not hardcoded a second time.

**Rule-sensitivity warning (review finding, must survive into UI copy):** mistake costs move a lot with table rules. Verified example: for hitting 4,4 instead of splitting vs a dealer 6, Ask the Wizard gives **4.38 п.п.** at the Wizard's default rules, while Appendix 9 at 6 decks **H17** gives split-DAS +0.207228 vs hit +0.113365 = **9.39 п.п.** — more than 2× apart on the same mistake. Every constant in the dataset is therefore valid *only* for the fixed rule set above, the UI states that rule set next to every output, and no constant may be copied from a source without confirming the source's rule assumptions match.

**Part 1 — mistake picker.** A curated table of the ~15 most common basic-strategy errors. Row: situation (e.g. 4,4 vs 6), correct action, common error, `EV_correct`, `EV_error`, cost. User selects a row and a bet size.

- `cost_pct = EV_correct − EV_error` (both in fractions of the **initial** bet, from the verified dataset)
- `cost_money = bet × cost_pct`
- **Units note:** EVs are per initial bet even when the correct play is split or double (more money goes on the table). The UI labels the cost \"per initial bet\" so a split/double row cannot be misread.

**Part 2 — sloppiness projector.** Inputs: bet size `B`, hands per hour `H` (default 80, range 50–500), error rate `r` (% of hands misplayed, default 5%), average cost per error `c̄` (default: frequency-weighted mean of the dataset; user-adjustable).

- Added edge: `Δedge = r × c̄`
- Expected loss per hour at perfect play: `L₀ = B × H × edge_base` where `edge_base = 0.42622%` (derived from verified repo constants as above)
- Expected loss per hour as played: `L = B × H × (edge_base + Δedge)`
- Sanity anchor for the default: Wizard of Odds' basics page attributes roughly **0.14 п.п.** of added edge to a typical player's imperfect play; the defaults `r = 5%`, `c̄ = 2.5%` give `Δedge = 0.125 п.п.` — the same order, independently sourced. Re-check `c̄` against the final dataset's frequency-weighted mean before ship.

**Worked example 1 (single mistake).** Hitting 4,4 instead of splitting against a dealer 6 costs — **provisionally** — 4.38 п.п. of the bet per occurrence (Ask the Wizard, at the Wizard's default rules; **this number is a placeholder until build-time capture from the hand calculator at our exact rule set — see the rule-sensitivity warning: the H17 figure for the same mistake is 9.39 п.п.**). At a $10 bet: ≈ $0.44 in expectation each time. How often does the situation even come up (6 decks, 312 cards)? `P(4,4) = C(24,2)/C(312,2) = 276/48,516 = 0.569%`; × `P(dealer 6 | player holds 4,4) = 24/310 = 7.74%` → ≈ 0.044% of hands. Per 1,000 hands at $10 that single leak costs ≈ $0.19 — which is the honest lesson the tool teaches: no single error ruins you, the *habit* of erring does.

**Worked example 2 (the habit).** `B = $10`, `H = 80`, session 2.5 h (200 hands), `r = 5%`, `c̄ = 2.5%` of the bet. `Δedge = 0.05 × 2.5% = 0.125 п.п.` Expected loss: perfect play `200 × $10 × 0.42622% = $8.52`; as played `200 × $10 × 0.55122% = $11.02`. Sloppy play costs **+$2.50 per session — a 29% bigger expected loss — and both numbers are losses.** The UI always shows both: there is no setting at which the expected result is a win.

## Data & verification (authoritative source for every constant; how to verify before ship)

Same discipline as `src/data/blackjack-house-edge.ts` (which this repo already verified against Wizard of Odds on 2026-08-27):

- **Authoritative source: Wizard of Odds.** Per-hand EVs: the [Blackjack Hand Calculator](https://wizardofodds.com/games/blackjack/hand-calculator/) at the exact rule set above; cross-check every row against [Blackjack Appendix 9, variant `6ds17r4`](https://wizardofodds.com/games/blackjack/appendix/9/) (six decks, S17, resplit to 4 — EV of every play, per hand vs upcard; **this variant's existence is why the rule set is 6 decks — no 8-deck-with-peek appendix exists**). The correct-action column is additionally cross-checked against BlackjackInfo's chart generator (independent author, Ken Smith).
- **Storage:** new `src/data/blackjack-mistake-cost.ts`, each row carrying `evCorrect`, `evError`, source URL, and retrieval date; raw capture JSON committed to `docs/seo/` alongside the existing `woo-blackjack-matrix-2026-08-27.json`.
- **Ship gate:** every constant present in two independent WoO artifacts (hand calculator + appendix 9 `6ds17r4`) and agreeing to **±0.01 п.п. for stand/hit/double rows; ±0.1 п.п. for split rows** (appendix and calculator can differ methodologically on resplit and post-split strategy) **with the correct-action verdict identical in both**; correct-action column also agreeing with BlackjackInfo. Any disagreement beyond tolerance blocks the row, not gets averaged. *(Review note: automated page extraction of Appendix 9 has been observed returning garbled cell values — capture rows by hand or with a parser whose output is spot-checked against the rendered page, and sanity-check every row against the known basic-strategy chart before commit.)* Situation frequencies are pure combinatorics computed in the module (no external constants) and unit-checked by summing to sensible totals.
- The projector's `edge_base` is **computed** from the existing verified `BJ_BASE_EDGE` and `BJ_DELTAS.decks[6]` — not re-derived, not duplicated as a literal.

## Responsible framing (how the UI copy avoids \"way to win\" reading; what warnings are mandatory)

- The tool's headline verb is **cost**, never *win*, *beat*, *improve your odds*: \"What basic strategy mistakes cost\" / «Сколько стоят ошибки в базовой стратегии».
- **Mandatory line, always visible, not collapsible:** basic strategy is the *ceiling* — it minimizes the loss rate and still loses; the perfect-play expected loss (`L₀`) is rendered in every output next to the as-played number, so the delta is never readable as profit.
- **Mandatory warning block** (same component as the other four tools): no strategy gives the player an edge at blackjack; this page does not teach card counting or any advantage play; expected values are long-run averages — any single session can lose far more.
- The fixed rule set is stated next to every output, with the caveat that other rules change every number on the page (see rule-sensitivity warning — the honest framing depends on it).
- No streaks, no scores, no gamification of the drill kind — this is deliberately a price list, not a game. No links or CTAs toward playing anywhere.
- ES copy gets the same mandatory blocks; the five noindex locales inherit them via `src/i18n/ui.ts` as usual.

## Integration (which articles/briefs link to it, which section, RELATED_TOOL mapping)

- **Section:** blackjack cluster within tools; lives on the existing `/[lang]/tools/blackjack-house-edge/` page (or the strategy article) — no new tools-index entry unless it ships standalone.
- **`RELATED_TOOL`** in `src/pages/[lang]/articles/[slug].astro` already maps `'blackjack-basic-strategy'` → `['tools', 'blackjack-house-edge']` (verified in the file). If the module ships inside the house-edge page: **no mapping change**, but update the 7-language labels to mention the mistake-cost angle (e.g. en: \"Price your table — and your mistakes\"). If it ever ships standalone, the map supports one plate per article; keep the article pointing at whichever page hosts the module.
- Cross-links: house-edge tool ↔ basic-strategy article both directions (article body lives in Sanity — add the link there, no deploy needed); tools index copy for the house-edge entry gains one clause about mistake cost; a FAQ item \"Do basic strategy mistakes really matter?\" in Sanity linking in.
- Note: the module's fixed 6-deck rule set differs from the house-edge calculator's 8-deck benchmark base; the two share the same verified constants file, and each states its own rule assumptions — no user-visible contradiction as long as both labels are explicit.
- Publication/promotion only per the standing rule: only venues whose self-promotion policy has been read and quoted, only where the module genuinely answers a live question (e.g. an existing \"how much do mistakes cost\" thread) — no exceptions.

## Effort estimate (hours, main risk)

- **Skipped trainer, for the record:** 40–60 h (2,700+ verified decision cells, drill UI, i18n × 7). Main risk: teaching a wrong play (critical-grade incident) *and* no ranking path — cost with no payoff.
- **Merge module (recommended):** **8–12 h** — 3–4 h data capture + double-source verification (budget the full 4: the review found WoO's own sources disagreeing across rule sets and automated extraction returning garbled values — capture is the careful part), 2–3 h UI band on the existing page, 2 h i18n × 7, 1–2 h copy + Sanity cross-links + `npx astro check`. Zero-budget compliant: static constants, client-side arithmetic, no quota impact on Sanity.
- **Main risk:** transcription errors in EV constants — mitigated by the two-source ship gate above (now actually satisfiable at the chosen rule set). Secondary risk: the gap queries are genuinely low-volume, so treat the module as cluster reinforcement (internal links, topical depth for the blackjack pages that already rank) rather than a standalone traffic bet — which is also why it must stay at ~10 h, not 40.