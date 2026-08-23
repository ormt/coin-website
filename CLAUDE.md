# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the website for **COIN Pvt. Ltd.** (`coin.com.np`), hosted on GitHub Pages. Plain static HTML/CSS/JS with no build system, no package manager, and no dependencies.

## Development

**To preview locally:** Open any `index.html` directly in a browser — no server needed.

**To deploy:** Push to the `main` branch; GitHub Pages auto-deploys to `coin.com.np` (configured via `CNAME`).

## Architecture

The root page is self-contained in `index.html` alongside `logo.png`. Subfolders each hold an independent static site with no shared code:

- `workshop/` — single-file vehicle workshop site (`index.html`).
- `artsite/` — Kalakunja Art House, an art-commission intake site with an internal dispatch desk that assigns work to member artists. Five pages plus `assets/css/kalakunja.css` and `assets/js/kalakunja.js`; state lives in `localStorage`. See `artsite/README.md`.

There are no build steps and no frameworks anywhere in the repo.

### Root page

The page renders an animated "stamp" effect:
- CSS keyframe `stampIn` animates each stamp from hidden → overshoots (scale 1.3, rotate 15°) → rests at final opacity (CSS custom property `--final-opacity`)
- JS `createStamp()` clones `logo.png` with random size (80–250 px), opacity (0.4–0.8), and position, then appends it to `<body>`
- An initial burst of 10 stamps fires 200 ms apart; continuous stamping continues every 400–800 ms
- All stamps are cleared every 30 seconds and on window resize
