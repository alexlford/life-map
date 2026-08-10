#!/usr/bin/env python3
"""Smoke-test the dependency-free production entry point."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = (ROOT / "index.html").read_text(encoding="utf-8")
APP = (ROOT / "fast-app.js").read_text(encoding="utf-8")
CSS = (ROOT / "fast-app.css").read_text(encoding="utf-8")
POLISH_JS = (ROOT / "polish.js").read_text(encoding="utf-8")
POLISH_CSS = (ROOT / "polish.css").read_text(encoding="utf-8")
EXPERIENCES = (ROOT / "data" / "experiences.json").read_text(encoding="utf-8")


def main() -> None:
    # Production must remain independent of a third-party JS/CSS mapping library.
    assert 'src="http' not in INDEX, "Production index should not load third-party scripts"
    assert 'rel="stylesheet" href="http' not in INDEX, "Production index should not load third-party stylesheets"
    assert './fast-app.js' in INDEX and './fast-app.css' in INDEX
    assert './polish.js' in INDEX and './polish.css' in INDEX
    assert 'maplibre' not in INDEX.lower()

    # The professional taxonomy is intentionally limited to four categories.
    assert "'professional-travel'" not in APP
    assert '"category": "professional-travel"' not in EXPERIENCES
    for category in ("home-campus", "ng-campus", "mission-site", "conference"):
        assert category in APP, f"Missing production category: {category}"

    # Preserve embed/deep-link behavior from the previous implementation.
    for parameter in ("embed", "mode", "timeline", "year", "place"):
        assert f"'{parameter}'" in APP or f'"{parameter}"' in APP, f"Missing query parameter support: {parameter}"
    assert 'alexford-life-map:ready' in APP
    assert 'alexford-life-map:resize' in APP

    # Mobile scrolling must remain on the outer sheet so controls cannot be clipped.
    assert '@media(max-width:900px)' in CSS
    assert 'overflow-y:auto' in CSS
    assert '-webkit-overflow-scrolling:touch' in CSS
    assert 'touch-action:pan-y' in CSS

    # The refinement layer should keep the mobile experience map-first without hiding controls.
    assert 'panel-toggle' in POLISH_JS
    assert 'is-expanded' in POLISH_JS
    assert '--sheet-compact' in POLISH_CSS
    assert '--sheet-expanded' in POLISH_CSS
    assert 'career-map-label' in POLISH_JS and 'career-map-label' in POLISH_CSS
    assert 'career-cluster' in POLISH_JS and 'career-cluster' in POLISH_CSS

    # Basemap images are progressive enhancement only: index may preconnect, but does not load tile assets itself.
    assert INDEX.count('basemaps.cartocdn.com') == 2, "Only DNS/preconnect hints should mention the basemap host"
    assert 'basemaps.cartocdn.com' in APP

    print("OK: production entry point is dependency-free, mobile-scroll safe, and map-first polished")


if __name__ == "__main__":
    main()
