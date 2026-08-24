<!-- approved: True | verifier issues: 10 -->

# Content brief: How RNG certification really works (GLI, eCOGRA, iTech Labs)

## Working titles (3 options, <=60 chars each)

1. How RNG Certification Really Works (GLI, eCOGRA, iTech) — 55 chars
2. RNG Certification Explained: What Labs Actually Test — 52 chars
3. What a Casino RNG Certificate Proves — and What It Doesn't — 58 chars

## Search intent (one intent, one sentence)

Informational: a player (or curious industry newcomer) wants to understand what actually happens when a testing lab certifies a casino RNG and whether that certificate means the games are trustworthy.

## Target queries (primary 1, secondary 3-5, long-tail 5-8)

**Primary:** how is casino RNG certified

**Secondary:**
- RNG certification
- RNG testing labs
- GLI-19 standard
- eCOGRA certification
- iTech Labs certificate

**Long-tail:**
- what does an RNG certificate mean
- how to check if a casino RNG is certified
- are online casino RNGs really random
- GLI vs eCOGRA vs iTech Labs
- what do testing labs check in casino games
- does RNG certification guarantee fair games
- how to read an RNG certificate
- Marsaglia diehard tests casino RNG

## SERP snapshot & our gap (what ranks now, why it is weak, what we add that nobody has)

Verified 2026-08-24 across four query variants. The SERP is split into five clusters, none of which serves a player:

1. **Lab marketing pages** (ecogra.org service pages, itechlabs.com FAQ) — accurate but written to sell certification to B2B buyers; they describe *that* they test, not *how* or *what it means for you*.
2. **B2B licensing/legal firms** (Key2Law, Law & Trust, crystal.tax, jurisprudential.eu, WorkLooper) — "we'll get you a certificate" sales pages aimed at operators, zero player value.
3. **Dev shops** (SDLC Corp, SipherTech) — generic "complete guides" with recycled claims and no primary citations.
4. **Affiliate blogs** (next.io, casinogrounds, gamblingnerd, lcb.org) — surface-level "RNG = fairness" reassurance that exists to funnel readers to casino listings.
5. **Outright PBN spam** (readby3rd.org, misrct.com — both stamped August 2026) — machine-spun filler.

**Nobody on page one:** (a) walks through the actual lab pipeline (source review → raw output statistical suites → scaling/mapping/shuffling tests → fingerprinting → scoped certificate), (b) shows a real certificate and teaches the reader to parse its scope, date, and disclaimer, (c) states plainly what a certificate does NOT guarantee. We add all three, grounded in primary standards (GLI-19, UKGC RTS 7, NIST SP 800-22) plus first-hand platform-QA experience of what happens on the operator side between audits — a perspective affiliates structurally cannot have and labs won't publish.

## Reader outcome (what the reader can DO after reading)

After reading, the reader can: locate the RNG/testing certificate on a casino or game-provider site; read its fields (issuer, scope, standard tested against, date, verification link) and spot red flags (expired date, certificate for a different product, unverifiable logo); cross-check the certificate on the lab's own site; and correctly calibrate what the certificate proves (the tested build produced statistically random output under the named standard at test time) versus what it does not (RTP generosity, payout speed, operator honesty, or the behavior of any code shipped after testing).

## Outline (H2/H3 with 1-2 sentence guidance per section; direct answer must land in the first two paragraphs — AEO requirement)

**Intro (no heading, 2 paragraphs — the AEO direct answer).** Paragraph 1 answers the primary query in ~50 words: an accredited independent lab (GLI, eCOGRA, iTech Labs) receives the RNG's source code and a compiled build, reviews the implementation, runs large statistical test batteries on both raw and scaled output, and issues a certificate scoped to that exact code version and standard. Paragraph 2 sets the article's honest frame: a certificate is a component test of one build at one point in time — the piece explains what's inside that test and where its guarantees end.

