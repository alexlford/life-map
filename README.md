# Life Map

A live, expandable map of the places that have shaped my personal, educational, and professional life.

The site is intentionally data-first. Geography lives in structured JSON, while the interface turns that data into an interactive atlas with filtering, clustering, a timeline, search, career chapters, and place detail cards.

## Live site

GitHub Pages is configured from the repository's `main` branch at the repository root:

`https://alexlford.github.io/life-map/`

The professional embed used by alexlford.com is:

`https://alexlford.github.io/life-map/?embed=1&mode=work`

## Interactive views

The map supports three primary views:

1. **Life** — birthplace, residences, and education.
2. **Work** — career bases, other Northrop Grumman campuses, mission/government/work-travel locations, and conferences.
3. **Combined** — the full geographic story with all layers available.

The Work taxonomy is intentionally limited to four categories:

- `home-campus` — career bases;
- `ng-campus` — other Northrop Grumman campuses;
- `mission-site` — bases, government sites, mission sites, and general work travel;
- `conference` — conference travel.

The interface also includes:

- category layer filters and a **Show all** reset;
- a cumulative year-by-year timeline for experiences with recorded dates;
- clustered markers for dense regions;
- career-base beacon markers;
- place and experience search;
- story-first detail cards with related-place navigation;
- collapsed coordinate/source metadata;
- URL deep links for mode, timeline/year, and selected place;
- responsive desktop and mobile layouts.

## Design direction

- Modern editorial travel aesthetic: dark navy, warm gold, restrained blue/teal/purple accents.
- Gold is the identity color; category colors are informational accents.
- Career bases receive a gold beacon/ring treatment so they read differently from destinations.
- No decorative travel-route lines by default.
- Exact facility coordinates are used when a specific campus/base/site is known.
- City-center coordinates are deliberately used when the history is known only to the city level; the data records that lower precision explicitly rather than implying an exact former address.
- Dense regions are handled by zoom, clustering, and responsive labels rather than hard-coded poster insets.
- The architecture is designed to scale cleanly to future locations in **Alaska**, **Australia**, and elsewhere.

## Production mapping architecture

The production entry point is deliberately **dependency-free**. `index.html` loads only local `fast-app.css` and `fast-app.js` plus the project's three small JSON datasets.

`fast-app.js` performs Web Mercator projection, pan/zoom, marker clustering, filtering, timeline behavior, deep-link state, and detail-card interactions without requiring a third-party mapping library.

CARTO Dark Matter raster tiles are progressive enhancement only. They are created as ordinary image elements after the local interface is running. If the tile service is slow or unavailable, the map remains usable on the navy/grid background with projected markers and all controls intact.

Legacy MapLibre files remain in the repository for reference and possible future enhanced-mode experiments, but they are **not loaded by the production page**.

## Data model

The project uses three linked datasets:

- `data/places.json` — canonical geographic places with coordinates, precision, region, and source metadata;
- `data/experiences.json` — life, education, and work experiences that reference those places;
- `data/stories.json` — curated public-facing career chapters and selected place narratives.

Keeping **places** separate from **experiences** lets one place support multiple chapters of the story without duplicating coordinates. Story content never changes marker placement.

Every place has a stable `id`, coordinates, a `coordinatePrecision` value, verification metadata, and source information. Exact sites and representative city points are never treated as equivalent.

Current precision levels:

- `building` — a specific building/facility point;
- `installation` — a military/base installation reference point or centroid;
- `campus` — a university or multi-building corporate campus point;
- `venue` — a conference/event venue;
- `city` — representative city-center point only.

## Initial scope

The seed data includes:

- Personal geography from Peoria, Illinois (1988) through Denver, Colorado (2021–present).
- University of Illinois and University of Kansas.
- Five professional career chapters: Lawrence, Charleston, Baltimore/BWI, Boulder, and Aurora.
- Northrop Grumman campuses around the United States.
- U.S. military/government mission sites.
- Guam and United Kingdom work sites.
- Conference travel, including the **2019 IEEE International Symposium on Phased Array Systems and Technology** at The Westin Waltham Boston.
- Honolulu as work travel within the broader mission/government/travel layer.

## Geography rules

The map UI never places a marker "by eye." Marker locations come directly from `data/places.json` and are projected mathematically.

Important spatial checks are encoded in `scripts/validate_data.py`, including:

