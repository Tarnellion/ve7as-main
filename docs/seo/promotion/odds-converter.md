<!-- approved: False | verifier issues: 12 -->

# Promotion plan — /en/tools/odds-converter/ (adversarially re-verified 2026-08-27)

Verification status of this revision: every venue below was re-fetched on 2026-08-27 except Stack Exchange and Reddit (both networks refuse anonymous fetching from this environment — **all SE and Reddit items are gated on a manual browser check**, exactly like the original plan already did for Reddit). The tool's fraction algorithm was verified by executing the exact `toFraction()` code from `src/pages/[lang]/tools/odds-converter.astro`. Two competitor converters were fetched (AceOdds, Action Network).

## Precondition — fix the pitch before any outreach

The previous draft's flagship claim («2.88 → 15/8, not 47/25») is **false against our own live tool**: the converter computes the Stern-Brocot *best rational approximation with denominator ≤ 100*, so 2.88 → **47/25** and 1.91 → **91/100** (a UK book prints 10/11). Meanwhile AceOdds — a mainstream free converter — *does* output ladder fractions (1/5, 2/9, 4/11). Any post built on the old claim gets falsified in one screenshot by the first commenter, on HN in minutes.

Two options, pick one before acting:

- **Option A (recommended, ~20 lines of client JS):** snap `toFraction()` to the standard UK odds ladder (1/10 … 10/11 … 15/8 … 100/1) instead of raw best-approximation. Then — and only then — the "outputs the fraction a book would actually print" angle is true and demonstrable.
- **Option B (no code change):** drop the fraction claim from all pitches entirely and lead with the verified angles below.

## Linkworthy angle (only claims that survived verification)

1. **Zero commercial surface — VERIFIED UNIQUE.** Our page: no affiliate links, no ads, no sign-up, client-side only, plus GambleAware/GA links (fetched 2026-08-27). AceOdds' converter carries a bet365 banner and promo-code links throughout; Action Network's carries BetMGM/DraftKings/FanDuel/bet365 affiliate links and a "commercial content" disclaimer. For a LibGuide or curated list, "free + no lead-gen + no operator ads" is the difference between linkable and not. **This is the lead angle.**
2. **Margin caveat in the result itself — TRUE but not unique.** Our tool prints "The implied probability includes the bookmaker's margin" next to the number and hands off to the no-vig margin calculator. Do **not** claim affiliate tools "structurally can't say this" — Action Network's calculator page explains the vig explicitly ("That extra 4.76% is the sportsbook's built-in margin"). Honest phrasing: *the caveat is attached to the result, not buried in explainer prose, and the site has no incentive to soften it.*
3. **Insider-built (supporting, tech venues only):** author is a QA/SDET on a casino platform — credible "person from inside the machine showing you the cost" story for HN / Ministry of Testing. Pairs with the blackjack tool's data being verified against Wizard of Odds (a genuine oracle-testing story).
4. **(Only after Option A ships):** canonical bookmaker fractions. Until then this claim is banned from every pitch.

## Communities (with rules)

### 1. Mathematics Stack Exchange + Cross Validated — GATED on manual verification, then low risk
- **Policy:** the quoted self-promotion policy ("disclose your affiliation… links are not a substitute for including information in your answer itself") matches SE's network-wide help text, but **SE could not be fetched from this environment** — the API-verified thread list in the previous draft is not reproducible here. Before writing anything: open https://math.stackexchange.com/help/promotion in a normal browser and re-quote it, and confirm each candidate thread exists and is still unanswered.
- **Candidate threads to verify manually** (ids from the previous draft, unconfirmed): 4973287, 4658788, 4600705, 2858370 (math.SE); 618529 (stats.SE). The topics (implied probability summing over 100%, EV from decimal odds) are exactly our material regardless — if these ids are stale, search `implied probability bookmaker` on both sites for replacements.
- **Action:** complete mathematical answers, formulas and worked example in-post; at most one closing line "Disclosure: I maintain a free, ad-free converter that shows this — [link]", and only where a live demo genuinely adds something. The answer must fully solve the problem without the link.
- **Effort:** 3–4 h for 3–5 answers. **Risk: low once rules and threads are re-verified in a browser.** Note: SE links are nofollow — the value is evergreen traffic and citations, not link equity.

### 2. SBR Forum (sportsbookreview.com/forum) — CLEARED with care, medium risk
- **Verified live 2026-08-27.** Rules re-fetched and confirmed verbatim: *"Spam and third-party solicitation of any kind are not permitted in the forum."* / *"Links to external websites are allowed for the purpose of information sharing. However, links to websites for the purpose of advertising/promoting will result in an infraction."* Also confirmed: referral links to books/casinos are banned (irrelevant to us — we have none) and PM recruiting is prohibited.
- **Action:** register; answer odds-format/implied-probability questions in the Newbie Forum with the math written out in the post; drop the link **only when someone asks for a calculator**. No signature links, no thread about the tool, no PM outreach. Build 2–3 weeks of link-free post history first.
- **Effort:** ~1 h/week ongoing. **Risk: medium** — "information sharing vs advertising" is a mod judgment call; the post-history buffer is mandatory, not optional.