**H2: Who actually certifies RNGs — and who gave them the authority**
Introduce GLI, eCOGRA, iTech Labs as independent test houses; explain the authority chain: regulators (UKGC, MGA, and others) approve/recognize test houses and licensees must use approved labs (supported by the UKGC testing strategy source). Kills the common misconception that labs are casino-run. [VERIFY-BEFORE-ASSERT: the ISO/IEC 17025 accreditation claim must be confirmed per lab against each lab's own published accreditation certificate/scope before it is stated for any of the three — it is not covered by the primary sources below; drop or qualify it for any lab where confirmation fails.]

**H2: What the lab receives from the platform**
Source code, compiled builds, RNG technical documentation, sometimes back-end access to a working environment with test player accounts (per iTech Labs FAQ). [OWNER-VERIFY: describe the real submission package from the platform side.]

**H2: What the lab actually tests**
- **H3: Source code review** — verifying the implementation matches the documentation and uses a sound algorithm with no known weaknesses (per UKGC testing procedure).
- **H3: Statistical test suites on raw output** — diehard tests, NIST SP 800-22-style batteries, chi-square/serial correlation; explain in plain language what "passing" means (no detectable pattern at a given confidence level, not "proven random"). Include the one-sentence caveat that statistics can only fail to find bias, never prove its absence.
- **H3: Scaling and mapping — where the real bugs live** — raw 32/64-bit output must be mapped to game ranges (reel positions, cards); explain modulo bias in one accessible example. UKGC RTS 7 explicitly requires scaling to preserve randomness. [OWNER-VERIFY: real-world scaling/mapping defect patterns seen in QA.]
- **H3: Shuffling and game-specific checks** — card sequences must be unpredictable, non-repeatable, uniformly distributed (visible verbatim in the sample iTech certificate).
- **H3: Fingerprinting the certified code** — the lab hashes the exact certified build so anyone can later verify production matches what was tested.

**H2: The standards behind the test: GLI-19, UKGC RTS 7 and friends**
Short, concrete tour: GLI-19 as the de facto interactive-gaming benchmark; RTS 7's "acceptably random" definition and its ban on adaptive/compensated games (worth an explicit call-out — many players believe slots "tighten up" after a win; RTS 7 prohibits exactly that in regulated markets). Do not attempt a full standards catalogue.

**H2: What happens after the certificate is issued**
Periodic RTP audits, change management (what triggers re-testing), the gap between the fingerprinted build and whatever ships next Tuesday. This is the section competitors can't write. [OWNER-VERIFY: entire section.]

**H2: What a certificate does — and does not — guarantee**
The centerpiece. Does: the tested build's output passed the named statistical standard at test time. Does not: guarantee the game is generous, that the RTP is high, that the operator pays out, that post-certification code is unchanged, or that "certified" covers every game on the site. Quote the disclaimer concept from the real iTech certificate in paraphrase (the certificate's exact wording — "a level of testing appropriate for a component test of this type" — is verified present in the source document).

**H2: How to find and read an RNG certificate**
Walk through the anatomy of a real certificate (issuer, operator, provider, scope line, standard footnote, signatures, validity date, verification link) using the public iTech Labs sample as the reference; give a 5-point checklist for verifying a cert badge actually resolves to the lab's domain. NOTE: the exhibit certificate is dated 31 December 2019 — since this very section teaches "old/expired date" as a red flag, the text must acknowledge the exhibit's age explicitly and use it strictly as an anatomy specimen, never as an example of a currently valid certificate.

**H2: FAQ**
3-4 questions mined from long-tail queries: "Can a certified RNG still be rigged?", "Why do certificates expire?", "Is a lab certificate the same as a gambling license?", "Do all games on a casino need certification?" Keep answers 40-60 words each for featured-snippet eligibility.

## Insider input required (specific questions ONLY the owner/platform QA can answer — this is the E-E-A-T core; 5-10 pointed questions)

1. What exactly does the platform hand over to the lab — repo access, a tagged build, RNG design docs? Who writes the RNG technical documentation the lab reviews, and how detailed is it really?
2. How is the certified-code fingerprint enforced against production deploys — is there a CI gate comparing hashes, or is it a manual/audit-time check? Has a mismatch ever been caught?
3. When a hotfix touches game math or the RNG service, what triggers re-certification? Who decides "major vs minor change," and how conservative is that call in practice?
4. Have you seen scaling/mapping defects (modulo bias, off-by-one on reel strips or card indices) surface in QA *after* the core RNG passed certification? What did the defect look like from a test perspective?
5. Architecturally, is the RNG one certified shared service that all games call, or does each game/provider bundle its own? What does that mean for how far one certificate stretches?
6. What does the lab-platform interaction actually look like — how many review iterations, what do labs fail or query first (docs? seeding? scaling?), and how long does a certification round take end to end?
7. Between formal audits, does the platform run its own statistical monitoring (live RTP tracking, RNG health checks)? What does QA look at, and what would trigger an internal alarm?
8. In your experience, who ever actually asks to see the certificate — regulators, operators integrating a provider, players? How often is it checked versus assumed?
9. Fact-check pass: every claim in the "What happens after the certificate" and "scaling and mapping" sections must be confirmed or corrected against platform reality before publication.