- Washington, DC is east and slightly north of DARPA Headquarters in Arlington.
- BWI/Linthicum plots north and west of Annapolis.
- RAF Molesworth and RAF Alconbury are only about 7–8 great-circle miles apart and Molesworth is west of Alconbury.
- On Guam, Naval Base Guam is southwest of Camp Blaz; Camp Blaz is west of Andersen AFB.
- Schriever SFB plots east of Peterson SFB.
- Wright-Patterson AFB plots east/northeast of the Northrop Grumman Dayton/Beavercreek campus.
- Space Park and Los Angeles SFB remain a tight South Bay cluster; Azusa is east of the core LA sites.
- The Westin Waltham Boston remains anchored at the verified 2019 conference venue location.

## Validation

Run all local validators with:

```bash
python scripts/validate_data.py
python scripts/validate_stories.py
python scripts/validate_frontend.py
node --check fast-app.js
```

CI runs these checks on pull requests and on pushes to `main`. `validate_frontend.py` specifically protects the dependency-free production entry point, mobile scrolling behavior, deep-link/embed hooks, and four-category professional taxonomy.

## Local development

No build step is required. Start a static HTTP server:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Michelin Dining Passport

`dining.html` is a standalone, responsive historical dining tracker within the Personal Atlas, linked from the Life Map (and hidden in professional embeds). `data/dining.json` is the canonical source. The site distinguishes directly reported visits, unresolved restaurant identities, Michelin Guide Selected listings, and historically confirmed Michelin stars. Do not treat restaurant *candidates* as separate visits or apply a current Michelin rating retroactively to an old visit.

Current seed: République is a confirmed Guide-listed visit but not a confirmed starred visit; Minetta Tavern (NYC, 2016 or 2017) is a **confirmed visit** to a one-star restaurant in both applicable Michelin Guides. Beckon (Denver) is also a confirmed visit to a restaurant awarded **one star in the inaugural 2023 Colorado Guide**. The precise Beckon meal date relative to the September 12 award remains unknown. A late-1990s Wisconsin Dells Michelin star is historically impossible because Michelin did not publish a US guide until 2005.

## Independent Personal Atlas site

Personal Atlas is an independent property, separate from the `sports-passport` and `adventure-map` repositories, datasets, builds, and deployments. It now has a dedicated editorial landing page at `atlas.html` plus the Life Map at `index.html` and Michelin Dining Passport at `dining.html`.

The Atlas landing page is currently served from `https://alexlford.github.io/life-map/atlas.html`. `atlas.alexlford.com` is the proposed independent custom subdomain, **not yet configured**: DNS plus GitHub Pages ownership and domain configuration are required before activating a CNAME. Until then, retain the root map page, historical map links, and existing professional embed (`?embed=1&mode=work`). Nothing is hosted inside the Sports or Adventures websites.

## Culinary Passport: James Beard and interview expansion

In addition to the Michelin Guide, `data/dining.json` can associate a named chef's James Beard recognition with a confirmed venue, preserving recipient, distinction, outcome and year (for example, République chef Margarita Manzke's 2023 pastry award). These honors never imply a Michelin star, and they cannot retroactively be described as held during an earlier meal.

`data/dining-interview.json` stores **unverified restaurant research candidates**, split across Baltimore (2018–2021), Washington, DC (2018–2021) and Denver metro (2021–present). `dining-interview.html` provides a visit/maybe/not-visited questionnaire that stores browser-local selections and can copy a summary. No answer is published to the main passport automatically. Charleston is a **confirmed visit** during 2018–2021 (exact year unknown). Cindy Wolf's James Beard chef nominations are historical; Charleston's 2025 restaurant-level wine-program win was **after** the visit. Its interview entry is marked confirmed and cannot be overridden by locally saved questionnaire choices. Some award recognitions occurred **after** the user's potential visit.

Woodberry Kitchen is also confirmed as visited in Baltimore during 2018–2021 (precise year unknown), with Spike Gjerde's James Beard 2015 Best Chef: Mid-Atlantic win represented as an award to the chef **before** the remembered dining visit. Both Charleston and Woodberry Kitchen are now locked as canonical confirmed visits in the interview rather than asking Alex to reconfirm them.

For the Culinary Passport timeline, Alex selected **2018** as the approximate year for Woodberry Kitchen and **2020** for Charleston (exact dining dates remain unknown). Timeline entries sort chronologically by the chosen year. Alex explicitly confirmed **not visiting Clavel** during 2018–2021; this answer is locked in the interview and excluded from confirmed visit totals.
