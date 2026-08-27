<!-- approved: False | verifier issues: 12 -->

# Promotion plan — /en/tools/margin-calculator/ (bookmaker margin + no-vig fair odds)

Research date: 2026-08-27, adversarially re-verified 2026-08-27 (every venue URL re-fetched; dead and misread venues removed; misquoted claims corrected against sources). Method note: Reddit is blocked for automated access in this environment, so **no Reddit venue below is actionable until a human reads the subreddit rules in a normal browser**. The same standard now applies to every venue whose rules could not be fetched (GPWA, Bet Angel, Casinomeister, Stack Exchange help pages) — they are listed as unverified leads, not actions.

## Linkworthy angle (corrected against live pages)

1. **Operator-free among the calculators that rank.** Verified by fetch: gottheodds.com's margin calculator carries Betway/QuinnBet/Parimatch/Matchbook affiliate CTAs; bettoolkit.com's overround calculator carries Vave/IviBet/CasperBets affiliate blocks and a "Top Bookmakers" section. Ve7as has zero operator links, no ads, no account — verified on our live page. **Do not claim "the only one"** — that absolute is unprovable and one counterexample away from a devastating HN comment. The honest, defensible pitch: *"none of the ranking margin/no-vig calculators we checked is operator-free; this one is, by design — the site takes no affiliate money at all."* That is the property that lets a responsible-gambling educator, teacher, or journalist cite it without endorsing a bookmaker. Lead with it in every pitch.
2. **Honest methodology framing — already live, needs one refinement.** The tool page already says: *"The calculator uses proportional normalisation. Real margin is distributed unevenly across outcomes, especially on favourites and longshots. Verify calculations yourself."* That is most of the differentiation (competitors label devigged output "true probabilities"; Betscope's "The Limitations of the No-Vig Calculator" and old Wizard of Vegas threads — e.g. "Vig Allocation", Aug 2018 — make the same correction). Remaining copy work: name the method explicitly — *"multiplicative (proportional) devig — one of several models; Shin, power and others exist and give different answers on longshots"* — ideally with a link to our own explainer. This keeps us on-brand: mathematical cost, not ways to win.
3. **N outcomes is a parity requirement, not an unmet need — this correction matters.** The 2022 Wizard of Vegas thread "Multi-way no-vig fair odds calculator?" **was answered in-thread**: arbitragecalc.com was recommended and tested to 13 outcomes, plus Excel approaches. Additionally, gottheodds supports 10+ outcomes and bettoolkit unlimited — both affiliate-laden. So: (a) never pitch our tool as "the answer to an unresolved forum request" — regulars will remember the thread was answered, and the pitch collapses; (b) our current 3-outcome cap is *behind* the affiliate competitors, which undercuts the clean-alternative story ("free of operators but also less capable" is a weak pitch). **Extend to N outcomes before any outreach push** — small client-side change, and it makes angle 1 survive scrutiny.
4. Secondary: client-side/no-signup (privacy for a YMYL audience) and the ES version (`/es/tools/…`), where competition for "margen de casa de apuestas calculadora" is far thinner.

## Communities (rules fetched and quoted)

### 1. Wizard of Vegas forum — wizardofvegas.com/forum/ (Sports Betting subforum)
- **What it is:** the gambling-math community around Wizard of Odds (whose data our blackjack tool already cites). Exactly our audience: math-first, anti-hype.
- **Rules (fetched from https://wizardofvegas.com/forum/info/rules/2-forum-rules/):** "We have a zero-tolerance policy for spam. Anyone found or perceived to be spamming may be permanently banned from the forum." "No free advertising. If you want to advertise on this site then expect to pay. Members in good standing may plug their own product or service, with prior permission." Also explicit: **"Definitely don't post an ad in your very first message!"** New accounts for 30 days: threads capped at days-of-membership + 2, posts at days + 10.
- **Thread status (re-verified by fetch):**
  - "Multi-way no-vig fair odds calculator?" (Sept 2022) — exists, but **already answered in-thread** with arbitragecalc.com (works to 13 outcomes) and Excel methods. Not an open request.
  - "Vig Allocation" (thread 31372) — **August 2018, not live.** Useful as evidence that this community rejects "no-vig = true odds" framing; **never a posting target** (necro + link = "perceived to be spamming" = permanent ban).
  - "How many sportsbooks do you use for line shopping?" — Jul 31, 2026, verified on the forum index; a conversation thread, not a tool request.
- **Realistic action (revised down):** register, participate genuinely in the sports/math subforums for a few weeks (worked math, no links). Then, **only with prior moderator permission**, offer the tool where it genuinely adds something — the honest post in the 2022 thread is *"arbitragecalc was suggested above and works; here is an operator-free alternative that also states its devig model"*, and only after N-outcome support ships. Expected value is lower than originally hoped (the thread has an answer); the community relationship is the real asset. Effort: 3–5 h over ~a month. **Risk: low-med only with the permission step; without it, ban.**

### 2. betting-forum.com
- **What it is:** active general betting forum (XenForo); carries sportsbook affiliate links in its own guides (disclosed in its terms), so editorially not neutral, but discussion is real.
- **Rules (fetched from https://www.betting-forum.com/help/terms/):** no dedicated self-promo clause; content must not be "spam or spam-like"; "We may remove or modify any Content submitted at any time, with or without cause, with or without notice." Promotion is at moderator discretion.
- **Thread (re-verified by fetch):** "Guide - What Is Overround in Sports Betting?" — https://www.betting-forum.com/threads/what-is-overround-in-sports-betting.46507/ — posted Dec 11, 2025; thin but genuine discussion (one substantive reply); the guide gives manual formulas and suggests "a simple spreadsheet", no interactive tool.
- **Realistic action:** reply with a worked 3-outcome devig example that adds to the guide, link once, disclose: "I built this, it's free, no signup, no bookmaker links." Effort: 30–60 min. **Risk: medium** (pure mod discretion). One post; a removal is an answer, never repost.

### 3. Hacker News — Show HN
- **Rules (fetched from https://news.ycombinator.com/showhn.html):** Show HN is for "something you've made that other people can play with"; off-topic: "blog posts, sign-up pages, newsletters, lists, and other reading material"; "something you've worked on personally and which you're around to discuss"; "make it easy for users to try your thing out, ideally without barriers such as signups or emails"; and "Don't post quickly-generated one-offs" — be ready to show the work (verified data sources, methodology page).
- **Realistic action:** one Show HN — e.g. "Show HN: See what your bookmaker charges you (no-vig fair odds calculator)" — on a day the owner can answer comments all day. Methodology questions WILL come; the QA-insider story and the multiplicative-vs-Shin honesty are the comment-thread gold. Post after N-outcome support ships (the first comment otherwise: "X does more outcomes"). Effort: 1–2 h prep + a day of replies. **Risk: low** (worst case: no traction).

### 4. Stack Exchange (Cross Validated / math.SE) — reference, mostly negative
- **Caveat:** the /help/promotion page could not be fetched from this environment (SE domains blocked); the standard policy — disclose affiliation, links only to support the answer's own content, don't be there just to drive traffic — is quoted from general knowledge, **re-read it on-site before any post**.
- **Reality check (SE API):** on-topic questions are old and tiny (e.g. "How to distribute overround over probabilities?", stats.SE 2016, ~200 views, 0 answers). **Realistic action: none for link-building.** Answering that question with full worked math (link optional, affiliation disclosed) is fine citizenship if the owner enjoys SE. Effort: 1 h. Treat the link as strictly optional.

### Unverified leads (manual rule-reading required before ANY action)
- **Reddit** (r/sportsbook, r/algobetting, r/gamblingmath): where the question recurs most, but reddit.com rejects our crawler and browser. r/sportsbook has historically banned advertising/touting outright. **Default assumption: prohibited.** No action until the owner reads each subreddit's rules and finds an explicit allowance.
- **GPWA forum (gpwa.org)** — moved here from the action list: the forum 403s to automation, so its rules and section structure could not be read; acting on second-hand descriptions fails our own standard. Its Link Exchange subforum is off-limits under our hard constraints regardless. If the owner joins and reads the rules: a general-discussion thread about running a non-affiliate portal is the only conceivable post; never links-first.
- **Bet Angel forum** (forum.betangel.com): on-point thread surfaced in search ("Remove overround margin and make fair prices", t=24173) but the site is Cloudflare-gated and its rules unreadable. Vendor forums usually dislike third-party tool links. Read rules manually first.
- **Casinomeister**: terms 403'd to automation. Read manually before considering.

## Directories

1. **SaaSHub — https://www.saashub.com/services/submit** — verified free ("Our free tool that helps you to promote your product"). Requirements verified: needs listed categories and competitors (list OddsJam etc. — that's honest), domain email helps, rejects free-subdomain and non-English products (ve7as.com passes both). Submit the tools hub page. Effort: 20 min. Risk: low.
2. **AlternativeTo** — free listing confirmed via multiple third-party guides (account must be ≥7 days old; review takes days). Note: the submit URL 404s when logged out — create the account now, then use the user-menu "Suggest new application" flow after 7 days. List as alternative to the calculator suites of OddsJam / gottheodds — the "free, no affiliate" contrast is the whole value. Effort: 30 min + wait. Risk: low.
3. **GitHub awesome lists — corrected:**
   - ~~ianalloway/awesome-sports-betting~~ — **removed: archived by owner July 14, 2026, read-only. PRs impossible.**
   - **nekzabirov/awesome-igaming** — exists and accepts PRs, but its scope is *open-source software for building iGaming platforms* (engines, backends, RNG). A calculator page is a weak fit and a drive-by PR would read as link-dropping. **Action: open an issue first** asking whether the (public) ve7as repo qualifies as a resource; PR only on a yes. Effort: 15 min. Risk: low (worst case: "no").
4. **Skip:** AI-tool directories (wrong category), generic "directory submission" lists (the link-scheme swamp our hard constraints exist for).

## Resource pages

1. **penaltyblog / pena.lt — Martin Eastwood.** Verified: "From Biased Odds to Fair Probabilities: Removing the Bookmaker's Overround" (Sept 14, 2025, https://pena.lt/y/2025/09/14/from-biased-odds-to-fair-probabilities/) presents **seven** devig methods as Python code in the penaltyblog package — no interactive tool on the site. Contact form verified at https://pena.lt/y/contact. Pitch honestly: "an in-browser companion for readers who don't run Python — it implements the multiplicative method your article covers, says so on the page, and links out for the others; free, no operators." Do not imply we implement all seven. Effort: 20 min. Risk: low (worst case, silence).
2. **Matter of Stats — matterofstats.com/what-is-vig-and-overround.** Verified: Tony Corke's vig/overround primer, email published on the page, no external calculator linked. Same companion-tool pitch. Effort: 15 min. Risk: low.
3. **easy.vegas — Michael Bluejay — downgraded to optional, rewritten.** His contact page (fetched) explicitly refuses link trades ("I will NOT trade links with you. Do not ask"), guest posts, infographics, and mocks SEO cold outreach. He accepts "corrections, updates, or suggestions" only. The *only* mail that fits: a genuine short suggestion with zero ask — "you teach house-edge math; here's a free no-affiliate blackjack house-edge calculator (data cross-checked against Wizard of Odds) if it's ever useful to your readers — no reply needed." Expect silence; anything more salesy lands us in the category he ridicules publicly. Effort: 10 min. Risk to reputation: real if written like outreach; near-zero if written as a reader's note.
4. **Journalist's Toolbox — journaliststoolbox.ai (Mike Reilley).** Verified: "Submit a Site for Consideration" form exists; the site has a "Writing with numbers" page ("math for journalists 101… helpful online calculators") — exactly where this belongs. Pitch: "check what a bookmaker charges before quoting odds in a story." Effort: 15 min. Risk: low.
5. **Not pursued:** big RG charities (BeGambleAware, NCPG) — they don't link small third-party tools; teaching-materials repositories (ASA STEW) require authoring lesson plans — someday-stretch.

## B2B/industry

1. **GPWA — moved to unverified leads** (rules unreadable to automation; same standard as Reddit). See above.
2. **LinkedIn (own profile).** No gatekeeper, free; the insider story ("I QA a casino platform; I built the calculator that shows what the margin costs you") fits the iGaming B2B feed. One post; group posting only where a group's rules, actually read, allow it. Effort: 1 h. Risk: low.
3. **Trade-press op-ed (iGaming Business / SBC / NEXT.io)** — contributed-content routes not verifiable as open submission pages in this pass; a later, higher-effort play once the tool has usage numbers to cite.

## What NOT to do on these venues

- **No Reddit posts of any kind** until a human reads the specific subreddit's rules — assume prohibited by default. The same rule now covers **GPWA, Bet Angel, Casinomeister and Stack Exchange**: unreadable rules = no action.
- **Wizard of Vegas: never link without prior moderator permission**; never in a first message; never necro the 2018 "Vig Allocation" thread; and **never claim the 2022 calculator thread went unanswered** — it was answered with arbitragecalc.com, and misrepresenting that to justify a post is exactly what gets a new account read as a spammer.
- **Never claim to be "the only" operator-free calculator** — say which competitors were checked and what was found.
- **No necro-answering Stack Exchange with calculator links** — answers must contain the math; links only in support; affiliation disclosed.
- **No GPWA Link Exchange subforum, ever** — link exchange is a hard-constraint violation on our side, whatever their rules say.
- **No Wikipedia external-link edits** (Vigorish / Mathematics of bookmaking) — COI self-linking, guaranteed revert, reputational damage.
- **Never frame the tool as "find +EV", "beat the vig", "win more"** — every venue gets the cost-transparency framing. Brand rule, and on HN/educator venues the only framing that works.
- **One post per venue, disclosed authorship, never repost after removal.** A removal is an answer, not an obstacle.

## Priority order (top 5 actions with effort)

1. **Ship N-outcome support + name the devig model in the copy** ("multiplicative/proportional — one of several models; others differ on longshots"). ~Half a day of dev. Reason (corrected): *parity, not unmet need* — affiliate competitors already do 10+ outcomes, and the operator-free pitch collapses if the free tool is also the less capable one. The existing caveat text stays; it only gains the model's name.
2. **Email Martin Eastwood (penaltyblog contact form)** — honest companion-tool pitch for the Sept 2025 article (we implement one of his seven methods and say so). 20 min, low risk, best link-quality-per-minute on this list.
3. **Show HN** — "Show HN: See what your bookmaker charges you" — after action 1 ships. 1–2 h prep, one day of comment presence. Biggest reach at zero venue-risk; rules fetched and fully satisfied.
4. **Email Tony Corke (Matter of Stats) + Journalist's Toolbox submission form** — one batch, ~45 min, both verified and low risk. Optionally add the zero-ask easy.vegas note (blackjack tool angle) written as a reader suggestion, not outreach.
5. **Directory batch: SaaSHub submit now + AlternativeTo account now (submit after the 7-day wait) + one ask-first issue on awesome-igaming** — ~1 h total, low risk, done once. (The awesome-sports-betting PR is gone: repo archived July 2026.)

Slow-burn track (start now, pays off in a month): register on Wizard of Vegas, contribute math answers with no links for several weeks, then request moderator permission before any tool mention — and if permission is granted for the 2022 thread, the post acknowledges arbitragecalc was already suggested and offers ours strictly as the operator-free, model-disclosed alternative.