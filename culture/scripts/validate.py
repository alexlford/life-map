#!/usr/bin/env python3
"""Validate Culture Passport records, historical interview states, and pages."""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
records_data = json.loads((ROOT / "data/records.json").read_text(encoding="utf-8"))
interview_data = json.loads((ROOT / "data/interview.json").read_text(encoding="utf-8"))
records, venues = records_data["records"], records_data["venues"]
candidates = interview_data["candidates"]
assert records_data["project"] == "Culture Passport" and records_data["version"] == 1
assert len(records) >= 9 and len(venues) >= 9
assert len({r["id"] for r in records}) == len(records)
assert len({v["id"] for v in venues}) == len(venues)
types = {"dining", "concert", "opera", "theater"}
assert {c["id"] for c in records_data["categories"]} == types
venue_ids = {v["id"] for v in venues}
assert all(r["status"] == "confirmed" and r["type"] in types for r in records)
assert all(r["venueId"] in venue_ids and r["visit"]["source"] for r in records)
assert all(r["visit"].get("date") is None or r["visit"]["precision"] == "day" for r in records)
assert all(v["location"]["precision"] == "city-centroid" for v in venues)
assert all(-90 <= v["location"]["lat"] <= 90 and -180 <= v["location"]["lng"] <= 180 for v in venues)
stars = [r for r in records if r.get("guide") and r["guide"]["distinction"] == "starred"]
assert len(stars) >= 2 and all(1 <= r["guide"]["stars"] <= 3 for r in stars)
assert all(r["guide"]["stars"] == 0 for r in records if r.get("guide") and r["guide"]["distinction"] != "starred")
assert {"Minetta Tavern", "Beckon", "Charleston", "Woodberry Kitchen",
        "Momofuku CCDC", "République", "Sauvage", "Gunther & Co.",
        "Thames Street Oyster House"}.issubset({r["title"] for r in records})
assert len(candidates) >= 70
assert len({c["id"] for c in candidates}) == len(candidates)
assert len({(c["area"].casefold(), c["name"].casefold()) for c in candidates}) == len(candidates)
assert all(c["sourceUrl"].startswith("https://") for c in candidates)
assert all(c["visitStatus"] in {"confirmed", "not_visited", "maybe", "unreviewed"} for c in candidates)
assert {"Baltimore", "Washington, DC", "Denver Metro", "Steamboat Springs"}.issubset({c["area"] for c in candidates})
assert all(c.get("confirmedVisitId") in {r["id"] for r in records}
           for c in candidates if c["visitStatus"] == "confirmed" and c.get("confirmedVisitId"))
assert any(c["name"] == "Alma Cocina Latina" and c["visitStatus"] == "maybe" for c in candidates)
assert any(c["name"] == "Gunther & Co." and c["visitStatus"] == "confirmed" for c in candidates)
assert all(c["name"] not in {r["title"] for r in records}
           for c in candidates if c["visitStatus"] == "not_visited")
for page in ("index", "explore", "timeline", "map", "record", "interview"):
    source = (ROOT / (page + ".html")).read_text(encoding="utf-8")
    assert "Culture Passport" in source and "./assets/site.css" in source
    assert "./assets/app.js" in source
assert (ROOT / "assets/app.js").exists()
assert (ROOT / "assets/site.css").exists()
assert "culture.alexlford.com" in (ROOT / "README.md").read_text(encoding="utf-8")
print("Culture Passport OK: %d experiences, %d venues, %d interview prospects" %
      (len(records), len(venues), len(candidates)))
