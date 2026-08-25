<!-- approved: True | verifier issues: 9 -->

# Content brief: Blackjack house edge by table rules

Section: poker-table-games. Extends the existing `blackjack-basic-strategy` article. SERP and all source URLs re-verified 2026-08-25.

## Working titles (3 options, <=60 chars each)

1. Blackjack House Edge by Rules: What Each Rule Costs (51)
2. How Blackjack Table Rules Set the House Edge (44)
3. 6:5, H17, DAS: What Blackjack Rules Cost in House Edge (54)

## Search intent (one intent, one sentence)

Informational: the reader wants to understand how each specific blackjack table rule (payout ratio, soft 17, DAS, decks, surrender, splitting) changes the house edge, and by exactly how much.

## Target queries (primary 1, secondary 3-5, long-tail 5-8)

**Primary:**
- blackjack house edge by rules

**Secondary:**
- 6:5 vs 3:2 blackjack difference
- dealer hits soft 17 house edge
- DAS blackjack meaning
- how many decks blackjack house edge
- blackjack house edge calculator (tool intent — captured now by the master table, later by our planned calculator)

**Long-tail:**
- how much does 6:5 blackjack increase the house edge
- what does H17 mean in blackjack
- is single deck blackjack better odds than 6 deck
- double after split house edge effect
- late surrender blackjack house edge
- resplit aces house edge
- why do casinos offer 6:5 blackjack
- european no hole card rule house edge

## SERP snapshot & our gap

Verified 2026-08-25 across the four seed queries:

