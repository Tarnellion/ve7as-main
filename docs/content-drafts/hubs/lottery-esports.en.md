<!--
DRAFT — raw material, not publishable as-is. Owner fact-check required for every claim.
Claims flagged for verification before publish:
[verify] C(49,6) = 13,983,816 combinations in a 6-of-49 draw.
[verify] Typical lottery prize payout share ≈ 50% of ticket revenue — varies by jurisdiction and format; soften or source before publish.
[verify] "Noise swamps the signal for hundreds of bets" — check the statistical framing (depends on odds and claimed edge); consider a worked example instead of a bare number.
[verify] Esports markets being thinner / slower to correct than football — plausible industry knowledge, needs sourcing or owner confirmation.
This hub must not duplicate the responsible-gambling block — the template appends it automatically.
-->

## What this section covers

At first glance lotteries and esports betting have little in common: one is a slow drum of numbered balls, the other a fast-moving market attached to competitive video games. What unites them is that both are priced by probability — and both are routinely discussed without any. This section supplies the missing numbers: how lottery odds are computed exactly, what a ticket is mathematically worth, how a bookmaker builds margin into esports odds, and why a short run of betting results is almost pure noise.

It is written for two kinds of readers. The first simply wants to know what these games really cost — what "one in fourteen million" means in practice, and why a bigger jackpot does not mean a better deal. The second follows esports, sees odds quoted around every match, and wants to understand what those numbers encode before forming any opinion about them. Neither reader will find picks, predictions or systems here. Lotteries cannot be beaten by any method of choosing numbers, and betting markets are far harder to beat than their advertising implies — this section exists to show why, not to hint otherwise.

## Key concepts

**Lottery odds.** Unlike almost everything else in gambling, lottery probabilities can be computed exactly with combinatorics. A classic 6-of-49 draw has 13,983,816 possible combinations, so a single ticket hits the jackpot roughly once in fourteen million attempts. No method of picking numbers changes this — the combination 1-2-3-4-5-6 is exactly as likely as any "random-looking" one.

**Expected value of a ticket.** Lotteries typically return only around half of ticket revenue as prizes, which makes them the most expensive mainstream gambling product per unit wagered. Even a record jackpot rarely pushes a ticket's expected value positive once shared jackpots and taxes enter the calculation — and even when it does on paper, the variance is so extreme that the average is meaningless for any individual player.

**Pari-mutuel prizes.** In many formats the jackpot is a pool split among all winners rather than a fixed sum. The practical consequence is unintuitive: popular combinations — birthdays, symmetric patterns — do not win less often, but they pay less when they win, because more people share the same pool.

**Bookmaker margin.** Convert every outcome's odds into an implied probability and add them up: the total exceeds 100%, and the excess is the bookmaker's built-in margin, sometimes called the overround. Odds are therefore not honest probability estimates — they are probability estimates plus a fee, and stripping the margin out is the first step of any sober reading of a betting line.

**Odds formats.** Decimal, fractional and American odds are three notations for the same number. Decimal is the easiest to reason about: stake times odds gives the total return, and the reciprocal of the odds gives the implied probability, margin included.

**Variance and sample size.** Ten or twenty settled bets say almost nothing about whether anyone has an edge; at typical odds, noise swamps the signal until the sample runs into the hundreds. In esports this is compounded by the games themselves: patches, roster changes and short match histories keep shifting the underlying probabilities before any sample can mature.

## How the articles fit together

On the lottery side, the [overview of lottery formats](/en/articles/lottery-formats-overview/) is the foundation: it walks through draw games, number pools and instant formats, and attaches real odds to each. On the other side, [esports betting basics](/en/articles/esports-betting-basics/) does the equivalent job for competitive gaming — which titles have meaningful markets, what bet types exist, and how these markets differ from traditional sport. Because odds mechanics are identical across every bookmaker product, the article on [football betting basics](/en/articles/football-betting-basics/) makes a useful companion: margin, implied probability and odds formats work the same whether the event is a football match or a best-of-five. And since both topics involve staked money exposed to heavy variance, [bankroll management](/en/articles/bankroll-management/) applies here exactly as it does at a poker table — as accounting, not as strategy.

## What comes next

Planned additions to this section: worked expected-value calculations for specific lottery formats, in full, with nothing hidden in the rounding; a piece on jackpot rollovers and why "positive-EV draws" are mostly a mirage once ticket-sharing is modelled; a look at how esports odds are compiled and why these markets are thinner and slower to correct than football; and an honest survey of the data problems in esports analytics — small samples, patch cycles and roster churn — that limit what any model can know.