### 3. Reddit (r/algobetting, r/sportsbook, r/sportsbetting) — NOT CLEARED, unchanged
- Rules unfetchable from this environment; hard constraint (quote the policy first) unmet. Working assumption: **r/sportsbook = read-only**. r/algobetting: verify rules in a browser; if permitted, the only honest post is a math write-up — and note the fraction write-up is only possible **after Option A ships**, since the current algorithm is a five-line textbook continued-fraction routine, not a story.
- **Risk: unassessed = high by default → blocked until rules are read and recorded.**

## Directories

### 1. GitHub awesome-lists — one of two venues is DEAD
- **[ianalloway/awesome-sports-betting](https://github.com/ianalloway/awesome-sports-betting) — REMOVED.** Re-fetched 2026-08-27: the repository was **archived by its owner on July 14, 2026** and is read-only. The previous draft misread the archive date as a recent push. No PR is possible. (Its CONTRIBUTING criteria are moot.)
- **[JacobiusMakes/awesome-sports-betting-data](https://github.com/JacobiusMakes/awesome-sports-betting-data)** — exists, links verified live 2026-08-27, scope includes "open source tools … communities, and responsible gambling resources", contributing docs welcome additions in a neutral one-line style with a liveness check. **But it has 2 commits total and is brand new — near-zero authority and traffic.** Also: GitHub adds `rel=nofollow` to README links, so the previous draft's "indexed dofollow links this week" was wrong for this whole category. Do the PR because it costs 30 minutes and is fully rule-compliant (disclose authorship in the PR description), not because it moves rankings.
- **Effort:** 30 min. **Risk: low. Value: low — demoted from priority #1.**

### 2. SaaSHub — verified free (re-fetched 2026-08-27)
- Quote confirmed: "This is our free marketing tool that helps you to promote your product." Submit → verify → categorize. **Do not** use the "post to all relevant directories" bulk flow — each directory only after reading its own rules. **Effort:** 30 min. **Risk: low.**

### 3. AlternativeTo — verified free, self-submission explicitly allowed (re-fetched 2026-08-27)
- Confirmed: "You can add it yourself :) Just sign up for an account"; descriptions must not contain links (dedicated URL fields exist); no profile advertising; no incentivized upvotes. **The $5 "priority review" is a paid option — skip it (zero budget); the free queue can take months, accept that.** Position as alternative to AceOdds / Action Network *calculators* (concrete pages, both affiliate-laden), neutral description. **Effort:** 30 min. **Risk: low.**

### 4. Product Hunt — pending one manual read (unchanged)
- Read "Can I post my own product on Product Hunt?" and the Community Guidelines in a browser before anything. If cleared, launch the whole `/tools/` suite as one product ("gambling math, cost not winnings"), not a lone converter. **Risk: low-med until read.**

## Resource pages

### 1. Princeton University LibGuide — Gambling (Sports guide) — verified live 2026-08-27
- Re-fetched: last updated Jul 9 2026; links Odds Portal, Sports Odds History, UNLV Center for Gaming Research, Legal Sports Report, Statista. **Correction:** no named guide owner is displayed — contact is the "Sports librarian" profile link on the guide, fallback l-support@princeton.edu.
- **Action:** 5-sentence email: free, ad-free, no-affiliate odds converter whose implied-probability output explains the bookmaker margin — useful for students reading the odds archives the guide already links (formats differ across archives). Lead with angle #1 (no commercial surface) — that is the only thing a librarian can't get from the affiliate converters. One polite nudge max.
- **Effort:** 30 min. **Risk: low** (worst case: silence).

### 2. Other university LibGuides (replication)
- Manual search `site:libguides.com gambling OR "sports analytics"`; UNLV gaming-research guides are the natural second target. Only email guides that already link external tools/data. **Effort:** 1–2 h for 3–5 emails. **Risk: low.**

### 3. Responsible-gambling education pages — park for the wagering calculator (unchanged, correct call)
- The odds converter is a bettor-workflow tool; forcing it on RG orgs reads as link-begging. The wagering calculator ("expected cost of clearing a bonus") is the honest RG pitch — separate plan, later.

## B2B / industry

### 1. Ministry of Testing Club — verified rules (re-fetched 2026-08-27), ideal insider fit
- Confirmed: "Self-promotion is allowed in the Blogs, Books, Videos & Audio category"; product mentions elsewhere only "in direct response to a question asked by a member … that your product could genuinely help with"; "don't pretend to not be a tool vendor."
- **Action (title corrected — the old one was built on the false 15/8 claim):** write **"Oracle testing a gambling calculator: verifying a blackjack house-edge tool against Wizard of Odds"** — a true story (the repo's `src/data/blackjack-house-edge.ts` data is verified against WoO), with property-based round-trip testing of the odds converter as the second act. If Option A ships, the ladder-snap becomes a legitimate third act. Post in the allowed category with full disclosure.
- **Effort:** 4–6 h. **Risk: low.** Value: credibility + exact-persona referral traffic; assume nofollow.

### 2. Show HN — guidelines verified (re-fetched 2026-08-27)
- Confirmed: "for something you've made that other people can play with"; "ideally without barriers such as signups or emails"; non-trivial; no upvote solicitation. The suite qualifies; a lone converter is borderline-trivial for HN.
- **Action (title corrected):** launch the **suite**, not the converter: "Show HN: Free gambling-math calculators that show the cost, not how to win (no ads, no affiliate)". The QA-insider framing carries it. **Never** use the 15/8 claim unless Option A has shipped and been re-verified. Be present in comments all day.
- **Effort:** 2–3 h. **Risk: low-med** (worst case: no traction; HN links nofollow — value is audience and secondary citations).

### 3. The Closing Line (Dustin Gouker) — verified live 2026-08-27, **6,000+ subscribers** (previous draft said 4k+)
- One courteous FYI email, zero follow-up, no link ask. **Effort:** 20 min. **Risk: low.** Treat as a free lottery ticket.

## What NOT to do (updated)

- **No use of the "canonical bookmaker fractions / 2.88 → 15/8" claim anywhere** until the ladder-snap change ships — the live tool outputs 47/25 and any commenter can prove it in one screenshot.
- No PR to the archived ianalloway list (impossible) and no hunting for mirrors/forks of it to spam instead.
- No Reddit or Stack Exchange posts until each venue's rules (and, for SE, each target thread) are re-read in a normal browser and recorded — neither network is verifiable from this environment.
- No link-only SE answers; never omit the affiliation disclosure.
- No signature links, promo threads, or PM outreach on SBR; 2–3 weeks of link-free history before the first link, and links only when asked.
- No $5 AlternativeTo priority review, no paid placements of any kind, no SaaSHub bulk directory blast.
- No upvote solicitation anywhere.
- Never pitch as helping anyone win; every line stays on "the margin is visible / the cost is honest" — also the only framing librarians can link.
- No affiliate "best betting tools" roundups (pay-to-play ecosystems; contradicts positioning).

## Priority order (re-ranked by verified impact/effort — the old #1 is dead and its SEO premise was false)

| # | Action | Effort | Risk | Why here |
|---|--------|--------|------|----------|
| 0 | Decide Option A (ladder-snap code) vs Option B (drop fraction claim); rewrite pitches accordingly | 1–2 h | — | Every outreach below inherits its honesty from this |
| 1 | Princeton LibGuide email + 3–4 sibling .edu guides | 1–2 h | low | Only realistic *followed* .edu links for a no-affiliate site; angle #1 is tailor-made for librarians |
| 2 | Manually verify SE threads/policy in a browser, then 3–5 disclosed answers | 3–4 h + gate | low after gate | Evergreen pages ranking for the exact question; traffic, not link equity |
| 3 | SaaSHub + AlternativeTo (free queue) + JacobiusMakes PR | 1.5 h | low | Cheap baseline presence; zero expectations, zero risk |
| 4 | Show HN — whole suite, honest title | 2–3 h | low-med | Traffic spike + secondary citations; after #1–#3 so arrivals see a settled page |
| 5 | Ministry of Testing article (oracle-testing angle) | 4–6 h | low | Credibility in the exact insider persona; week 2–3 |

Then: SBR Newbie Forum participation (ongoing, links only on request, after 2–3 weeks of history), Product Hunt after reading its two policy articles in a browser, Reddit only after per-subreddit rule review, Closing Line FYI whenever convenient.

Sources (all re-fetched 2026-08-27 unless noted): live tool page + `src/pages/[lang]/tools/odds-converter.astro` (algorithm executed) · [AceOdds converter](https://www.aceodds.com/bet-calculator/odds-converter.html) · [Action Network calculator](https://www.actionnetwork.com/betting-calculators/betting-odds-calculator) · [SBR forum FAQ](https://www.sportsbookreview.com/forum/faq/) · [ianalloway repo — archived](https://github.com/ianalloway/awesome-sports-betting) · [JacobiusMakes repo](https://github.com/JacobiusMakes/awesome-sports-betting-data) · [SaaSHub submit](https://www.saashub.com/submit) · [AlternativeTo FAQ](https://alternativeto.net/faq/) · [Princeton LibGuide](https://libguides.princeton.edu/c.php?g=1061591&p=7718583) · [MoT Club FAQ](https://club.ministryoftesting.com/faq) · [Show HN guidelines](https://news.ycombinator.com/showhn.html) · [The Closing Line](https://closingline.substack.com) · Stack Exchange & Reddit: NOT fetchable from this environment — gated.