- **"blackjack house edge by rules"**: Wizard of Odds calculator (a tool, not an explainer), lasvegasadvisor.com, casino.org blog, blackjackreview.com, cachecreek.com (a casino's own marketing page), hardrock.bet (operator), and — confirming the earlier sweep — **speedwaymedia.com**, a motorsport junk domain that published an on-topic blackjack-house-edge piece dated 2026-08-14. A math topic is being held by non-math pages.
- **"6:5 vs 3:2"**: operator blogs (BetMGM, LeoVegas, Station Casinos), affiliate sites (blackjackinfo, blackjackdoc, covers.com), and another junk domain (betting-data-lab.com). Numbers across these pages are rounded inconsistently (the same rule is quoted as +1.4%, "3× higher", "400% increase") and most pivot into play-here CTAs.
- **"dealer hits soft 17"**: PokerNews glossary, mikeaponte.com, Wizard of Odds Q&A archive, dealer-training and operator blogs.

**Our gap:** no ranking page combines (a) exact per-rule deltas from a verifiable mathematical source, (b) the *mechanism* — why each rule moves the edge, not just the number, and (c) zero commercial motive. Wizard of Odds has the math but as reference tables for people who already understand the game; the explainer positions are held by pages with affiliate or operator incentives. We win on E-E-A-T by being the neutral explainer that shows its arithmetic, and later by hosting the only calculator on a non-affiliate domain.

## Reader outcome

After reading, the reader can look at any table placard or online game's help screen, identify the five rules that matter, and estimate that game's house edge to within about 0.1 percentage point — and can correctly rank any two rule sets by expected cost (e.g., knows that single-deck 6:5 is *worse* than 8-deck 3:2 despite the "single deck" marketing).

## Outline

AEO requirement: the first two paragraphs must directly answer the primary query — blackjack's house edge under basic strategy runs from roughly 0.3% to about 2% depending entirely on table rules; the single biggest lever among rules casinos actually offer is the blackjack payout (6:5 instead of 3:2 adds ~1.4 percentage points); after it, in order of realistic magnitude: deck count, H17, doubling restrictions (9–11 or 10–11 only), then DAS and surrender. (On paper a total ban on doubling costs even more than 6:5 — 1.48 pp — but it is essentially never seen on a real placard or help screen; give it one clause as the extreme case, never let it lead the ordering.) Include the compact "top levers" list in paragraph two, before any theory.

- **H2: The short answer: the rules set the edge, and one rule dominates**
  The two AEO paragraphs above, plus a 5-row mini-table of the biggest levers with their deltas. No preamble about the history of blackjack.
- **H2: What "house edge" actually measures at a blackjack table**
  Define it precisely: expected loss per *initial* bet, assuming correct basic strategy for that rule set. One paragraph distinguishing per-initial-bet edge from "element of risk" (per total money wagered, including doubles/splits) — competitors conflate these, which is where their contradictory numbers come from. Link to `blackjack-basic-strategy` here: every number in this article assumes the reader plays it.
- **H2: The baseline game and how to read the deltas**
  State our reference rule set (6 decks, S17, DAS, resplit to 4, no surrender, 3:2, dealer peeks) and its edge from the Wizard of Odds calculator. Explain that per-rule deltas are additive to a good approximation and against which baseline they are quoted (WoO's published deltas use 8 decks, S17, DAS, split to 4 — the writer must not mix baselines; see Expert verification).
- **H2: Blackjack payout: 3:2 vs 6:5 (and worse)**
  The headline number: 6:5 costs the player ~1.39 pp (WoO, verified). Show the mechanism, not just the number: a natural occurs ~4.75% of hands (6 decks); each one pays 0.3 units less at 6:5; 0.0475 × 0.3 ≈ 1.4 pp. This 3-line derivation is our differentiator — no ranking page shows it. Mention 1:1 and 7:5 variants exist and how to compute their cost the same way. Note the regulatory angle: New Jersey's game rules codify the 3:2 payment (source 4) — payouts are a regulated game rule, not a courtesy.
- **H2: Dealer hits soft 17 (H17 vs S17)**
  +0.22 pp to the house (verified). Explain the counterintuitive mechanism: hitting soft 17 risks a dealer bust, but improvement to 18–21 outweighs it, so a rule that *sounds* dealer-risky is player-negative. Answer "what does H17 mean" in one bolded sentence for snippet capture.
- **H2: Doubling rules and DAS**
  H3: What DAS means — one-sentence bolded definition (Double After Split), worth ~0.14 pp to the player (verified; see the sign note in source 2 — WoO publishes it as "no DAS −0.14%"). H3: Doubling restrictions — double on 9–11 or 10–11 only, and "no doubling" at −1.48 pp as the extreme case (verified); explain that doubling is where basic strategy recovers most of its value.
- **H2: Number of decks: why fewer is (slightly) better**
  Single deck is worth ~+0.48 pp to the player vs 8 decks (verified). Mechanism: card-removal effect on natural frequency and double-down success. Then the trap this section exists for: casinos advertise "single deck" while paying 6:5 — the deck gain (+0.48) never covers the payout loss (−1.39). Do the arithmetic in-line.
- **H2: Splitting, resplitting, and resplit aces**
  Smaller effects: split to 2/3/4 hands, resplit aces, hit split aces. Keep brief — one short table row each; note effects are small individually but stack.
- **H2: Surrender and the no-hole-card rule**
  Late surrender (~+0.08 pp to the player, multi-deck) vs the rare early surrender. Then the no-hole-card family — and keep its two variants strictly apart, because online help screens label both loosely as "no hole card": **full-loss ENHC**, where the player loses the *total* bet (splits and doubles included) to a dealer blackjack, costs ~0.11 pp (verified); **OBO (original bets only)**, where only the initial bet is lost and doubles/splits are returned, is EV-equivalent to the US peek game (≈0 pp difference). The full-loss rule is the one European and many online readers actually meet, and the one US-centric competitor pages skip — this distinction is our online-first differentiation and the whole reason this section exists.
- **H2: Stacking the rules: three real tables, worked**
  The payoff section: three realistic rule sets (a 6:5 H17 8-deck "party pit" game, our 3:2 S17 DAS baseline, a European online no-peek game), each computed additively row by row, then compared against the calculator's exact figure to show the additive method is accurate to a few hundredths. This is also the demo script for our future calculator.
- **H2: Online blackjack: where to find the rules**
  Every UKGC-licensed online game must make rules and chances-of-winning information available before play (RTS 3C, source 5); RTP shown in help screens is just 100% minus the house edge. Tell the reader exactly which lines of a help screen to read (payout ratio, soft 17, decks, DAS). Natural place to reference the planned `can-casinos-change-rtp` and `rng-certification-explained` articles.
- **H2: FAQ**
  Four PAA-targeted questions: Is 6:5 always worse than 3:2? Does the house edge apply to every single hand? Can any rule set make blackjack player-positive? Why do casinos offer 6:5 at all? (Answer the last one honestly and neutrally: because it earns more per hand and demand tolerates it.) Historical footnote allowed here: Thorp's 1961 PNAS paper (source 3) proved rule-dependent strategy analysis works — one paragraph, strictly historical, no counting instruction.

## Expert verification required

Math-heavy topic — no platform-QA insider input needed, but every figure must be verified by the owner before publication:

1. Reproduce the baseline edge for our reference rule set (6D, S17, DAS, resplit to 4, no surrender, 3:2, peek) with the Wizard of Odds calculator and record the exact figure and the calculator's shuffle assumption used (total-dependent vs composition-dependent, cut-card effect).
2. Recompute all three worked rule sets in the "Stacking the rules" section with the calculator; report the deviation between the additive estimate and the exact figure for each (expected: ≤0.05 pp — if larger, the article must say so).
3. Verify the natural-frequency derivation: P(natural) for 6 decks = 2 × (24/312) × (96/311) ≈ 4.75%, and that P(natural, dealer has no blackjack) × 0.3 reproduces the 1.36–1.39 pp cost of 6:5 (the naive product gives ~1.36 pp after removing dealer-blackjack pushes; the remaining gap to WoO's published 1.39 comes from strategy and composition adjustments — record the reconciliation, do not average the two); confirm how the figure varies by deck count.
4. Confirm every per-rule delta quoted in the master table against the WoO rule-variations page **and** re-derive any delta against *our* 6-deck baseline where the two differ (WoO's published deltas are relative to 8D, S17, DAS, split to 4).
5. Verify the single-deck 6:5 vs 8-deck 3:2 comparison end to end — this is the claim most likely to be challenged.
6. Verify the no-hole-card effect (~0.11 pp for the full-loss variant) and that the calculator setting used actually matches the rule being described (original-bets-only vs full loss — OBO should come out EV-equivalent to peek; if it doesn't, the setting is wrong).
7. Sign-convention audit: WoO expresses effects as player return (+ favors player); the article's table expresses house-edge deltas (+ favors house). Check every row was flipped consistently — DAS is the trap row, since WoO publishes it as "no DAS −0.14%" (see source 2).
8. Sanity-check the RTP statement for online games (RTP = 100% − edge per initial bet, under basic strategy) against at least one real online blackjack help screen.
9. Verify the wagering-contribution claim in the internal-linking section (blackjack "commonly 10% or less") against at least one live bonus T&C — contribution tables vary by operator and some exclude blackjack entirely; adjust the sentence to what verification actually shows.

## Primary sources (verified URLs with what each supports)

All fetched and confirmed live on 2026-08-25:

1. **Wizard of Odds — Blackjack House Edge Calculator** — https://wizardofodds.com/games/blackjack/calculator/ — by Michael Shackleford, last updated Aug 03, 2026; covers 6,912 rule combinations: decks 1/2/4/5/6/8 (note: no 3- or 7-deck option — the calculator JSON spec must not promise deck counts the source cannot produce), S17/H17, DAS, doubling restrictions (any two / 9–11 / 10–11), resplit to 2–4 hands, RSA, hit split aces, 3:2 vs 6:5, late surrender, peek vs no-peek. Supports: every exact house-edge figure and the worked examples; also the functional model for our own calculator.
2. **Wizard of Odds — Rule Variations table** — https://wizardofodds.com/games/blackjack/rule-variations/ — ~70 rule effects relative to a stated baseline (8D, S17, double any two, DAS, split to 4). Verified examples: 6:5 blackjack −1.39%, H17 −0.22%, single deck +0.48%, no doubling −1.48%, no-hole-card full loss −0.11% (all as player return). Note: DAS sits *inside* WoO's baseline, so the published delta is "player may not double after splitting −0.14%" — quote DAS as +0.14 pp to the player only after flipping both sign and direction consistently (verification item 7). Supports: the master per-rule table.
3. **Thorp, E. "A Favorable Strategy for Twenty-One," PNAS 47(1):110–112, 1961** — https://pmc.ncbi.nlm.nih.gov/articles/PMC285252/ — full text and PDF confirmed accessible; MIT Dept. of Mathematics. Supports: the historical footnote that blackjack's edge is rule- and composition-dependent and has been rigorously analyzed since 1961. (Do NOT fetch via pnas.org — it 403s; the PMC mirror is the linkable copy.)
4. **N.J.A.C. 13:69F-2.7 — Payment of blackjack (Cornell LII)** — https://www.law.cornell.edu/regulations/new-jersey/N-J-A-C-13-69F-2-7 — New Jersey's game rules codify payment of blackjack at 3 to 2 (with the even-money option when dealer shows an ace). Supports: "the payout ratio is a regulated game rule that varies by jurisdiction." (Justia's mirror 403s to fetchers; cite Cornell.)
5. **UK Gambling Commission — Remote gambling and software technical standards, RTS 3** — https://www.gamblingcommission.gov.uk/standards/remote-gambling-and-software-technical-standards/rts-3-rules-game-descriptions-and-the-likelihood-of-winning — RTS 3C requires information enabling the customer to understand chances of winning (rules, house edge/RTP or probability) to be easily available before committing to gamble. Supports: the "online blackjack: where to find the rules" section.

Note for the writer: gaming.unlv.edu (the old UNLV casino-math page) is dead — do not cite it or its PDF mirrors. Baldwin et al. 1956 (JASA) exists only behind JSTOR/T&F paywalls that block verification; if a second academic citation is wanted, mention it by citation only, unlinked, or skip it — Thorp is sufficient.

## Tables & visuals

1. **Master table (mandatory) — "Rule effects on house edge."** Columns: rule · options · effect on house edge in percentage points (with sign meaning "+ = costs the player") · where you typically see it (land-based US / land-based EU / online). Rows: payout (3:2 / 6:5 / 1:1), soft 17 (S17/H17), doubling (any two / 9–11 / 10–11 / none), DAS (yes/no), decks (1/2/4/6/8), resplit (2/3/4 hands), RSA, hit split aces, late surrender, early surrender, no-hole-card OBO/full-loss (two separate rows — OBO ≈ 0 pp vs peek, full loss ~+0.11 pp to the house). **This table doubles as the data spec for the planned house-edge calculator**: alongside the article, deliver a machine-readable copy (JSON: `{baseline: {rules…, edge}, deltas: [{param, value, delta_pp}]}`) so the tool consumes exactly the figures the article publishes; the JSON must only include deck counts and options the WoO calculator can verify (decks 1/2/4/5/6/8). State in a footnote that the additive model approximates the exact combinatorial value to within the deviation measured in verification item 2.
2. **Worked-examples table (mandatory)** — three rule sets computed row by row (baseline + deltas = estimate) with the calculator's exact figure as the final column.
3. **6:5 cost illustration (mandatory)** — expected additional cost per 100 hands at a flat 1-unit stake, expressed in units, never in currency and never as "winnings."
4. **One figure** — horizontal bar chart of rule effects sorted by magnitude (house-edge delta in pp); the 6:5 bar dwarfing everything else IS the article's thesis in one image. (If the "no doubling" row is included, mark it visually as a rarely-offered extreme so it doesn't undercut the 6:5 thesis.)
5. **Tool embeds** — reserve an embed slot after the "Stacking the rules" H2 for the future house-edge calculator (editorial marker only; no promise in reader-facing text). Do not embed the odds-converter or margin-calculator — they are sports-betting tools and would look pasted-on here.

## Internal linking

**Out (from this article):**
- `blackjack-basic-strategy` — anchor "basic strategy" in the house-edge definition section (every figure assumes it); second contextual link from the doubling section ("where basic strategy earns most of its value back").
- `wagering-explained` + /en/tools/wagering-calculator/ — one sentence in the online section: blackjack's contribution toward wagering requirements is low precisely *because* its edge is low (commonly 10% or less, sometimes excluded — verify against at least one live bonus T&C before publication, verification item 9); link both. Keep it one sentence — no bonus talk beyond the mechanic.
- Planned `can-casinos-change-rtp` — from the online/RTP section ("whether and how published RTP can change"). Add when it publishes.
- Planned `rng-certification-explained` — from the online section (who verifies that online dealing is fair). Add when it publishes.
- `how-to-choose-casino` — anchor "checking a site's game rules before you play" in the online section.
- Do NOT link `how-to-develop-igaming-slots` (not topically needed here — and its live slug carries a trailing U+2060, so any future link to it is blocked until the Sanity slug is fixed).

**In (edits to existing articles, same release):**
- `blackjack-basic-strategy` → this article, anchor "how each table rule changes the house edge" (its rules-variation paragraph currently dead-ends).
- `how-to-choose-casino` → this article, anchor "what blackjack table rules cost you" from its game-selection section.
- Future briefs `can-casinos-change-rtp` and `rng-certification-explained` should each plan a link back here as their table-games example.

## Schema & metadata

- **Title (<=60):** Blackjack House Edge by Rules: What Each Rule Costs (51 chars)
- **Meta description (120–155):** How each blackjack table rule — 6:5 payouts, H17, DAS, deck count, surrender — changes the house edge, with exact figures and worked examples. (142 chars)
- **Schema:** `Article` (headline = title above; author/publisher come from the site template) plus `FAQPage` for the four FAQ questions only — do not mark up the whole article as FAQ. No `HowTo` (this is not instructional content and HowTo framing invites "how to win" drift).
- **Slug:** `blackjack-house-edge-by-rules` (verify in Sanity preview that the stored slug is byte-clean ASCII before publish — see the U+2060 incident on the slots article).

## Length & tone

2,200–2,800 words plus tables. Plain, numeric, unhurried — closer to a well-edited reference page than a blog post. Deltas always in **percentage points (pp)**, never "percent higher" (the ranking pages' "400% increase" phrasing is exactly the ambiguity we're displacing). Define every abbreviation (S17, H17, DAS, RSA, OBO, ENHC) at first use — the long-tail queries are definitional. American blackjack terminology; note European variants where rules differ. Show arithmetic inline where it fits in three lines or fewer; push anything longer into a table. No second person imperatives about playing ("you should sit at…") — describe what rules cost, let the reader conclude.

## What NOT to do

- No "where to find 3:2 tables" or "best casinos for blackjack" content, no operator names framed as recommendations — the moment this article names a venue approvingly, it becomes the affiliate content it is built to displace.
- Never present a lower house edge as a way to win or "beat the house." The correct frame everywhere: a lower edge means losing less on average over time; every rule set in the table is still negative for the player.
- No card-counting instruction. Thorp gets one historical paragraph; the words "advantage play" may appear as a noun, not as a tutorial. Counting content is the strongest commercial-drift gravity on this topic.
- No currency examples ("you'd win $15") — units and expected cost only; currency framing plus payout talk reads as winnings promotion.
- No basic-strategy chart reproduction — that is the other article's job; duplicating it cannibalizes it.
- No side-bet coverage (Perfect Pairs, 21+3, insurance-as-a-bet). Their edges are an order of magnitude larger and belong in a separate future article; one sentence noting they are excluded is fine.
- Do not reproduce the Wizard of Odds table wholesale — select, restructure, recompute against our own baseline, and attribute. Their table is ~70 rows; ours is the ~15 rules a reader will actually meet.
- Do not add a responsible-gambling section — the template appends it automatically.

## Success metric (review checkpoints, no guarantees)

- **Pre-publication gate:** all 9 expert-verification items signed off by the owner; calculator JSON validated against the article's table (same figures, same signs); slug byte-checked.
- **Week 4 review:** page indexed; GSC shows impressions for the primary query and at least two secondary queries; fix any coverage/snippet rendering issues found.
- **Week 8 review:** check featured-snippet / AI-overview capture for "blackjack house edge by rules" and "6:5 vs 3:2 blackjack difference"; if the definitional H3s (DAS, H17) aren't earning their long-tail queries, tighten the bolded one-sentence answers.
- **Week 12 review:** compare positions against the junk domains observed in the 2026-08 sweep (speedwaymedia, betting-data-lab); decide whether a data refresh or the calculator launch should be pulled forward.
- **On calculator launch:** re-verify article figures still match the tool's output; add the embed; re-submit for indexing.
- **Ongoing:** re-check the five source URLs quarterly (two already required fallback mirrors during this research); update the master table if Wizard of Odds revises its figures.