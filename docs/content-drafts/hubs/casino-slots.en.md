<!--
DRAFT — hub text for /en/casino-slots/. Raw material: every factual claim needs the owner's fact-check before publication.
INSIDER-VERIFY (owner, first-hand): (1) the claim that many titles ship with several certified RTP configurations the operator chooses from; (2) the list of certification labs (GLI, iTech Labs, eCOGRA, BMM) as the ones actually seen in practice; (3) the claim that the outcome is computed server-side at the moment of the spin request on real platforms.
The page template renders its own H1 and appends the responsible-gambling block — neither is included here.
-->

## What this section is about

This section explains how online casinos and slot machines work as software and as mathematics: where the return-to-player figure comes from, what volatility actually measures, how random number generation is implemented and verified, what bonus terms cost in expected-value terms, and what certification does and does not guarantee.

It is written for two kinds of readers. The first already plays and wants to understand the machinery behind the interface instead of relying on forum folklore. The second does not play at all and is simply curious how a regulated, audited, industrial-scale probability business functions. Both get the same material, because the material is the same: arithmetic, distributions, and software engineering.

What you will not find here: casino ratings, "top 10" lists, bonus codes, or any suggestion that one operator deserves your deposit more than another. This portal takes no money from casinos and links to none. One more thing makes this section unusual: its author works inside the industry, as a QA engineer on an online casino platform. The descriptions of how these systems behave come from testing them, not from playing them.

## Six terms that do most of the work

### RTP — return to player

RTP is the average share of all stakes a game pays back over an enormous number of rounds — millions to billions of them in certification simulations. A 96% RTP means the game keeps 4% of turnover on average; it says nothing about your evening, which is governed by variance, not by the mean. RTP is fixed in the game's math model before release, and many titles ship in several certified RTP configurations from which an operator chooses.

### Volatility

Volatility describes how widely short-run results swing around the RTP. Two slots with an identical 96% RTP can feel like opposite games: one pays small amounts constantly, the other rarely and in bursts. There is no standardized industry unit for it — "low/medium/high" labels are shorthand for the shape of the payout distribution, not a certified figure.

### RNG — random number generation

A slot's outcome is produced by a pseudo-random number generator the moment the spin request reaches the server; the spinning reels are animation drawn after the result already exists. Certification labs test the generator's statistical output — uniformity, independence, unpredictability — not whether the game is "generous". A correctly working RNG is precisely what makes the house edge reliable.

### House edge

The house edge is simply 100% minus RTP: the operator's mathematical margin on turnover. In slots there are no decisions to make, so no strategy, stake size or timing changes it. It guarantees the operator a profit across all players in aggregate — a statement about the population, not a prediction about any single session.

### Wagering requirements

A bonus is money with conditions attached, and the conditions are where the value goes. A x40 wagering requirement on a 100-unit bonus means 4,000 units of turnover; at a 4% house edge, the expected loss over that turnover is 160 units — more than the bonus itself. This is arithmetic, not cynicism, and it is the single most misunderstood number in casino marketing.

### Certification

Before a game enters a regulated market, an independent laboratory verifies that the RNG passes statistical tests and that measured returns match the declared math model. Certification means the game behaves as documented; it does not mean the game is beatable, and it does not vouch for the operator's payment practices or terms. Those are separate questions with separate checks.

## How the articles in this section fit together

The three articles published so far form a pipeline that mirrors how the product itself is built. Start with [how slot games are actually developed](/en/articles/how-to-develop-igaming-slots/) — it shows that RTP and volatility are design inputs decided in a spreadsheet long before any artwork exists, which permanently cures the idea that a slot can be "due". Then read [what wagering requirements really cost](/en/articles/wagering-explained/), which applies the house-edge arithmetic above to real bonus terms and shows why the headline bonus figure is not the number that matters. Finally, [how to evaluate a casino before registering anywhere](/en/articles/how-to-choose-casino/) reframes the choice away from bonus size toward licensing, terms and withdrawal rules — the boring paperwork that decides whether the mathematics you have just learned is even honoured.

Read in that order, they answer three questions in sequence: how the game works, what the marketing costs, and what the operator's documents should look like.

## What is coming next

Planned additions to this section, in no promised order: a deeper look at RTP built on actual payout distributions rather than a single average; a walkthrough of what certification testing involves, written from the QA side of the fence; a piece on common slot myths — hot machines, near misses, stop-button timing — tested against how the software actually executes; and an explainer on progressive jackpots and where their money comes from. Each will follow the same rule as everything here: numbers first, and no claim the author cannot defend.
