# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Ve7as is a static, single-page SEO landing site (Russian-language) for an online casino/bookmaker rating portal. It is a plain HTML/CSS/JS site with no build step, package manager, framework, or test suite — just three files:

- `index.html` — entire page markup (nav, hero, ratings table, bonus cards, articles grid, FAQ, footer), plus inline JSON-LD structured data (`schema.org/WebSite`) and SEO meta tags (description, robots, Open Graph)
- `style.css` — all styling, organized into clearly delimited sections via `/* ── Section ── */` comment headers (Variables, Reset, Container, Nav, Hero, Sections, Casino Cards, Buttons, Bonus Grid, Articles, FAQ, Footer, Responsive)
- `script.js` — minimal vanilla JS, only handles the mobile burger-menu toggle

## Running locally

There is no build/dev server tooling configured. Open `index.html` directly in a browser, or serve the directory with any static file server, e.g.:

```bash
python3 -m http.server 8000
```

No lint, test, or build commands exist in this repo.

## Architecture & conventions

- **No build pipeline**: edits to `index.html`, `style.css`, `script.js` take effect immediately on page reload — there is nothing to compile or bundle.
- **CSS uses custom properties** defined in `:root` in `style.css` (`--bg`, `--gold`, `--green`, `--text`, `--radius`, `--max-w`, etc.). Reuse these variables rather than hardcoding colors/sizes to keep the dark gold/green theme consistent.
- **Sections are anchor-linked**: nav links (`#ratings`, `#bonuses`, `#articles`, `#faq`) correspond to `<section id="...">` blocks in `index.html`. Keep IDs and anchors in sync if sections are renamed or reordered.
- **Repeating card patterns**: casino rating rows (`.casino-card`), bonus cards (`.bonus-card`), article cards (`.article-card`), and FAQ items (`.faq-item` using native `<details>/<summary>`) each follow a copy-paste markup pattern in `index.html` with matching CSS blocks. When adding/editing entries, follow the existing markup structure for that card type exactly so styling and responsive behavior stay correct.
- **Responsive breakpoints** are at `768px` and `480px` at the bottom of `style.css` — mobile nav (burger menu), card grid collapsing, and stat spacing are adjusted there.
- **SEO-sensitive content**: `<title>`, meta description, Open Graph tags, and the JSON-LD block in `index.html`'s `<head>` are part of the site's purpose (SEO portal) — keep them accurate and in sync with on-page content (e.g., year references like "2026").
- All `href="#"` links throughout (CTA buttons, footer legal links, article links) are placeholders pending real destinations.
