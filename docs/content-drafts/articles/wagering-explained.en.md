---
title: "Wagering Requirements Explained: What a Casino Bonus Really Costs"
description: "What wagering requirements really cost: the formula, two worked examples, game weighting, sticky vs non-sticky bonuses, and the math of clearing."
status: draft-needs-factcheck
---

<!--
OWNER NOTES (delete before publish):
- Every [VERIFY: ...] marker is an insider claim that must be checked against
  first-hand platform knowledge before publication. Generic industry figures
  (weighting ranges, RTP values) are typical, not universal - keep the
  "check the operator's terms" framing.
- The responsible-gambling block is appended by the site template. Do NOT add one here.
- All 4 external links verified resolving on 2026-08-24 via WebFetch.
-->

A wagering requirement — also called playthrough or rollover — is the total amount you must bet before a casino lets you withdraw bonus money or anything you won with it. It is written as a multiplier: 10x, 35x, 40x. A "$100 bonus with 35x wagering" means you must place $3,500 in bets before the bonus funds unlock. Until then, the money exists on your screen but not in your pocket.

The key word is *bet*, not *lose*. Nobody asks you to lose $3,500. But placing $3,500 in bets has a predictable average cost, and that cost — not the headline number — is the real price of the bonus. This article gives you the formula, two fully worked examples, and a look at how the software on the operator's side actually counts your bets.

## The formula

```
Required turnover = (amount the multiplier applies to) x (the multiplier)
```

Two things decide everything, and the multiplier is only one of them. The other is the **base** — what the multiplier applies to. There are two common variants:

- **Bonus only.** You must wager X times the bonus amount.
- **Deposit + bonus.** You must wager X times the *sum* of your deposit and the bonus.

