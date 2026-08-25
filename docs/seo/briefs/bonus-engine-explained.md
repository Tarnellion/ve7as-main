<!-- approved: True | verifier issues: 12 -->

# Content brief: How the Casino Bonus Engine Works: An Inside View

Slug: `how-casino-bonus-engine-works` · Section: casino-slots · Language: EN first · Extends: `wagering-explained` (deep rewrite pending — coordinate so the two don't overlap; this article owns the *engine mechanics* — weight table, exclusions, enforcement, wallet ledger; that one owns the *math of the requirement* — multiplier arithmetic and cost tables).

## Working titles (3 options, <=60 chars each)

1. How the Casino Bonus Engine Works: An Inside View (49)
2. Sticky vs Non-Sticky Bonuses: The Wallet Ledger View (52)
3. Why Your Bet Didn't Count: Inside the Bonus Engine (50)

## Search intent (one intent, one sentence)

Informational-troubleshooting: a player with an active (or just-declined) bonus wants to understand how the system decides which bets count towards wagering, why some don't, and what sticky vs non-sticky means for the money already in their balance.

## Target queries (primary 1, secondary 3-5, long-tail 5-8)

**Primary:** how do casino bonuses actually work

**Secondary:**
- sticky vs non-sticky bonus
- game weighting casino bonus
- why did my bet not count towards wagering
- max bet rule casino bonus

**Long-tail:**
- what is a sticky bonus in a casino
- non-sticky bonus how does it work
- do table games count towards wagering requirements
- why is roulette excluded from bonus wagering
- bonus balance vs real money which is used first
- what happens if I bet more than the max bet with a bonus
- do live casino games count towards wagering
- do voided or cashed-out bets count towards wagering

## SERP snapshot & our gap

Verified 2026-08-25. The SERP for "sticky vs non-sticky bonus" is entirely conflicted parties: affiliate guides (BonusCheckr, AskGamblers, CasinoGrounds, BonusManiac, Casimonka) and operator blogs (BetMGM, 666 Casino, Dream Jackpot). For "why did my bet not count towards wagering" it's affiliate calculators (next.io, bonus.com, bettingusa.com, legalsportsreport.com) plus a single operator Zendesk help page (Betano) — the only page even structured as troubleshooting is written by the operator whose engine did the excluding.

Three gaps, all ours to take:

1. **Nobody explains the machine.** Every ranking page describes bonus terms from the outside (definitions, "always read the T&C"). None explains what actually happens between bet placement and the progress bar moving: which wallet pays the stake, when contribution is recorded, how exclusions are enforced, what the ledger looks like. Affiliates monetize sign-ups, so their incentive is to make offers look claimable, not to expose why the engine will refuse half your bets. We have a QA engineer who tests these systems for a living.
2. **The SERP is regulation-stale.** Most ranking content predates the UKGC's new rules (in force since 19 January 2026): wagering requirements on GB-licensed offers are now capped at 10x and mixed-product promotions are banned. Pages still presenting "30-50x is normal" are wrong for UK readers and citing the change signals freshness.
3. **No page connects the mechanics to consumer rights** — the CMA principles (you can always exit a promotion with your remaining deposit and deposit winnings; bonus funds must be visibly distinct from cash) are exactly what makes the sticky/non-sticky distinction legally meaningful, and no ranking page draws that line. And the comprehension research (source 6) shows even a 10x-capped offer is systematically underestimated without a worked example — which is precisely the format we ship.

## Reader outcome

After reading, the player can: (a) predict how any given bet will affect their wagering progress before placing it — stake × game weight, subject to max-bet and exclusion rules; (b) diagnose the five common reasons a bet didn't count without contacting support; (c) tell from their balance display and T&C language whether a bonus is sticky or non-sticky, and know that on a GB-licensed site they can always walk away with their remaining deposit plus deposit winnings; (d) estimate the real turnover a bonus demands using our calculator instead of guessing.

## Outline

**AEO requirement: the first two paragraphs must directly answer "how do casino bonuses actually work" —** a bonus is a second wallet with a rule set attached; every settled bet emits an event the engine checks against that rule set (game weight, max bet, exclusions), and only the surviving portion of the stake counts towards wagering. Sticky vs non-sticky is a difference in how that second wallet merges with your cash. No throat-clearing intro about "the exciting world of bonuses."

- **H2: A bonus is a second wallet with rules attached** — The direct-answer section. Define the bonus balance as a separate ledger account governed by a machine-readable rule set (weight table, max bet, excluded games, expiry, wagering target); everything else in the article is those rules firing.
- **H2: One bet's journey through the engine** — The signature insider section; walk a single €1 spin end to end.
  - **H3: Which wallet pays the stake** — Cash-first vs bonus-first consumption order and why the player rarely sees which one was charged; this is where sticky/non-sticky starts mattering.
  - **H3: Settlement, not placement** — Contribution is typically recorded when the bet settles, not when it's placed; explain what that means for sports bets that settle days later, voided bets, and crashed game rounds (insider input Q2 — do not assert the timing as universal until the insider confirms it; if platforms differ, say so).
  - **H3: The contribution calculation** — Progress = stake × game weight, capped and rounded; a €2 blackjack hand at 10% weight moves the counter €0.20 (2 × 0.10 = 0.20 — verified). One worked micro-example here.
- **H2: Game weighting: why slots count 100% and roulette 10%** — Explain the operator's actuarial logic without endorsing it: low-house-edge, low-variance games would let players grind through wagering at minimal expected cost, so they're weighted down or excluded. Link `blackjack-basic-strategy` (basic strategy is *why* blackjack gets weighted low) and the planned `can-casinos-change-rtp` (weights and RTP are cousins). Mandatory Table 1 lives here.
- **H2: Why your bet didn't count: the exclusion list** — The troubleshooting section targeting the question query; structure as one H3 per cause so each can be lifted as a snippet.
  - **H3: You bet over the max-bet limit** — What the rule is for (stops players gambling the whole bonus on one spin to bypass turnover), and how enforcement differs: some engines reject the bet, some accept it and void contribution, some flag it for review at withdrawal — the nastiest variant for players (insider input Q3).
  - **H3: The game is excluded or weighted at 0%** — Jackpot slots, most live casino, often new releases; where to find the list in the T&C. (Writer: verify these exclusion categories against 2-3 current published T&Cs at draft time — do not publish from this brief alone.)
  - **H3: Low-risk coverage betting** — Covering red and black, or most of the table; explain how detection works per insider input Q4 — this is content no affiliate can write. **Guardrail: describe the detection mechanism qualitatively (what classes of pattern are caught, and when — real-time vs at withdrawal). Do NOT publish specific numeric thresholds: a printed threshold is a how-to-evade guide (violates the no-encouragement constraint) and could fingerprint the owner's platform.**
  - **H3: The bet never settled, or settled as void** — Cashed-out sports bets, voided rounds, pushed hands. For sports free-bet minimum-odds rules, link the odds converter tool.
  - **H3: You were playing with cash, not bonus** — On cash-first wallets your first bets may not touch wagering at all; how to tell from the balance display.
- **H2: Sticky vs non-sticky: two ledger designs** — Frame as engineering difference, not "which deal to grab."
  - **H3: Sticky: the bonus fuses into your balance** — Deposit + bonus play as one pot; the bonus amount is deducted at withdrawal; wagering usually applies to the combined pot.
  - **H3: Non-sticky: cash plays first, bonus waits** — Two visibly separate balances; the bonus only activates if the deposit is lost; until then you can withdraw your deposit and its winnings with zero wagering.
  - **H3: What your balance display is legally required to show** — CMA principles: players must be able to distinguish bonus funds from own money and exit a promotion with their remaining deposit at any time; this is where the 2018 enforcement history (Ladbrokes, William Hill, PT Entertainment) gets one paragraph. Mandatory Table 2 lives here.
- **H2: What the regulator changed in 2026** — Scope cap: 150-200 words, framed strictly as *what bounds the values in the rule set the engine enforces* — this page explains the machine, not the regulation (a standalone regulatory explainer is a different article). UKGC: 10x wagering cap and mixed-product ban in force since 19 January 2026, and the consultation record showing requirements previously ran to 60x; MGA's Player Protection Directive as the Malta-license counterpart. Explicitly state jurisdiction scope: the 10x cap is GB-licensed sites only; offers under other licences are not capped and commonly run far higher — **writer must verify the typical non-GB multiples against 2-3 current published offers at draft time; do not print a range from this brief.**
- **H2: How to read bonus terms in five minutes** — A neutral checklist (weight table, max bet, excluded list, expiry, win cap, sticky-or-not wording), ending with the wagering calculator link for the turnover math. Cite the Journal of Gambling Studies finding — over 92% of bettors shown a standard 10x offer without a worked example underestimated the real wagering amount (median estimate £500 vs £750 actual) — as the reason a worked example beats the operator's headline framing.
- **H2: FAQ** — 4-6 Q&As mirroring the long-tail queries verbatim (do live games count; what if I bet over max bet; which balance is used first; do voided bets count). Mark up as FAQPage.

## Insider input required

Questions only the owner (QA/SDET on a casino platform) can answer; the writer must get written answers before drafting the "journey" and "exclusion" sections, and every claim sourced from these answers is published as first-hand experience, generalized — no employer name, no platform-identifying details.

1. When a player holds both cash and bonus balance, what is the exact order of funds consumption on the platforms you've tested — and is it a per-brand/per-jurisdiction configuration or hardcoded?
2. At which event is wagering contribution recorded — bet placement or settlement? What happens to contribution when a bet is voided, cashed out, or a game round crashes and replays?
3. How is the max-bet rule enforced in practice: rejected upfront, accepted-then-voided, or flagged for retrospective review at withdrawal? Which variant do you see most, and what does the player actually see in each case?
4. How is low-risk roulette coverage detected — real-time rules (e.g. share of table covered per spin), retrospective pattern review at withdrawal, or both? (Answers inform the writing; **numeric thresholds stay out of the published article** — see the guardrail in the low-risk-coverage H3.)
5. In the wallet ledger, how does a sticky bonus differ from a non-sticky one — separate ledger accounts, or flags on one balance? What ledger rows appear when a bonus is forfeited, expired, or converted to cash?
6. What happens when a bonus expires or completes mid-game-round — does the round finish on bonus funds, and how are its winnings attributed?
7. For non-sticky bonuses: how does the engine track the boundary between "winnings from deposit" and "winnings after bonus activated" when the CMA-required exit right is exercised?
8. What are the most common bonus-engine defects you catch in QA — contribution rounding, weight-table misconfiguration, currency conversion on multi-currency wallets, race conditions between bet settlement and bonus expiry? One anonymized war story would make the article.

## Primary sources (verified URLs with what each supports)

All 6 URLs fetched and content-verified on 2026-08-25 (not just resolving — claims checked against page text). No affiliate sources.

1. **UKGC — "Gambling promotions to be safer and simpler"** — https://www.gamblingcommission.gov.uk/news/article/gambling-promotions-to-be-safer-and-simpler — Supports: 10x wagering cap and mixed-product promotion ban, in force 19 January 2026. (The Commission's own page originally announced 19 December 2025 and was later updated to 19 January 2026 — which is why some secondary coverage carries the old date. Use 19 January 2026, per the primary.)
2. **UKGC — Consultation response, Proposal 1: ban or limit the use of wagering requirements** — https://www.gamblingcommission.gov.uk/consultation-response/autumn-2023-consultation-proposed-changes-to-lccp-and-rts-socially/proposal-1-ban-or-limit-the-use-of-wagering-requirements — Supports: pre-cap requirements ran up to 60x ("some licensees currently apply up to 60 times wagering requirements" — verified verbatim); why the regulator chose a cap over a ban (risk of restrictive cash-out terms, illegal-market displacement, competition impact); evidence consumers cannot estimate an offer's true value.
3. **CMA/GOV.UK — "Online gambling promotions: dos and don'ts for online gambling firms"** — https://www.gov.uk/government/publications/online-gambling-promotions-dos-and-donts/online-gambling-promotions-dos-and-donts-for-online-gambling-firms — Supports: the consumer-law floor — "allow customers to exit promotions at any time with their remaining deposit, plus any winnings from play with their deposit" and "ensure customers can clearly distinguish between playing with bonus funds and playing with their own money" (both verified verbatim in the Do's).
4. **GOV.UK press release — "Gambling sector told to raise its game after CMA action" (1 Feb 2018)** — https://www.gov.uk/government/news/gambling-sector-told-to-raise-its-game-after-cma-action — Supports: the enforcement history — Ladbrokes Betting & Gaming, WHG (International) Ltd t/a William Hill, and PT Entertainment Services formally committed to changes and the Gambling Commission extended the expectations to all licensees; why modern UK bonus T&Cs look the way they do.
5. **Malta Gaming Authority — Directive 2 of 2018 (Player Protection Directive), v3 Jan 2023, PDF** — https://www.mga.org.mt/app/uploads/Directive-2-of-2018-Player-Protection-Directive.pdf — Supports: the Malta-license counterpart framework (player protection obligations, player-set limits, responsible-gaming tools; note it explicitly permits *excluding* bonuses from player wagering-limit calculations — a precise, citable contrast with wagering-requirement mechanics). Writer note: 25-page PDF; verify exact article numbers against the text before citing a specific clause.
6. **Torrance, Wright, Newall, Crawford, Quigley & Dymond, "(Mis)Comprehension and (Mistaken) Attractiveness of Financial Gambling Inducements among UK Bettors", Journal of Gambling Studies, 2026 (open access)** — https://link.springer.com/article/10.1007/s10899-026-10491-6 (DOI: https://doi.org/10.1007/s10899-026-10491-6) — Supports: in a randomized experiment with 585 UK bettors, **over 92% of the control group (n=291 — shown a standard 10x offer without a worked example) underestimated the real wagering amount** (median estimate £500 vs £750 actual); displaying a worked example significantly reduced perceived attractiveness (M = 2.39 vs 3.75) — the empirical justification for our worked-example-plus-calculator approach. **Cite it precisely: the 92% is of the no-worked-example group, not of all 585 participants.** Link-checker note: the URL answers with a 303 through idp.springer.com (cookie check) before serving the article — it is live and open access, not dead.

## Tables & visuals

- **Table 1 (mandatory), in the game-weighting H2:** typical contribution weights — slots ~100%, table games/roulette ~5-20%, blackjack ~5-10%, live casino 0-10%, jackpot slots often 0%/excluded. Label clearly as *typical ranges compiled from published operator terms — always check the specific T&C*; do not attribute to any named casino. **Writer verification required: these ranges are a starting point, not verified data — check them against at least three currently published operator T&Cs at draft time and adjust before the table ships.**
- **Table 2 (mandatory), in the sticky/non-sticky H2:** side-by-side comparison — what wagering applies to; whether the deposit is withdrawable mid-promotion; what happens to the bonus amount at withdrawal; how the balance is displayed; typical T&C wording that identifies each type.
- **Figure (mandatory): "one bet's journey" flow diagram** — bet placed → wallet selection (cash/bonus) → settlement → excluded? max-bet breach? low-risk pattern? → weight lookup → contribution added → progress counter. Built from insider input answers; this is the shareable asset no competitor has.
- **Worked example box:** €100 deposit + €100 bonus at 10x **bonus-only** wagering. Correct numbers (recomputed for this brief — do not vary without redoing the math): required turnover = 10 × €100 = **€1,000**; expected cost of clearing = turnover × weighted average house edge, e.g. €1,000 × 4% = **€40** (state the house-edge assumption in the box). **Basis warning for the writer:** if the offer wagers deposit + bonus (common on sticky offers), the same 10x means 10 × €200 = **€2,000** — the box must say which basis it uses, because conflating the two is exactly the error the source-6 study documents. Immediately follow with the live tool link: /en/tools/wagering-calculator/ ("run your own numbers"). This is the article's primary tool placement.
- **Optional:** annotated mock of a generic balance display (cash vs bonus balance) — must be an obviously generic mock, no real operator UI.

## Internal linking

**Out (live articles/tools):**
- `wagering-explained` — anchor "wagering requirements and how the multiplier works"; from the weighting H2. Coordinate with the pending rewrite: that article owns the multiplier math and cost tables, this one owns the weight table and engine enforcement — write that boundary into the rewrite's brief.
- /en/tools/wagering-calculator/ — from the worked example box and again from the five-minute checklist H2.
- /en/tools/odds-converter/ — from the "bet never settled / minimum odds" H3 (sports free bets); treat as available.
- `blackjack-basic-strategy` — anchor "basic strategy brings the house edge under 1%"; from the weighting H2 (it's the reason blackjack is weighted low).
- `bankroll-management` — anchor "treat a bonus as playtime, not income"; from the checklist H2.
- `how-to-choose-casino` — anchor "transparent bonus terms as a selection signal"; one link, closing section.
- `how-to-develop-igaming-slots` — only if a natural anchor arises in the weighting section. **PRE-PUBLICATION BLOCKER: the live slug ends with an invisible U+2060 character and the clean URL 404s. Do not ship a link to this article until the slug is fixed in Sanity. Editor must verify the fix before publish.**

**Out (planned articles from approved briefs — add as links when they go live, placeholder anchors in draft):**
- `can-casinos-change-rtp` — from the weighting H2 ("game weights and RTP are set in different places").
- `what-casino-sees-player-data` — from the low-risk-coverage H3 ("how pattern detection sees your betting").
- `kyc-from-inside` — from the sticky/withdrawal H3 ("what else happens when you press withdraw").
- `how-slots-are-tested` — from the "journey through the engine" H2 ("how platform features like this get tested").

**In (add anchors pointing here):**
- From the `wagering-explained` rewrite: "how the engine tracks each bet" → this article (make it a requirement of that rewrite's brief).
- From `how-to-choose-casino`: in its bonus-terms paragraph.
- From `bankroll-management`: where bonuses are mentioned as "not extra money."

## Schema & metadata

- **Title tag (49 chars):** How the Casino Bonus Engine Works: An Inside View
- **Meta description (135 chars):** How a bonus engine tracks every bet: game weighting, excluded bets, max-bet rules, and sticky vs non-sticky — from inside the platform.
- **Schema:** Article (with `author` carrying the site's standard insider-credentials byline — "tests casino platform software as a QA engineer"; no employer name) + FAQPage for the FAQ H2 only. Both go through the template's `jsonLd()` — no hand-rolled script tags.
- **Section placement:** casino-slots.

## Length & tone

2,000-2,500 words body (tables and FAQ on top of that). Explanatory and dry-eyed — the register of an engineer describing a system they test, not a fan and not a scold. Second person is fine. Define every term at first use (wagering, contribution, weight, sticky). Insider claims framed as "on platforms I've tested / in systems like these," always generalized. British English (UK regulatory frame dominates the sources). Numbers over adjectives: "weighted at 10%" beats "counts much less."

## What NOT to do

- **No operator names as examples of good/bad terms**, no "best non-sticky casinos" framing, no bonus codes, no linking to any offer. One named operator turns this from journalism into affiliate content. (The 2018 CMA enforcement names — Ladbrokes, William Hill, PT Entertainment — are the one exception: they appear only as documented regulatory history with the GOV.UK citation, never as term examples.)
- **Never frame non-sticky as "the better deal to grab"** — the correct frame is "the less restrictive design." Any sentence that reads as advice to claim bonuses is commercial drift.
- **No "how to clear wagering faster" or +EV angles.** Explaining why low-weight games exist is fine; suggesting game selection to beat the requirement is advantage-play coaching and violates the no-encouragement constraint.
- **No published detection thresholds.** Describing that low-risk-pattern detection exists and how it's enforced is journalism; printing the numeric threshold is an evasion manual and a platform fingerprint. Keep insider Q4 answers qualitative in the published text.
- **Do not present the 10x cap as global.** It binds GB-licensed operators only; sloppy generalization would make the article factually wrong for most readers.
- **Do not duplicate the responsible-gambling block** — the template appends it automatically.
- **No expected-value framing that implies profitability.** The only EV math allowed is expected *cost* of clearing wagering (matches the calculator's framing).
- **No close paraphrase** of BonusCheckr/AskGamblers/BetMGM structures or examples; the £/€ worked examples must be our own numbers.
- **Nothing that could identify the owner's employer or platform** — generalize all insider details; the owner reviews the final draft for this specifically.

## Success metric

Review checkpoints, not targets — no ranking or timeline guarantees:

- **Pre-publish:** every insider-sourced claim confirmed in writing by the owner; all 6 primary-source URLs re-checked (note: source 6 legitimately answers via an idp.springer.com redirect — not a dead link); Table 1 weight ranges and the non-GB wagering-multiple claim verified against current published T&Cs; the source-6 statistic cited as 92%-of-control-group, not 92%-of-all-respondents; the U+2060 slug defect either fixed or the slots-article link removed; commercial-drift and threshold-leak pass done against the "What NOT to do" list.
- **Week 2:** page indexed (GSC URL inspection); impressions beginning to register for primary and secondary queries; wagering-calculator link receiving clicks from the article.
- **Week 6:** review GSC question-query impressions ("why did my bet not count…", "sticky vs non-sticky") — check whether the direct-answer paragraphs and FAQ are being pulled into snippets/AI overviews; adjust H3 phrasing if not.
- **Week 12:** click-through review vs comparable articles; add in-links from `wagering-explained` rewrite when it ships; schedule a regulatory freshness check (UKGC/MGA) for the next quarterly content review.