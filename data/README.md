# Data model

The map uses a small relational model in JSON.

## `places.json`

A place is a geographic object. Coordinates belong here and nowhere else.

Required fields:

- `id` — stable slug used by experiences and the UI.
- `name` — canonical place name.
- `displayName` — preferred map/card label.
- `kind` — e.g. `city`, `university`, `corporate-campus`, `military-installation`, `government-site`, `conference-venue`.
- `city`, `region`, `country` — locality metadata.
- `mapRegion` — useful for regional zoom behavior and future storytelling.
- `coordinates.lat`, `coordinates.lng` — WGS84 decimal degrees.
- `coordinatePrecision` — `building`, `installation`, `campus`, `venue`, or `city`.
- `verificationStatus` — `verified_exact` or `verified_representative` in the seed data.
- `source` — where the location/coordinate came from.

Optional fields include `address`, `coordinateSource`, `coordinateNote`, and `venueVerification`.

### Precision matters

A `city` point is a representative anchor, not an exact former residence or exact event building. A `building`, `installation`, `campus`, or `venue` point is intended to place the marker on the actual known site.

## `experiences.json`

An experience is something that happened at a place.

Important fields:

- `id` — stable experience slug.
- `placeId` — foreign key into `places.json`.
- `domain` — `life`, `education`, or `work`.
- `category` — the filter/legend category.
- `label` — short human-facing description.
- `period` — start/end plus date precision where known.
- `dateStatus: "to-be-added"` — used when the place is known but the travel/work date has not yet been recorded.
- `displayPriority` — relative importance for labels/cards when the map is crowded.

Seed categories:

- `birthplace`
- `residence`
- `university`
- `home-campus`
- `ng-campus`
- `mission-site`
- `conference`
- `professional-travel`

## UI mapping

Recommended top-level filters:

- **Life**: `birthplace`, `residence`
- **Education**: `university`
- **Work — Home campuses**: `home-campus`
- **Work — NG campuses**: `ng-campus`
- **Work — Mission sites**: `mission-site`
- **Work — Conferences**: `conference`
- **Work — Other professional travel**: `professional-travel`

For a simplified wall-poster/work-map legend, `mission-site` and `professional-travel` can be visually merged, while remaining distinct in the underlying dataset.

## Adding a new location

1. Add the canonical point to `places.json`.
2. Record the best available coordinate source and precision.
3. Add one or more entries to `experiences.json` referencing the new `placeId`.
4. Run `python scripts/validate_data.py`.

This workflow is intentionally suitable for future Alaska, Australia, and other international locations without changing the schema.