## Primary sources (verified URLs with what each supports)

All URLs fetched and confirmed resolving on 2026-08-24:

1. **GLI-19 v3.0, Standards for Interactive Gaming Systems (PDF)** — https://gaminglabs.com/wp-content/uploads/2020/07/GLI-19-Interactive-Gaming-Systems-v3.0.pdf — the benchmark standard itself; supports claims about what an interactive gaming system must demonstrate. (Verified: the PDF is genuine — title page reads "GLI-19: Standards for Interactive Gaming Systems, Version 3.0, Revision Date: July 17, 2020" — and it has a normal extractable text layer, so RNG-chapter clauses can be quoted directly during fact-check. v3.0 confirmed as the current published version as of 2026-08.)
2. **UKGC, Remote gambling and software technical standards — RTS 7 (Generation of random outcomes)** — https://www.gamblingcommission.gov.uk/standards/remote-gambling-and-software-technical-standards/rts-7-generation-of-random-outcomes — supports "acceptably random" definition, scaling-must-preserve-randomness requirement, prohibition of adaptive/compensated games ("Adaptive behaviour (that is, a compensated game) is not permitted" — confirmed on page).
3. **UKGC, Testing strategy for compliance with RTS** — https://www.gamblingcommission.gov.uk/strategy/testing-strategy-for-compliance-with-remote-gambling-and-software-technical — supports the approved-test-house model, testing procedure, annual games testing, live RTP monitoring, major/minor update classification (Annex A). (Page last updated 31 October 2025 — check for RTS 12-related changes during fact-check.)
4. **eCOGRA, RNG certification service page** — https://ecogra.org/services/random-number-generator-rng-certification/ — supports eCOGRA's stated methodology: source code review, statistical analysis, seed evaluation, periodic audits and post-certification spot checks; jurisdiction coverage (36+ jurisdictions listed as of 2026-08).
5. **iTech Labs FAQ + published sample RNG certificate** — https://itechlabs.com/faqs/ and https://itechlabs.com/certificates/BeyondGaming/RNG_Certificate_UK_BeyondGaming_ITL1903431_31Dec19.pdf — the FAQ supports methodology (source code evaluation; "for both [PRNGs and hardware generators], we test the raw numbers and scaled/shuffled output"; working site with player accounts and back-end access during testing); the certificate is the article's exhibit A: named scope ("Single deck without Joker Card games"), Marsaglia diehard tests, code fingerprinting, standards footnote (UK RTS June 2017 + Testing Strategy November 2018), and the component-test disclaimer — all confirmed present in the document. (Do not use iTech's `/certification-services/rng-testing-certification/` URL — it 404s.)
6. **NIST SP 800-22, Statistical Test Suite (project page)** — https://csrc.nist.gov/projects/random-bit-generation/documentation-and-software — supports the explanation of what statistical randomness test batteries are and that they're public, documented science, not lab secret sauce (hosts SP 800-22rev1a and the sts-2.1.2 software).

## Tables & visuals (which tables/figures are mandatory)

