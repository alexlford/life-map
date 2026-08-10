# Life Map

A live, expandable map of the places that have shaped my personal, educational, and professional life.

The site is intentionally data-first. Geography lives in structured JSON, while the interface turns that data into an interactive atlas with filtering, clustering, a timeline, search, and place detail cards.

## Live site

GitHub Pages is configured from the repository's `main` branch at the repository root:

`https://alexlford.github.io/life-map/`

## Interactive views

The map supports three primary views:

1. **Life** — birthplace, residences, and education.
2. **Work** — home campuses, other Northrop Grumman campuses, government/military mission sites, conferences, and professional travel.
3. **Combined** — the full geographic story with all layers available.

The interface also includes:

- category layer filters;
- a cumulative year-by-year timeline for experiences with recorded dates;
- clustered markers for dense regions;
- exact-coordinate detail cards;
- place and experience search;
- flat-map and globe projections;
- responsive desktop and mobile layouts.

## Design direction

- Modern air-travel aesthetic: dark navy, warm gold, restrained blue/teal/purple accents.
- Interactive map first; static poster graphics can be generated from the same data later.
- No decorative travel-route lines by default.
- Exact facility coordinates are used when a specific campus/base/site is known.
- City-center coordinates are deliberately used when the history is known only to the city level; the data records that lower precision explicitly rather than implying an exact former address.
- Dense regions are handled by zoom, clustering, and responsive labels rather than hard-coded poster insets.
- The architecture is designed to scale cleanly to future locations in **Alaska**, **Australia**, and elsewhere.

## Data model

The project uses two linked datasets:

- `data/places.json` — canonical geographic places with coordinates, precision, region, and source metadata.
- `data/experiences.json` — life, education, and work experiences that reference those places.

Keeping **places** separate from **experiences** lets one place support multiple chapters of the story without duplicating coordinates.

Every place has a stable `id`, coordinates, a `coordinatePrecision` value, verification metadata, and source information. Exact sites and representative city points are never treated as equivalent.

Current precision levels:

- `building` — a specific building/facility point.
- `installation` — a military/base installation reference point or centroid.
- `campus` — a university or multi-building corporate campus point.
- `venue` — a conference/event venue.
- `city` — representative city-center point only.

`data/experiences.json` stores the story: what happened at the place, the category, dates where known, and display priority.

## Initial scope

The seed data includes:

- Personal geography from Peoria, Illinois (1988) through Denver, Colorado (2021–present).
- University of Illinois and University of Kansas.
- Northrop Grumman home and other campuses.
- U.S. military/government mission sites.
- Guam and United Kingdom work sites.
- Conference travel, including the **2019 IEEE International Symposium on Phased Array Systems and Technology** at The Westin Waltham Boston.
- Honolulu as professional travel.

## Geography rules

The map UI never places a marker "by eye." Marker locations come directly from `data/places.json`.

Important spatial checks are encoded in the data validator:

- Washington, DC is east and slightly north of DARPA Headquarters in Arlington.
- RAF Molesworth and RAF Alconbury are only about 7.4 great-circle miles apart using the stored reference points.
- On Guam, Naval Base Guam is at Apra Harbor on the west-central coast; Camp Blaz is in northern Guam; Andersen AFB is farther east/northeast.
- Space Park, Los Angeles SFB, and Los Angeles conference travel are all in the Los Angeles metro area; Azusa is east of the core LA cluster.

Run the validator with:

```bash
python scripts/validate_data.py
```

JavaScript syntax is also checked in CI with:

```bash
node --check app.js
```

## Mapping stack

The site is a dependency-light static build using **MapLibre GL JS** and OpenFreeMap vector tiles. It requires no API key and can be served directly through GitHub Pages.

Local development only needs a static HTTP server, for example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.
