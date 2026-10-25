#!/usr/bin/env python3
"""Validate the standalone Culture Passport preview and canonical source parity."""
import json
from datetime import date
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
ROOT = SITE.parent
DATA = json.loads((SITE / "data/records.json").read_text(encoding="utf-8"))
INTERVIEW = json.loads((SITE / "data/interview.json").read_text(encoding="utf-8"))
LEGACY = json.loads((ROOT / "data/dining.json").read_text(encoding="utf-8"))
LEGACY_INTERVIEW = json.loads((ROOT / "data/dining-interview.json").read_text(encoding="utf-8"))

def validate():
    expected = {"dining", "concert", "opera", "theater"}
    assert DATA["version"] == 1
    assert {c["id"] for c in DATA["categories"]} == expected
    assert DATA["project"] == "Culture Passport"
    assert DATA["records"] and DATA["venues"]
    ids = [r["id"] for r in DATA["records"]]
    assert len(ids) == len(set(ids))
    venues = {v["id"]:v for v in DATA["venues"]}
    assert len(venues) == len(DATA["venues"])
    for v in DATA["venues"]:
        assert v["location"]["precision"] == "city-centroid"
        assert -90 <= v["location"]["lat"] <= 90
        assert -180 <= v["location"]["lng"] <= 180
        assert v["city"] and v["name"]
    for r in DATA["records"]:
        assert r["type"] in expected
        assert r["status"] == "confirmed"
        assert r["venueId"] in venues
        assert r["visit"]["precision"] in {"day", "month", "year_range", "approximate_year", "approximate", "unknown"}
        assert r["visit"]["source"] and r["visit"]["label"]
        if r["visit"]["date"]:
            parsed = date.fromisoformat(r["visit"]["date"])
            assert r["visit"]["precision"] == "day"
            assert parsed.year == r["visit"]["year"]
        if r["visit"]["precision"] == "month":
            assert r["visit"]["date"] is None
            assert 1 <= r["visit"]["month"] <= 12
            assert r["visit"]["year"]
        if r["guide"]:
            if r["guide"]["distinction"] == "starred":
                assert 1 <= r["guide"]["stars"] <= 3
            else:
                assert r["guide"]["stars"] == 0
        for award in r["recognitions"]:
            assert award["year"] and award["organization"] and award["recipient"]
            assert award["sourceUrl"].startswith("https://")
    assert len(DATA["records"]) == 9
    assert all(r["type"] == "dining" for r in DATA["records"]), "Arts events require a real confirmation"
    assert set(r["title"] for r in DATA["records"] if r.get("favorite")) == {"Sauvage", "Gunther & Co."}
    assert sum(r["guide"]["distinction"] == "starred" for r in DATA["records"]) == 2
    gunther = next(r for r in DATA["records"] if r["title"] == "Gunther & Co.")
    sauvage = next(r for r in DATA["records"] if r["title"] == "Sauvage")
    thames = next(r for r in DATA["records"] if r["title"] == "Thames Street Oyster House")
    assert gunther["visit"]["date"] == "2020-02-14"
    assert sauvage["visit"]["year"] == 2021 and sauvage["visit"]["month"] == 1
    assert thames["visit"]["date"] is None and thames["visit"]["year"] is None
    assert set(r["id"].removeprefix("dining-") for r in DATA["records"]) == {r["id"] for r in LEGACY["entries"] if r["status"] == "confirmed"}
    assert set(r["id"] for r in INTERVIEW["candidates"]) == set(r["id"] for r in LEGACY_INTERVIEW["candidates"])
    assert len(INTERVIEW["candidates"]) == 57
    assert {r["area"] for r in INTERVIEW["candidates"]} == {"Baltimore", "Washington, DC", "Denver Metro", "Steamboat Springs"}
    for c in INTERVIEW["candidates"]:
        assert c["visitStatus"] in {"unreviewed", "confirmed", "not_visited", "maybe"}
        assert c["sourceUrl"].startswith("https://")
    pendry = next(r for r in INTERVIEW["candidates"] if r["name"] == "Rec Pier Chop House")
    assert pendry["visitStatus"] == "unreviewed"
    assert pendry["userMemoryLead"]["identityConfirmed"] is False
    assert not any(r["title"] == "Rec Pier Chop House" for r in DATA["records"])
    assert next(r for r in INTERVIEW["candidates"] if r["name"] == "Alma Cocina Latina")["visitStatus"] == "maybe"
    for page in ["index", "explore", "timeline", "map", "record", "interview"]:
        content=(SITE / (page+".html")).read_text(encoding="utf-8")
        assert "Culture Passport" in content
        assert "./assets/app.js" in content
    js=(SITE / "assets/app.js").read_text(encoding="utf-8")
    for route in ["home", "explore", "timeline", "map", "record", "interview"]:
        assert "function "+route+"(" in js
    assert "window.L" in js and "city-centroid" in (SITE / "data/records.json").read_text(encoding="utf-8")
    print("OK: Culture Passport preview archive, citations, dates, candidate statuses, pages and provenance")

if __name__ == "__main__":
    validate()
