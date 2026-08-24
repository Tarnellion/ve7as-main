<!--
DRAFT — raw material, not publishable as-is. Owner fact-check required for every claim.
Claims flagged for verification before publish:
[verify] European roulette house edge ≈ 2.7% on single-zero tables.
[verify] Blackjack house edge can fall below 1% only under specific rule sets with correct basic strategy.
[verify] Cash-game rake is typically a capped percentage of the pot; tournament fee is added to the buy-in.
[verify-insider] All statements about how table-game logic is implemented, tested and certified on a real platform — must be checked and reworded by the owner against his actual QA/SDET experience; do not publish generic claims under the insider framing.
This hub must not duplicate the responsible-gambling block — the template appends it automatically.
-->

## What this section covers

Poker and casino table games are usually shelved together, and that shelving hides the most important fact about them: they run on opposite economic principles. In blackjack, baccarat or roulette you play against the house, and the house holds a mathematical edge that no decision at the table can turn negative. In poker you play against other people, and the operator earns a fee for hosting the game. Everything else in this section — the strategy charts, the edge percentages, the format guides — follows from that split.

This section is written for readers who want to understand the machinery: how rules translate into probabilities, what the operator's margin actually is in each game, and what "strategy" can honestly mean in a negative-expectation environment. It is not a collection of systems for beating anything. Where a strategy exists, it reduces the average cost of playing; it does not turn a game into a source of income, and we will keep saying so plainly, because the marketing that surrounds these games keeps implying the opposite.

The perspective here is unusual for the niche: the author works in quality assurance on an online casino platform and tests the same kind of game logic these articles describe. Cards on a licensed platform are not dealt by mood or by how long you have been losing; they are dealt by software that follows published rules and is checked against them. Knowing how that software is built and verified shapes how this section describes game behaviour — and which folk beliefs about "hot tables" and "due outcomes" it can dismiss with confidence.

## Key concepts

**House edge.** The share of each wager that the operator keeps on average over a very long run. European roulette holds about 2.7% on most bets; blackjack can drop below 1%, but only under a favourable rule set and only with correct play on every hand. It is an average across millions of rounds — individual sessions scatter widely around it, which is exactly why the edge is invisible to casual observation.

**Basic strategy.** The complete decision table for blackjack, computed from the expected value of every legal action in every player-versus-dealer situation. Following it minimizes the house edge for a given rule set; deviating from it raises the edge, sometimes sharply. It is a damage-minimization tool, not a winning method — the optimal move in a negative-expectation game still has negative expectation.

**Rake.** The operator's revenue in poker: a percentage of each cash-game pot, usually capped, or a fee attached to tournament buy-ins. The house does not play hands, so rake is its entire margin — and it quietly explains why most poker players lose money even in a game of skill: the table's combined bankroll shrinks with every raked pot.

**Expected value.** The probability-weighted average of all possible outcomes of a bet or decision — the single number every honest analysis reduces to. Against the house, player expectation is negative by construction. In poker, expectation differs from player to player with skill, but rake shifts everyone downward, and only a minority clears that bar.

**Variance.** A measure of how widely results scatter around their average. Variance is what lets a losing game produce winning evenings, and a skilled poker player stay in the red for months; it is also the raw material of nearly every gambling myth. Understanding it means expecting the scatter — and refusing to read meaning into it.

## How the articles fit together

The natural entry point is the [guide to poker formats](/en/articles/poker-formats-guide/), which maps cash games, tournaments and fast variants, and shows how a format's structure changes both the role of skill and the shape of the swings. From there, the [blackjack basic strategy](/en/articles/blackjack-basic-strategy/) article is the cleanest worked example of what "optimal play" actually means: a full decision chart next to the honest arithmetic of what it does and does not achieve. Both games produce swings far larger than their averages, which is why [bankroll management](/en/articles/bankroll-management/) is the practical companion to everything here — it treats money as a buffer against variance, not as a lever for winning. And for readers checking the ground rules before anything else, the piece on [how to choose a casino](/en/articles/how-to-choose-casino/) covers licensing and player-protection basics rather than recommendations.

## What comes next

Planned additions to this section: a comparison of house edges across common table games under the rule variations actually offered online; a look at side bets and why their edges are routinely several times worse than the main game; an inside view of how table-game logic is tested and certified on a real platform; and a myth audit of betting progressions such as the Martingale, with the arithmetic showing why they rearrange losses rather than remove them.