**Mandatory:**
1. **Lab comparison table** — GLI vs eCOGRA vs iTech Labs: headquarters, accreditation, flagship standard/service, where their certificates are published, typical footprint. Facts only, no "best lab" ranking. [VERIFY-BEFORE-ASSERT: every accreditation cell must be confirmed against the lab's own published accreditation documents before publication — do not assume ISO/IEC 17025 uniformly.]
2. **"Covers / does not cover" table** — two columns: what an RNG certificate guarantees vs what it does not. This is the shareable, snippet-bait asset of the article.
3. **Certification pipeline figure** — a simple step diagram: submission → source review → raw-output statistical suites → scaling/shuffling tests → report → scoped certificate + fingerprint → periodic audits. Redraw as site-native SVG/HTML, never screenshot lab material.
4. **Annotated certificate anatomy figure** — a schematic mock of a certificate (redrawn, generic — do NOT reproduce the iTech Labs certificate image) with callouts: issuer, scope line, standard footnote, date, verification link, disclaimer.

**Optional:** plain-language table of statistical tests (diehard, NIST SP 800-22 battery, chi-square, serial correlation) with one sentence on what kind of non-randomness each catches.

## Internal linking (which existing articles link here and with what anchors; where this article links out)

**Inbound (edit these existing EN articles to add a link here):**
- `/en/articles/how-to-choose-casino/` — anchor "how RNG certification actually works" in its game-fairness/licensing section (strongest topical pair).
- `/en/articles/how-to-develop-igaming-slots/` — anchor "independent lab certification" where the development lifecycle mentions testing/compliance.
- `/en/articles/poker-formats-guide/` — anchor "certified shuffling" where online poker fairness is mentioned (the sample certificate is literally a poker-room shuffle cert — natural fit).
- `/en/articles/lottery-formats-overview/` — anchor "how draw RNGs are certified" if the article touches digital draws.

**Outbound (from this article):**
- `/en/articles/how-to-choose-casino/` — in the "how to find and read a certificate" section, framed neutrally: checking certification is one of the verification checks discussed in the how-to-choose-casino explainer. (Do not frame the link as advice on "where to play.")
- `/en/articles/how-to-develop-igaming-slots/` — in the standards/pipeline section ("where certification sits in a slot's development lifecycle").
- `how-slots-are-tested` — flagged in the topic plan but NOT in the current published EN list; verify existence before adding the link, otherwise leave a TODO for when it publishes (it should become this article's closest sibling with reciprocal links).

Section placement: **casino-slots**. URL: `/en/articles/how-rng-certification-works/`.

## Schema & metadata (title <=60 chars, description 120-155 chars, Article fields)

- **Title tag (55 chars):** How RNG Certification Really Works (GLI, eCOGRA, iTech)
- **Meta description (147 chars):** What testing labs actually check before certifying a casino RNG — source code, statistical suites, scaling — and what a certificate does not prove.
- **Article schema:** `@type: Article` (not HowTo); `headline` = title; `author` = site author profile with the QA/SDET-in-iGaming credential stated in the bio (this is the E-E-A-T signal — do not publish under a nameless "editorial team"); `datePublished` / `dateModified`; `articleSection: casino-slots`; `inLanguage: en`; `about`: mentions of GLI, eCOGRA, iTech Labs, UK Gambling Commission as entities. If the FAQ block ships, add `FAQPage` markup for those 3-4 Q&As only (never mark up the whole article as FAQ).

## Length & tone (target words, reading level)

1,800-2,400 words. Explanatory and calm — an engineer explaining a system, not a blog reassuring or alarming anyone. Reading level ~grade 9-11: technical terms (scaling, fingerprinting, statistical suite) are allowed but each gets a one-sentence plain-language gloss on first use. First person is permitted exactly where the insider sections draw on the owner's platform experience ("on the platform I test…") — that's the differentiator, don't sand it off. No exclamation marks, no "fun" gambling idioms.

## What NOT to do (commercial drift traps specific to this topic)

- **No casino names, no "certified casinos" lists.** The moment this article names operators it becomes an affiliate page. The real Pokerbros/Beyond Gaming certificate is a *document exhibit* for the anatomy section only — reference the document's fields, do not present the operator as an example of a trustworthy site.
- **Never equate "certified" with "safe to deposit."** The whole point of the article is the opposite; any sentence implying "look for this badge and you're fine" is drift.
- **No "beat the RNG" adjacency.** Zero content about predicting outcomes, seed exploitation as a how-to, or "hot/cold" states — mention adaptive-game prohibition factually (RTS 7) without feeding the myth.
- **Do not reproduce the iTech Labs certificate image or lab logos** — redrawn generic schematic only; quoting document field labels is fine, wholesale copying of lab marketing copy is not.
- **No winnings framing anywhere:** certification is about statistical integrity, never about "your chances," "fair chances to win," or payout promises.
- **Do not duplicate the site's responsible-gambling block** (auto-appended by template) and do not contradict it — e.g., never end on "now you can play with confidence."
- **Mark every operational claim about the certification pipeline as requiring owner fact-check** — the model draft's descriptions of lab interactions are plausible reconstructions until QA-verified.

## Success metric (realistic: indexation/impressions horizon, not positions)

- Checkpoint at 2 weeks post-publication: is the URL indexed? (verify via GSC URL inspection; the SSR sitemap picks it up automatically). If not, investigate — no timeline is promised.
- First impressions on long-tail queries ("what does an RNG certificate mean", "how to read an RNG certificate", "GLI vs eCOGRA") expected to appear within 4-8 weeks; primary-query impressions within 8-16 weeks — this SERP is weak but the domain is young, so measure impressions and query-count growth in GSC, not positions.
- Secondary metric: this article becomes the internal-link hub for the fairness cluster (4 inbound links live at publication; reciprocal pair added when `how-slots-are-tested` ships).
- No ranking-position or traffic guarantees — the win condition at 90 days is: indexed, gathering impressions on ≥10 distinct queries, and cited as the canonical internal reference for "certification" mentions across the site.