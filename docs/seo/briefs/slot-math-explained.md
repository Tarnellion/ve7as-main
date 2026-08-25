<!-- approved: True | verifier issues: 12 -->

# Content brief: Hit Frequency, RTP and Volatility: Slot Math Explained

Section: **casino-slots**. New URL: `/en/casino-slots/` archive, article at `/en/articles/hit-frequency-rtp-volatility/`.

## Working titles (3 options, <=60 chars each)

1. Hit Frequency, RTP and Volatility: Slot Math Explained (54)
2. Why Two Slots With the Same RTP Feel Completely Different (57)
3. Slot Math Explained: RTP, Hit Frequency and Volatility (54)

## Search intent (one intent, one sentence)

Informational: the reader has seen two or three of these terms (usually \"RTP\" plus one other) used interchangeably or in isolation and wants one clear explanation of what each number actually measures, how they relate, and why they don't predict what a session feels like.

## Target queries (primary 1, secondary 3-5, long-tail 5-8)

**Primary:** slot hit frequency vs rtp

**Secondary:**
- what is hit frequency in slots
- slot volatility vs variance difference
- rtp vs volatility slots
- what is a par sheet slot machine

**Long-tail:**
- why do two slots with the same rtp feel different
- does high rtp mean frequent wins
- can a slot have high rtp and low hit frequency
- is volatility the same as variance in slots
- what does 20% hit frequency mean in slots
- how do slot developers set hit frequency
- what information is on a slot par sheet
- how is slot volatility determined

## SERP snapshot & our gap

Re-verified 2026-08-25 (reviewer spot-checked the primary query the same day; competitor set confirmed). The SERP for the primary query is: PokerNews glossary entry (definition-only, no math model context), three content farms (lightloom.co.uk, socketguide.com, oureverydaylife.us — thin pairwise \"X vs Y\" articles), marvn.ai and icon-era.com (AI-flavored aggregator content). The variance-vs-volatility query returns casino-brand blogs (BetMGM, Paddy Power, AskGamblers, 7bet) that all end in \"pick your slot\" CTAs, and several openly contradict each other on whether variance and volatility differ. The \"what is hit frequency\" SERP is thin enough that raw USPTO patent PDFs rank — a strong signal no one has written the authoritative page.

**Nobody in the SERP:** (a) connects all three parameters in a single explainer, (b) explains where the numbers come from (the game's math model / PAR sheet), (c) writes from inside the industry, or (d) does it without pushing games or operators. Our piece does all four. The pattern-breaker: everyone answers \"what do these words mean\"; we answer \"who sets these numbers, in what document, and why the one number you're usually shown (RTP) is the least predictive of how a session feels.\"

**Caution inherited from SERP analysis:** the \"20-35% typical hit frequency\" figure that circulates in these competitor pages appears in none of our primary sources and is contradicted by two of them (see Hit frequency section below). Do not repeat it.

## Reader outcome

After reading, the reader can open any slot's help screen and correctly interpret what the RTP figure does and does not promise, understand why a 96% RTP slot can still eat a balance in 40 spins, know that hit frequency and volatility are deliberately engineered values recorded in a design document (PAR sheet) that players never see, and treat \"high RTP\" marketing claims with informed skepticism. The reader makes no decision about where or whether to play — this is pure literacy.

## Outline

AEO requirement: the first two paragraphs must directly answer the primary query — all three definitions and the one-line relationship — before any preamble. A featured-snippet-ready formulation: \"RTP measures how much a slot pays back on average over millions of spins. Hit frequency measures how often any winning combination lands. Volatility measures how unevenly the payback is distributed — many small wins or rare large ones. Two slots with identical RTP can have completely different hit frequency and volatility, because an average says nothing about its distribution.\"

**H2: Three numbers, three different questions** (the direct answer, expanded)
Para 1-2 = the direct answer above. Then one short paragraph: RTP is the number players most often get to see — under UKGC RTS 3C an operator must make available a description of how the game works plus the house edge (or margin), the RTP percentage, **or** the probability of winning events; hit frequency and volatility are on no disclosure list at all and stay inside the design documentation. That asymmetry is the article's thread. (Precision matters: RTS 3C does not mandate RTP specifically — it mandates RTP *or equivalent odds information*. Do not write \"operators are required to publish RTP.\")

**H2: RTP: the long-run average**
- H3: What 96% actually means — per-spin expected value, not a session promise. Explain convergence honestly: a session of 200 spins is nowhere near \"the long run.\"
- H3: What RTP is not — not a prediction, not a per-player guarantee, not constant across markets (one sentence, then link out to the planned can-casinos-change-rtp article; do not expand here).

**H2: Hit frequency: how often anything lands**
- H3: Definition, and why \"typical\" numbers are slippery. Use only sourced figures: the AFM education page states slot hit frequency can be **as low as 3%**, while video poker sits near 45%; Harrigan & Dixon's real PAR sheets show Lucky Larry's Lobstermania at **5.2% per line** (96.2% RTP version) and **4.9% per line** (85.0% version). Crucial nuance from H&D: PAR sheets state the math **for one line only** — on a 15-line game the per-spin \"anything landed\" rate is far higher than the per-line rate, which is why online marketing figures look so much bigger than PAR-sheet figures. If the writer wants to state a typical range for modern online slots, that number must come from the owner's verification or be omitted — no listed source supports one. Do NOT write \"typically 20-35%\"; that figure comes from the content farms we refuse to source.
- H3: The catch: a \"hit\" includes wins smaller than the stake. Ground in Harrigan & Dixon's computer analysis: a player wagers $0.75 across 15 lines, wins $0.45 — a net loss of $0.30 that the machine presents as a win. For contrast, cite the AFM page's video-poker example — at ~45% hit frequency, \"in almost half of those 'hits,' the player just wins back his original bet\" (attribute this to video poker, as the source does — do not transplant it onto slots). The section's key insight stands: high hit frequency is a sensation, not a return. (The catchy term \"losses disguised as wins\" was coined in later research by the same Waterloo lab — Dixon et al. 2010 in *Addiction*; the writer may use the term only if that paper is added to sources after verification. H&D 2009 alone supports the mechanism, not the term.)

**H2: Volatility: the shape of the payback**
- H3: Volatility = spread of the payout distribution around the RTP mean. The industry artifact is the **volatility index (VI)** recorded on PAR sheets — Harrigan & Dixon define it as \"an indication of how much the game's payback percentage will vary for a given number of games played.\" Keep the statistics at \"same average, different spread\" level with the figure (see Tables & visuals); put anything heavier in a collapsible aside if the template allows. (How exactly VI is computed — the standard-deviation/confidence-interval derivation — is on the owner-verification list; do not assert a formula from memory.)
- H3: Variance vs volatility — be honest: mathematically variance is the statistical measure and volatility the industry shorthand, but in practice the industry uses them interchangeably, and no public \"low/medium/high\" label follows a standard scale. Correcting the SERP's fake distinctions is part of our credibility.

**H2: Where the numbers come from: the math model and the PAR sheet**
- H3: What a PAR sheet specifies — reel strips, symbol weights (virtual reels), paytable, hits per winning combination, total RTP, hit frequency, volatility index, max win exposure. Ground in Harrigan & Dixon (who obtained real PAR sheets under Ontario's Freedom of Information and Protection of Privacy Act) and GLI-11's documentation requirements (paytable listings, symbol frequency). One honest nuance from H&D: in their sample only the mechanical-reel games' PAR sheets carried a volatility index — coverage varies by manufacturer and era.
- H3: How the three parameters are traded off when a model is tuned — the insider section. The RTP budget is allocated across base game, features and jackpot contributions; hit frequency and volatility are then shaped by symbol weighting and prize laddering within that fixed budget. Written from the owner's platform-QA perspective (see Insider input). Link to how-to-develop-igaming-slots here (see the slug-defect blocker in Internal linking).

**H2: Why two slots with identical RTP feel completely different**
The centerpiece. Use the verified worked example below (Table 2) — both slots at exactly 96.00% RTP, machine-checked. Then two documented proofs from the industry's own paper trail:
1. US Patent 10,223,873 B1 (ASP Gauselmann): reel strip sets engineered with different hit rate frequencies while keeping \"identical or nearly identical return to player (RTP) values\" — same RTP, different hit frequency, by design.
2. The inverse, from Harrigan & Dixon's real PAR sheets: two Lobstermania versions at 85.0% and 96.2% RTP whose hit frequencies barely differ (4.9% vs 5.2%) — wildly different RTP, near-identical feel. Together they prove the two parameters are tuned independently.

**Verified worked example (writer: reproduce as Table 2; owner: sign off pre-publication):**

Slot A — \"steady drip\": hit frequency 30.0%, top prize 25x stake.

| Payout (x stake) | Probability per spin | Contribution to RTP |
|---|---|---|
| 0.5x | 0.06 | 0.030 |
| 1x | 0.09 | 0.090 |
| 2x | 0.07 | 0.140 |
| 5x | 0.05 | 0.250 |
| 10x | 0.02 | 0.200 |
| 25x | 0.01 | 0.250 |
| **Total** | **0.30 (30% hit freq)** | **0.960 (96.0% RTP)** |

Slot B — \"long wait\": hit frequency 15.0%, top prize 520x stake.

| Payout (x stake) | Probability per spin | Contribution to RTP |
|---|---|---|
| 1x | 0.100 | 0.100 |
| 2x | 0.030 | 0.060 |
| 8x | 0.015 | 0.120 |
| 40x | 0.004 | 0.160 |
| 520x | 0.001 | 0.520 |
| **Total** | **0.150 (15% hit freq)** | **0.960 (96.0% RTP)** |

Derived talking points (all machine-verified): in Slot A, half the hits (0.15 of 0.30) pay the stake or less; the top prize carries 26% of the RTP. In Slot B, two-thirds of hits merely return the stake, and the 520x prize alone carries 54% of the RTP — it lands on average once in 1,000 spins, so about 90% of 100-spin sessions never see it (0.999^100 ≈ 0.905), and in those sessions the game's remaining math pays back only 44%. Same 96%, completely different session. State plainly that both slots are hypothetical.

**H2: Verified but not shown: the disclosure gap**
Keep this section strictly about the asymmetry — what an accredited lab verifies versus what a player ever sees. GLI-11 requires the math model and paytable documentation to be submitted and verified; UKGC RTS 3C requires operators to make available a game description plus house edge, RTP or win probabilities; RTS 7 requires statistically random outcomes and prohibits adaptive/compensated behavior. Point out plainly: hit frequency and volatility are typically verified but appear on no player-facing disclosure list. One paragraph maximum on the testing process itself — the depth belongs to the planned how-slots-are-tested and rng-certification-explained articles; link both here.

**H2: Reading a help screen with this knowledge**
Practical literacy walkthrough: where RTP appears, what a \"volatility: high\" badge can and cannot tell you (no standard scale), what is absent (hit frequency, distribution). One contextual sentence on why volatility matters when a bonus has wagering requirements, linking wagering-explained and the wagering calculator — one sentence, no bonus talk beyond that.

**H2: FAQ**
4-5 questions lifted verbatim from the long-tail list (does high RTP mean frequent wins; is volatility the same as variance; what does 20% hit frequency mean; can a slot have high RTP and low hit frequency). Two-to-four-sentence answers, each self-contained for AEO. For the 20% question: one winning spin in five *on average, as a long-run rate, not a schedule* — and specify whether per spin or per line is meant, since PAR sheets count per line.

## Insider input required

Questions only the owner (QA/SDET on an online casino platform) can answer; his answers become the attributed first-person passages. Anonymize everything — no employer, provider or game names.

1. When a provider delivers a game for platform integration, which math parameters are actually visible to platform-side QA — RTP configuration, a volatility label, hit frequency — and which never leave the provider?
2. Is \"volatility\" in real integration payloads a number (an index) or just a marketing label, and who supplies the low/medium/high wording shown to players?
3. Have you handled games shipped with multiple certified RTP configurations, and what does selecting one look like from the platform side? (One anonymized sentence — the depth belongs to can-casinos-change-rtp.)
4. How does platform QA verify a declared RTP in practice — provider certificates, lab reports, simulation runs? What sample sizes make a simulation meaningful, and what do you do when a short test run comes back at 91% on a 96% game?
5. Can you give one anonymized example of two games with the same RTP whose test-session statistics looked completely different, and what specifically differed (hit rate, balance curve, max drawdown)?
6. Have you ever seen a help-screen RTP mismatch the backend configuration during testing, and what is the process when that happens?
7. When a provider updates a game's math model, what triggers recertification, and what does the platform re-test?
8. Is hit frequency ever exposed in platform APIs or reporting, or is it purely internal to the provider's math documentation? When providers do state it, is it per spin or per line?

**Facts the owner must verify pre-publication (flagged, not asserted in the draft):**
- The Table 2 numbers as published (reviewer machine-verified the arithmetic on 2026-08-25: both columns sum to exactly 30.0%/96.0% and 15.0%/96.0%; re-check after any edit).
- Whether a defensible \"typical hit frequency\" range for modern online slots exists in documentation he can see; if not, the article states only the sourced figures (3%, 4.9-5.2% per line, ~45% video poker).
- How the volatility index is actually derived in certification documents (standard deviation / confidence interval) — only publish the derivation if he can confirm it from documents he has seen.
- The \"20% hit frequency = one winning spin in five, as a long-run rate, not a schedule\" phrasing.

## Primary sources (verified URLs with what each supports)

All URLs fetched and verified resolving 2026-08-25 by the reviewing agent; verification notes below are from that pass.

1. **GLI-11: Gaming Devices in Casinos, v3.0 (Gaming Laboratories International)** — https://gaminglabs.com/wp-content/uploads/2018/09/GLI-11-Gaming-Devices-V3-0.pdf — resolves as a valid PDF; the PDF itself is encryption-protected, and GLI's own standards page (https://gaminglabs.com/gli-standards/) confirms v3.0 as the current version at exactly this URL. Supports: what math/paytable documentation a game must ship with; what an accredited lab verifies. Writer should quote from the PDF opened in a viewer, not from memory.
2. **Harrigan, K.A. & Dixon, M. (2009), \"PAR Sheets, probabilities, and slot machine play: Implications for problem and non-problem gambling,\" Journal of Gambling Issues 23, 81-110, DOI 10.4309/jgi.2009.23.5** — https://cdspress.ca/wp-content/uploads/2022/08/Kevin-A.-Harrigan-Mike-Dixon-.pdf — full text verified (title, authors, DOI, page range extracted from the file; cdspress.ca is JGI's current publisher). Supports: PAR sheets obtained under Ontario's FOI Act; what a PAR sheet contains including the volatility index; Lobstermania versions at 85.0%/96.2% RTP with hit frequencies 4.9%/5.2%; per-line vs per-spin hit frequency; wins below the wager displayed as wins ($0.75 wager / $0.45 \"win\"). NOTE: the paper never uses the phrase \"losses disguised as wins\" — cite it for the mechanism, not the term.
3. **UK Gambling Commission, Remote gambling and software technical standards (RTS)** — https://www.gamblingcommission.gov.uk/print/remote-gambling-and-software-technical-standards (canonical page: https://www.gamblingcommission.gov.uk/standards/remote-gambling-and-software-technical-standards, last updated 31 October 2025) — verified; RTS 3C requires easily available information including a description of how the game works and \"house edge (or margin), the return to player (RTP) percentage or the probability (likelihood) of winning events occurring\"; RTS 7 covers generation of random outcomes and prohibits compensated/adaptive games. Supports: what must be made available to players vs what stays internal. Remember: 3C is an OR-list — do not claim RTP disclosure specifically is mandatory.
4. **US Patent 10,223,873 B1, \"Variable symbol sets for variable win frequency gaming\" (ASP Gauselmann GmbH)** — https://patents.google.com/patent/US10223873B1/en — verified, phrasing confirmed verbatim: reel strip sets may have \"identical or nearly identical return to player (RTP) values\" while hit rate frequency varies. Supports: documented engineering of hit frequency independent of RTP. Cite as evidence the technique exists in filings, not as a claim about any specific live game.
5. **Get Gambling Facts, \"Return to Player (RTP) and Hit Frequency\" (Addictions Foundation of Manitoba)** — https://getgamblingfacts.ca/how-gambling-really-works/return-to-player-rtp-and-hit-frequency-what-do-these-mean/ — verified; public-health education resource, zero casino promotion. Supports: plain-language definitions; \"Some slots have a hit frequency as low as 3%, while other games, such as video poker, have a hit frequency of almost 45%\"; the \"almost half of those 'hits'\" line refers to video poker — attribute it as such.

**Optional source, add only after verification:** Dixon, Harrigan et al. (2010), \"Losses disguised as wins in modern multi-line video slot machines,\" *Addiction* — needed only if the writer wants to use the coined term; the URL was not verified in this brief and must be fetched and checked before citing.

Do not source from the SERP competitors (PokerNews, casino-brand blogs, content farms) — not even for definitions, and especially not for \"typical hit frequency\" figures.

## Tables & visuals

- **Table 1 (mandatory) — \"The three parameters at a glance\":** rows = RTP, hit frequency, volatility; columns = what it measures / unit / who sets it and where it's recorded (math model → PAR sheet) / where a player can see it / what it cannot tell you.
- **Table 2 (mandatory) — the worked example:** reproduce the verified Slot A / Slot B model from the outline (probabilities, payouts, contributions, totals). Both columns must still sum to exactly 30.0%/96.0% and 15.0%/96.0% after any editorial change; owner signs off. Add the derived rows: share of hits at or below stake (50% vs 67%), share of RTP in the top prize (26% vs 54%), what 100 spins typically look like (~30 hits vs ~15 hits, and ~90% of Slot B sessions never seeing the top prize).
- **Figure (mandatory) — \"Same average, different spread\":** two payout-distribution curves with the same mean, one narrow, one long-tailed. Draw in-house in the site style; no stock images, no provider screenshots.
- **Table 3 (optional) — \"What a PAR sheet specifies\":** field → what it defines, distilled (not copied) from Harrigan & Dixon.
- **Live tool:** one contextual link to `/en/tools/wagering-calculator/` in the help-screen section (volatility × wagering cost sentence). The odds converter and margin calculator are sports-side tools — do not force them in.

## Internal linking

**Outbound (existing articles):**
- `how-to-develop-igaming-slots` — anchor \"how slot games are developed\" in the PAR sheet section. **PRE-PUBLICATION BLOCKER: the live slug ends with an invisible U+2060; the clean URL 404s until it is fixed in Sanity. Do not publish this article with the link until the slug is fixed and the clean URL returns 200.**
- `bankroll-management` — anchor \"sizing a bankroll\" in the volatility section (volatility is the reason bankroll math exists).
- `wagering-explained` — anchor \"wagering requirements\" in the help-screen section, alongside the calculator link. (Note: this article has a deep rewrite pending; link the slug, not specific claims from its current text.)
- `how-to-choose-casino` — optional anchor \"transparent operator information\" in the disclosure-gap section.

**Outbound (approved briefs, link as they publish — leave writer's placeholders):**
- `can-casinos-change-rtp` — in the \"What RTP is not\" H3 (multiple certified RTP configurations).
- `how-slots-are-tested` — in the disclosure-gap H2.
- `rng-certification-explained` — at the RTS 7 / randomness mention.

**Inbound (add after this article publishes):**
- From `how-to-develop-igaming-slots`: anchor \"hit frequency, RTP and volatility\" in its math-model passage.
- From `bankroll-management`: anchor \"slot volatility\" where it discusses swings.
- From `wagering-explained` during its pending rewrite: anchor \"game volatility\" where wagering cost is discussed.

## Schema & metadata

- **Meta title (54 chars, verified):** Hit Frequency, RTP and Volatility: Slot Math Explained
- **Meta description (154 chars, verified):** Hit frequency, RTP and volatility measure three different things. We explain how a slot's math model sets each one, and why same-RTP slots feel different.
- **Slug:** `hit-frequency-rtp-volatility`
- **Schema:** Article (template default). If the template supports FAQPage markup, apply it to the FAQ H2 only — answers must match on-page text exactly. No HowTo schema (this is not a how-to and must not be framed as one).

## Length & tone

2,000-2,600 words (excluding tables and the template's responsible-gambling block). Plain, precise, unhurried — an engineer explaining a system, not a blogger selling excitement. Definitions first, evidence second, opinion almost never. First-person only in the clearly attributed insider passages (\"On the platform where I work in QA...\"). Body text at roughly grade 9-10 reading level; the statistics stay at \"average vs spread\" depth, with any heavier math in an aside. No exclamation marks, no \"exciting\", no \"thrilling\", no win-adjacent adjectives.

## What NOT to do

- No \"best high-RTP slots\" or \"best low-volatility slots\" lists, no game, provider or operator names as recommendations, no links to casinos. The Gauselmann patent is cited as a document, not as commentary on that company's live games; Lobstermania is cited only as the published subject of Harrigan & Dixon's peer-reviewed analysis, never as a recommendation or a claim about any currently deployed version.
- Never frame volatility or hit frequency knowledge as a way to win, \"beat\", or \"outsmart\" a slot, or volatility choice as a strategy with an edge. The honest framing: all three numbers describe how you lose over time, not how to win.
- Do not write \"96% RTP means you get 96% back\" — that per-session misreading is exactly what the article corrects.
- Do not invent a crisp variance-vs-volatility distinction to sound authoritative (several SERP competitors did); state the loose industry usage honestly.
- Do not state a \"typical 20-35% hit frequency\" or any typical range not backed by a listed source or the owner's verified input.
- Do not attribute the video-poker \"almost half of hits return the bet\" statistic to slots, and do not attribute the term \"losses disguised as wins\" to Harrigan & Dixon 2009.
- Do not copy or closely paraphrase PokerNews or any competitor definitions; do not reproduce Harrigan & Dixon's tables — distill in our own structure with attribution.
- Do not state specific live games' hit frequencies or volatility indices as fact; use the clearly hypothetical Slot A / Slot B for anything beyond the sourced Lobstermania figures.
- Do not include any responsible-gambling paragraph — the template appends it automatically.
- Insider passages must contain no employer, provider, game names, or confidential figures — anonymized patterns only.

## Success metric

No ranking or timeline guarantees; review checkpoints instead.

- **Pre-publication:** Table 2 math re-verified by owner after any edit (columns must sum exactly); the four flagged facts in Insider input resolved (verified, rephrased, or cut); all five source URLs re-checked (200); how-to-develop-igaming-slots slug fix confirmed before its link ships; no commercial-drift phrases (checklist above) in final copy.
- **+4 weeks:** page indexed; Search Console shows impressions for the primary and at least two secondary queries; check whether the direct-answer paragraphs are being picked as a snippet, and adjust the first 120 words if not.
- **+8-12 weeks:** review which long-tail queries accrued impressions; compare CTR and engaged time against the casino-slots section average; add inbound links from can-casinos-change-rtp and how-slots-are-tested as they publish.
- **Quarterly:** re-verify the five source URLs still resolve; re-check UKGC RTS for amendments (page last updated 31 October 2025 at review time) and update the disclosure section if RTS 3C wording changes; re-check GLI's standards page in case GLI-11 moves past v3.0.