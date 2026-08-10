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

The `embed=1` flag removes standalone branding and switches the application to a full-bleed layout with floating map controls. The native alexlford.com page should provide the `My Professional Journey` heading and introductory copy.

## Experience-page presentation

The embedded Work view is designed to act as the centerpiece of the Experience page rather than as a standalone novelty map. It includes:

- a compact professional-footprint summary,
- three career chapters anchored to BWI, Boulder, and Aurora,
- curated story cards for selected home campuses, mission sites, international work, and conferences,
- related-site navigation for geographic clusters such as Guam and the United Kingdom,
- collapsed coordinate/source metadata so the professional story is presented before the mapping mechanics.

Curated public-facing copy lives in `data/stories.json`. Coordinates remain canonical in `data/places.json`; the story layer never changes marker placement.

## Visual relationship to alexlford.com

The parent site is intentionally spare and editorial. The map should complement that rather than duplicate the surrounding page chrome.

- The map is an intentional dark, immersive break inside the otherwise clean site.
- Deep navy and warm gold are the visual identity.
- Category colors are restrained informational accents.
- Career home bases receive gold beacon/ring treatment so they read differently from destinations.
- Embed mode removes the duplicate map title and uses floating controls, allowing the parent page to supply the page hierarchy.
- Typography is kept neutral and modern so the interactive feature does not feel like a separate branded microsite.

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

The integration layer understands these query parameters:

| Parameter | Example | Purpose |
|---|---|---|
| `embed` | `embed=1` | Compact alexlford.com layout |
| `mode` | `mode=work` | `work`, `life`, or `combined` |
| `timeline` | `timeline=1` | Enables cumulative timeline mode |
| `year` | `year=2019` | Shows dated experiences through a year |
| `projection` | `projection=globe` | Starts in globe projection |
| `place` | `place=raf-molesworth` | Opens a mapped place when it becomes available |

Examples:

```text
?embed=1&mode=work&place=raf-molesworth
?embed=1&mode=life&timeline=1&year=2017
?embed=1&mode=combined&projection=globe
```

The application updates the browser query string as the visitor changes modes, timeline settings, projection, or selected place. This allows a specific map state to be copied as a deep link.

## Optional parent-page bridge

When embedded, the map posts two messages to its parent window:

- `alexford-life-map:ready`
- `alexford-life-map:resize`

The payload includes the active mode and, for resize messages, the embedded document height. This gives alexlford.com the option to add tighter iframe integration later without changing the map application.

## Page design recommendation

For the Experience page, place the map immediately below a short introduction such as:

> **My Professional Journey**  
> My career has taken me from theoretical astrophysics to RF engineering, engineering leadership, systems engineering, and mission sites around the world. Explore the places that have shaped that journey.

Below the map, retain a concise conventional professional timeline, education, selected credentials, and resume link. The map becomes the visual centerpiece while the resume-style material remains available for visitors who want detail.

## Story data workflow

When adding a future location such as Alaska or Australia:

1. Add or verify the canonical place in `data/places.json`.
2. Add the mapped experience in `data/experiences.json`.
3. Add curated public-facing copy to `data/stories.json` only when the location benefits from a deeper narrative.
4. Run `python scripts/validate_data.py` and `python scripts/validate_stories.py` before publishing.
