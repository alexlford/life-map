# alexlford.com integration

The Life Map remains a standalone, version-controlled application in this repository while also supporting an embed mode for the Experience section of **alexlford.com**.

## Production embed URL

Use the Work view by default on the professional Experience page:

```text
https://alexlford.github.io/life-map/?embed=1&mode=work
```

The `embed=1` flag removes the standalone branding and switches the application to a compact layout designed to feel like a native interactive feature inside alexlford.com.

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
    height: clamp(680px, 82svh, 940px);
    border: 0;
    background: #04111d;
  }

  @media (max-width: 767px) {
    #alexford-life-map {
      height: 78svh;
      min-height: 620px;
    }
  }
</style>
```

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

Below the map, retain the conventional professional timeline, education, selected credentials, and resume link. The map becomes the visual centerpiece while the resume-style material remains available for visitors who want detail.
