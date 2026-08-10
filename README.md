# Life Map

A live, expandable map of the places that have shaped my personal, educational, and professional life.

The project is designed around two linked datasets:

- `data/places.json` — canonical geographic places with coordinates, precision, region, and source metadata.
- `data/experiences.json` — life, education, and work experiences that reference those places.

Keeping **places** separate from **experiences** lets one place support multiple chapters of the story without duplicating coordinates. It also makes the map easy to expand as new locations are added.

## Map views

The eventual website should support three primary views:

1. **Life** — birthplace, residences, and education.
2. **Work** — home campuses, other Northrop Grumman campuses, government/military mission sites, conferences, and professional travel.
3. **Combined** — the full geographic timeline with filters.

## Design direction

- Modern air-travel aesthetic: dark navy, warm gold, restrained blue/teal/purple accents.
- Interactive map first; static poster graphics can be generated from the same data.
- No decorative travel-route lines by default.
- Exact facility coordinates are used when a specific campus/base/site is known.
- City-center coordinates are deliberately used when the history is known only to the city level; the data records that lower precision explicitly rather than implying an exact former address.
- Dense regions should be handled by zoom, clustering, and responsive label/card behavior rather than hard-coded poster insets.
- The architecture should scale cleanly to future locations in **Alaska**, **Australia**, and elsewhere.

## Data principles

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

The map UI must never place a marker "by eye." Marker locations come directly from `data/places.json`.

A few important spatial checks are encoded in the seed data:

- Washington, DC is east and slightly north of DARPA Headquarters in Arlington.
- RAF Molesworth and RAF Alconbury are only about 7.4 great-circle miles apart using the stored reference points.
- On Guam, Naval Base Guam is at Apra Harbor on the west-central coast; Camp Blaz is in northern Guam; Andersen AFB is farther east/northeast.
- Space Park, Los Angeles SFB, and Los Angeles conference travel are all in the Los Angeles metro area; Azusa is east of the core LA cluster.

## Next build step

Use these files as the source of truth for an interactive web map with filtering, a timeline control, marker clustering, and detail cards. A global overview should gracefully accommodate Hawaii now and Alaska/Australia later without redesigning the data model.
