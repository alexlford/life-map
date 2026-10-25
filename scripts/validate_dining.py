#!/usr/bin/env python3
"""Validate Michelin Dining Passport record integrity and local links."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "data/dining.json").read_text(encoding="utf-8"))
HTML = (ROOT / "dining.html").read_text(encoding="utf-8")
JS = (ROOT / "dining.js").read_text(encoding="utf-8")
INDEX = (ROOT / "index.html").read_text(encoding="utf-8")
CSS = (ROOT / "fast-app.css").read_text(encoding="utf-8")


def main():
    assert DATA["version"] == 1
    assert DATA["entries"], "Dining archive must not be empty"
    ids = [record["id"] for record in DATA["entries"]]
    assert len(set(ids)) == len(ids), "Duplicate dining record ID"

    for record in DATA["entries"]:
        assert record["status"] in {"confirmed", "researching"}, record["id"]
        assert record["visit"]["source"], record["id"]
        assert record["city"] and record["name"], record["id"]
        if record["status"] == "confirmed":
            assert record["kind"] == "restaurant", record["id"]
            assert record["guide"]["distinction"] in {
                "selected", "bib_gourmand", "green_star", "starred"
            }, record["id"]
            assert not record.get("candidates"), "Confirmed visit cannot be a multi-restaurant lead"
            if record["guide"]["distinction"] == "starred":
                assert record["guide"].get("stars") in (1, 2, 3), record["id"]
                assert record["guide"].get("starAwardDate"), "Star award date required"
                assert record["visit"].get("approximateYear") == record["guide"]["edition"], "Star counter needs matched guide edition"
            if record["guide"]["historicalVisitDistinction"] == "starred":
                assert record["guide"].get("starsAtVisit") in (1, 2, 3), record["id"]
                assert record["visit"]["date"], "Star needs a historically checkable visit date"
        else:
            assert record["kind"] == "reconstruction", record["id"]
            assert len(record["candidates"]) >= 2, record["id"]
            assert len(set(c["name"] for c in record["candidates"])) == len(
                record["candidates"]
            ), "Duplicate candidate within one reconstructed visit"
            assert all(c["url"].startswith("https://") for c in record["candidates"])

    republique = next(r for r in DATA["entries"] if r["id"] == "republique-los-angeles")
    assert republique["guide"]["distinction"] == "selected"
    assert republique["guide"]["stars"] == 0
    assert republique["guide"]["historicalVisitDistinction"] == "unverified"

    leads = [r for r in DATA["entries"] if r["status"] == "researching"]
    assert len(leads) == 1 and leads[0]["id"] == "nyc-burger-2016-2017", "Only the NYC burger visit remains unresolved"
    beckon = next(r for r in DATA["entries"] if r["id"] == "beckon-denver-2023")
    assert beckon["status"] == "confirmed" and beckon["kind"] == "restaurant"
    assert beckon["guide"]["stars"] == 1 and beckon["guide"]["edition"] == 2023
    assert beckon["guide"]["starAwardDate"] == "2023-09-12"
    assert beckon["visit"]["date"] is None and beckon["guide"]["historicalVisitDistinction"] == "unverified"
    assert "Michelin Dining Passport" in HTML
    assert "./data/dining.json" in JS
    assert "./dining.html" in INDEX
    assert "body.is-embedded .dining-promo" in CSS
    assert 'src="http' not in HTML
    print("OK: dining archive distinctions, evidence gates, candidates and navigation")


if __name__ == "__main__":
    main()