The same multiplier produces very different totals depending on the base, which is why comparing bonuses by the multiplier alone is a mistake. Advertising rules in the UK treat wagering requirements as a "significant condition" that must be shown prominently in the ad itself, not buried in linked terms — that is [CAP Code guidance enforced by the ASA](https://www.asa.org.uk/advice-online/gambling-betting-and-gaming-free-bets-and-bonuses.html). In practice, "prominent" is often still small print, so you should expect to dig.

One regional note: since 19 January 2026, operators licensed in Great Britain may not set wagering requirements above 10x, and promotions mixing products (for example, sports betting plus slots) are banned there outright, per the [Gambling Commission's announcement](https://www.gamblingcommission.gov.uk/news/article/gambling-promotions-to-be-safer-and-simpler). Most other markets have no cap, and 30x to 50x remains common.

## Worked example 1: wagering on the bonus only

You deposit $100 and receive a 100% match bonus: $100 in bonus funds. The terms say **35x wagering, bonus only**.

- Base = $100 (the bonus)
- Required turnover = 35 x $100 = **$3,500**

To picture the scale: at $1 per spin, that is 3,500 spins. At $0.50, it is 7,000. Most bonuses also carry a maximum bet while wagering is active — commonly around $5 per spin, though this varies — so you cannot shortcut the process with a few large bets even if you wanted to.

## Worked example 2: wagering on deposit plus bonus

You deposit $50 and receive a $50 bonus. The terms say **25x wagering on deposit + bonus**. The multiplier looks friendlier than in example 1. It is not.

- Base = $50 + $50 = $100
- Required turnover = 25 x $100 = **$2,500**

Measured against the $50 bonus alone, that is an *effective* 50x — worse than the "35x" offer above relative to what you were given. The base moves the total more than the multiplier does. Whenever you see a small multiplier, check the base first.

{{TOOL: wagering-calculator}}

## Game weighting: why some bets barely count

Not every bet contributes its full value to the requirement. Each game type has a **contribution weight**. A $10 bet on a slot weighted 100% adds $10 to your progress. The same $10 on blackjack weighted 10% adds $1 — meaning you would need $35,000 in actual blackjack bets to clear a $3,500 requirement.

Typical industry values look like this. These are generic ranges, **not** rules — always check the operator's own terms, because weightings differ between operators and even between two promotions from the same operator:

| Game type | Typical contribution | Why operators set it this way |
| --- | --- | --- |
| Video slots | 100% | Higher house edge, fast rounds |
| Progressive jackpot slots | 0% (usually excluded) | Part of each stake funds the jackpot pool |
| Roulette, baccarat | 5–25% | Lower house edge than slots |
| Blackjack, video poker | 0–10% | Lowest house edge on the floor |
| Live dealer games | 0–10% | Same math as their table versions |
| Excluded titles list | 0% | High RTP, bonus-buy features, or promo abuse history |

The logic behind the weights is straightforward once you see it from the operator's side: weighting equalizes the expected cost of clearing across the game catalog. Blackjack played with [basic strategy](/en/articles/blackjack-basic-strategy/) has a house edge around 0.5%; a typical slot holds 3–5%. If blackjack counted at 100%, the requirement would clear at roughly a tenth of the average cost the operator priced the promotion at — so low-edge games get discounted or excluded. [VERIFY: on your platform, whether weighting configs are set per promotion by the operator's promo team or fixed platform-wide, and whether excluded-game lists are maintained per jurisdiction.]

## Sticky vs non-sticky bonuses

How the bonus money relates to your own deposit matters as much as the multiplier.

**Non-sticky** (sometimes called a "parachute" bonus): your cash and the bonus are kept separate, and you play your own cash first. If you win while still on your own money, you can usually withdraw everything and simply forfeit the untouched bonus — no wagering owed. The requirement only starts to matter if your cash runs out and play crosses into bonus funds. This structure is meaningfully less restrictive, which is why operators offer it less often and advertise it more loudly when they do.

**Sticky**: the bonus amount itself can never be withdrawn. It comes in two flavors. In the *locked-together* version, bonus and winnings sit in one pool you cannot touch until wagering completes. In the *phantom* version, you can eventually withdraw, but the bonus amount is deducted at cash-out. Sticky bonuses tend to carry the biggest headline numbers precisely because the money is never really leaving the building.

The withdrawal mechanics around all of this have a regulatory history: between 2016 and 2019, the UK's Competition and Markets Authority [took enforcement action against several operators](https://www.gov.uk/cma-cases/online-gambling) over promotion terms that blocked players from withdrawing even their own deposited money, and secured formal commitments to clearer terms. If a bonus locks your *deposit*, that is a red flag regulators have already acted on once.

## The expected cost of clearing

Every casino game pays back less than it takes in over time — that is what RTP below 100% means (our article on [how slots are developed](/en/articles/how-to-develop-igaming-slots/) covers where that number comes from). The gap is the house edge, and required turnover multiplied by the house edge is the honest price tag of a wagering requirement:

```
Expected cost = required turnover x house edge
```

Take worked example 1: $3,500 of turnover on a 96% RTP slot (4% house edge).

- Expected cost = $3,500 x 0.04 = **$140**
- Value of the bonus = $100

On average, clearing this bonus costs $40 more than the bonus is worth. The "free" $100 has a $140 average price. And this is an *average across many players*, not a prediction for you: individual results spread widely around it, in both directions, and no play pattern changes the average.

Weighting closes the obvious workaround. Grinding the same $3,500 requirement through blackjack at 10% contribution means $35,000 in real bets; even at a 0.5% house edge, that is $35,000 x 0.005 = $175 expected cost — *more* than the slot route, and that assumes error-free basic strategy. The weights are set so that no route through the catalog is meaningfully cheaper than the one the operator priced. Expected cost scales linearly with the multiplier, which is exactly why the British regulator chose to cap the multiplier rather than regulate anything subtler.

None of this says a bonus is a scam. It says a bonus is a purchase, with a price you can estimate in one multiplication — and a decision that belongs inside a [bankroll plan](/en/articles/bankroll-management/), not on top of it.

## Inside the bonus engine: how your progress is actually counted

I work in QA on an online casino platform, which means part of my job is testing exactly this machinery. The details below describe typical architecture and each one is marked for verification against publication standards.

- **Two wallets, not one.** Your cash and bonus funds live in separate wallets, and a rules layer decides which one a stake draws from. The spend order (cash-first vs bonus-first) is a configuration choice, and it silently determines whether an offer behaves sticky or non-sticky in practice. [VERIFY: spend-order behavior and whether it is configurable per brand/promotion on platforms you can speak to.]
- **Progress updates on settlement, not on bet placement.** The engine listens for settled-bet events, multiplies stake by the game's contribution weight, and adds the result to a counter attached to your bonus instance. This is why a progress bar can lag behind your play — an unsettled or in-flight round contributes nothing yet. [VERIFY: settlement-event mechanics and known progress-bar lag cases.]
- **Why a bet can count as zero.** Typical non-counting cases: the game is on the excluded list (weight 0); the stake exceeded the max-bet cap (some engines count zero, others void the whole bonus — a brutal difference); the round was voided or cancelled; the bet pattern was flagged as low-risk "irregular play," such as covering red and black on the same roulette spin. [VERIFY: the full non-counting list and the max-bet breach behavior on a real engine — count-zero vs bonus-void.]
- **It is configuration, not code.** Promotions are assembled in a back-office tool by operations staff choosing multipliers, bases, weights, and exclusions from menus. Misconfigured promotions happen and are a routine bug class — which is one reason the published terms and the engine's actual behavior occasionally disagree, and why support tickets about "stuck" wagering progress exist. [VERIFY: that promo setup is back-office configuration on the platforms you can speak to, and a sanitized example of a real misconfiguration class.]

## Before you accept any bonus

A five-minute check, in order:

1. **Find the multiplier and its base.** Bonus-only or deposit + bonus? The base matters more.
2. **Convert to a currency total.** "35x on $100" is $3,500. Write the number down; it reframes the decision.
3. **Check the weighting table** for the games you actually intend to play, and the excluded list.
4. **Sticky or non-sticky?** If the terms lock your own deposit, walk away.
5. **Find the max bet during wagering** and what happens if you breach it.
6. **Find the expiry.** Requirements usually come with a clock — 7 to 30 days is common.
7. **Look for a win or withdrawal cap**, especially on no-deposit offers.
8. **Remember that "no bonus" is always an option.** Every serious operator lets you deposit without one, and the regulator's own [pre-deposit checklist](https://www.gamblingcommission.gov.uk/public-and-players/guide/what-to-look-at-before-you-gamble) starts with the licence, not the offer. Our guide on [choosing a casino](/en/articles/how-to-choose-casino/) covers that part.

A wagering requirement is not fine print. It is the price tag, printed sideways. Read it the way you would read any other price.
