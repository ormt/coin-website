# artsite — Kalakunja Art House (कलाकुञ्ज)

A commission-intake site for hand-painted art, with an internal desk that distributes each
commission to a member artist. The client deals only with the studio: they never see an
artist's name, town or phone number.

No build system, no dependencies. Open any page directly in a browser, or push to `main`
and it ships with the rest of the GitHub Pages site at `coin.com.np/artsite/`.

## Pages

| File | Audience | What it does |
| --- | --- | --- |
| `index.html` | Public | Landing page — traditions, process, the anonymity policy, pricing table, FAQ |
| `order.html` | Public | Five-step commission brief with a live price; issues an order code |
| `track.html` | Client | Look up an order code — progress, milestones, **anonymised** hand, payment |
| `studio.html` | Internal | Dispatch desk — queue, match scoring, placement, stage moves, roster load |
| `artist.html` | Members | Artist portal — assigned briefs (client identity redacted), stage updates, studio fee |

Shared code lives in `assets/css/kalakunja.css` and `assets/js/kalakunja.js`.

## The anonymity rule

Both directions are veiled, and it is enforced in one place — `KK.publicHand()` in
`assets/js/kalakunja.js`:

- **Client sees**: handle (`Hand No. 03`), grade (`Senior Hand`), atelier (`Mithila Atelier`),
  years with the studio.
- **Client never sees**: name, town, phone, rating, workload.
- **Artist sees**: the brief, the deadline and their studio fee.
- **Artist never sees**: the client's name, email or phone — those stay with the desk.

The client timeline renders only each stage's `client` wording plus any `clientNote` an artist
posts. Internal event notes (which do name handles) are never rendered on `track.html`.

## Matching engine

`KK.matchScores(order)` scores every member out of 100 and the desk shows the top four:

| Weight | Factor |
| --- | --- |
| 40 | Atelier match (40 primary, 30 secondary) |
| 22 | Grade clears the finish required — minus 5 per grade of overkill, so masters aren't wasted |
| 20 | Free capacity (7 per open slot) |
| ~10 | Studio rating |
| 8 | Headroom for a rush timeline (penalised if the deadline is tight and the artist is loaded) |

"Auto-place all unassigned" on the dispatch desk runs the same scoring in bulk, skipping
anyone at capacity.

## Pricing

`KK.quote(brief)` = size base × tradition × medium × finish × timeline, rounded to रु 500,
plus fixed-price extras (frame, brocade mount, gold line work, export crating). Deposit is
40%. Amounts are grouped in the South-Asian style (`9,43,000`) and dates are rendered in
Nepal time.

## State

Everything persists in `localStorage` (`kk.orders.v1`, `kk.artists.v1`) with an in-memory
fallback, so the full commission → dispatch → delivery loop is demonstrable without a server.
Six demo commissions seed themselves on first load; **Reset demo data** on the dispatch desk
restores them.

To put this into production, replace the four storage functions at the top of
`kalakunja.js` (`readJSON` / `writeJSON` and the `KEY_*` constants) with API calls — the rest
of the code only talks to `KK.orders()`, `KK.createOrder()`, `KK.updateOrder()` and
`KK.assign()`. The artist PIN screen is a demo stand-in and must be replaced with real auth
before anyone's client list is behind it.

## Design notes

Palette and motifs come from the Newar Paubha and Mithila painting traditions: lokta-paper
ground, vermilion (`--sindoor`), lapis (`--indigo`), temple brass and malachite. The prayer-flag
strip, the ankhi-jhyal lattice divider, the torana card headers, the flag-shaped pennant and the
hero mandala are all inline SVG or CSS — there are no image assets to load.
