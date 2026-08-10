# alexlford.com integration

The Life Map remains a standalone, version-controlled application in this repository while also supporting an embed mode for the Experience section of **alexlford.com**.

## Architecture recommendation

While alexlford.com remains on Squarespace, use the map as a **first-class full-width embed inside the existing Experience page** rather than sending visitors to a separate GitHub Pages site.

This keeps the native alexlford.com navigation, page title, footer, SEO content, and surrounding professional timeline in one place while letting the map remain independently version-controlled and deployable. The iframe is an implementation detail; visually the map should read as the centerpiece of the page.

Keep the standalone GitHub Pages URL for development, testing, deep links, and direct sharing. If alexlford.com later moves to a code-first framework, the preferred end state is to mount this application natively at `/experience` and retire the iframe without changing the data model.

## Production embed URL

Use the Work view by default on the professional Experience page:

```text
https://alexlford.github.io/life-map/?embed=1&mode=work
```

The `embed=1` flag removes standalone branding. The native alexlford.com page should provide the `My Professional Journey` heading and introductory copy.

## Production architecture

The current production entry point is intentionally dependency-free so the Experience page cannot hang while waiting for a mapping library or vector-style service.

- `index.html` loads local `fast-app.css` and `fast-app.js`.
- Canonical data comes from `data/places.json`, `data/experiences.json`, and `data/stories.json`.
- Marker placement uses Web Mercator projection from the exact stored coordinates.
- Pan, zoom, clustering, filters, timeline, search, career chapters, and detail cards are implemented locally.
- CARTO raster tiles load only as progressive-enhancement images beneath the markers. If tiles are delayed or unavailable, the interface remains usable on its navy/grid background.
- Legacy MapLibre assets are not part of the production page's critical path.

## Experience-page presentation

The embedded Work view is designed to act as the centerpiece of the Experience page rather than as a standalone novelty map. It includes:

- five career chapters: Lawrence, Charleston, Baltimore/BWI, Boulder, and Aurora;
- gold beacon markers for career bases;
- the four locked Work layers: Career bases, Other NG campuses, Mission/government/travel, and Conferences;
- curated story cards for selected career bases, mission sites, international work, and conferences;
- related-site navigation for geographic clusters such as Guam and the United Kingdom;
- collapsed coordinate/source metadata so the professional story is presented before the mapping mechanics.

Curated public-facing copy lives in `data/stories.json`. Coordinates remain canonical in `data/places.json`; the story layer never changes marker placement.

## Visual relationship to alexlford.com

The parent site is intentionally spare and editorial. The map should complement that rather than duplicate the surrounding page chrome.

- The map is an intentional dark, immersive break inside the otherwise clean site.
- Deep navy and warm gold are the visual identity.
- Category colors are restrained informational accents.
- Career bases receive gold beacon/ring treatment so they read differently from destinations.
- Embed mode removes duplicate standalone branding and lets the parent page supply the page hierarchy.
- Typography is neutral, modern, and deliberately more editorial than dashboard-like.
- On mobile, the control panel is a single momentum-scroll sheet so no lower controls can be clipped or trapped.

## Recommended Squarespace code block

```html
<div class="alexford-map-shell">
  <iframe
    id="alexford-life-map"
    src="https://alexlford.github.io/life-map/?embed=1&mode=work"
    title="Alex Ford professional journey map"
    loading="lazy"
    allow="fullscreen"
  ></iframe>
</div>

<style>
  .alexford-map-shell {
    width: 100%;
    margin: 0;
  }

  #alexford-life-map {
    display: block;
    width: 100%;
    height: clamp(720px, 86svh, 1000px);
    border: 0;
    background: #04131f;
  }

  @media (max-width: 767px) {
    #alexford-life-map {
      height: 82svh;
      min-height: 640px;
    }
  }
</style>
```

For the cleanest result, place the iframe in a full-width section with minimal top/bottom padding. Do not repeat a second heading immediately inside the map.

## URL state / deep links

The production application understands these query parameters:

| Parameter | Example | Purpose |
|---|---|---|
| `embed` | `embed=1` | alexlford.com embed layout |
| `mode` | `mode=work` | `work`, `life`, or `combined` |
| `timeline` | `timeline=1` | Enables cumulative timeline mode |
| `year` | `year=2019` | Shows dated experiences through a year |
| `place` | `place=raf-molesworth` | Opens and focuses a mapped place |

Examples:

```text
?embed=1&mode=work&place=raf-molesworth
?embed=1&mode=life&timeline=1&year=2017
?embed=1&mode=combined&place=naval-base-guam
```

The application updates the browser query string as the visitor changes modes, timeline settings, or the selected place. This allows a specific state to be copied as a deep link.

The previous MapLibre-only `projection=globe` deep link is intentionally not part of the dependency-free production experience. If an enhanced globe view returns later, it should be optional rather than the default critical path.

## Optional parent-page bridge

When embedded, the map posts two messages to its parent window:

- `alexford-life-map:ready`
- `alexford-life-map:resize`

The payload includes the active mode and, for resize messages, the embedded document height. This preserves the integration contract for tighter iframe behavior later without adding any external dependency.

## Page design recommendation

For the Experience page, place the map immediately below a short introduction such as:

> **My Professional Journey**  
> My career has taken me from theoretical astrophysics to RF engineering, engineering leadership, systems engineering, and mission sites around the world. Explore the places that have shaped that journey.

Below the map, retain a concise conventional professional timeline, education, selected credentials, and resume link. The map becomes the visual centerpiece while the resume-style material remains available for visitors who want detail.

## Story data workflow

When adding a future location such as Alaska or Australia:

1. Add or verify the canonical place in `data/places.json`.
2. Add the mapped experience in `data/experiences.json`, using one of the four Work categories when applicable.
3. Add curated public-facing copy to `data/stories.json` only when the location benefits from a deeper narrative.
4. Run `python scripts/validate_data.py`, `python scripts/validate_stories.py`, and `python scripts/validate_frontend.py` before publishing.
