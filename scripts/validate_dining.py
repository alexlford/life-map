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
                "selected", "bib_gourmand", "green_star", "starred", "not_covered", "plate"
            }, record["id"]
            assert not record.get("candidates"), "Confirmed visit cannot be a multi-restaurant lead"
            if record["guide"]["distinction"] == "starred":
                assert record["guide"].get("stars") in (1, 2, 3), record["id"]
                assert record["guide"].get("starAwardDate") or record["guide"].get("sourceUrls"), "Primary star evidence required"
                years = record["visit"].get("possibleYears") or [record["visit"].get("approximateYear")]
                verified = record["guide"].get("verifiedEditions") or [record["guide"]["edition"]]
                assert all(y in verified for y in years), "Stars must cover every possible visit year"
            if record["guide"]["historicalVisitDistinction"] == "starred":
                assert record["guide"].get("starsAtVisit") in (1, 2, 3), record["id"]
                if record["visit"]["date"] is None:
                    years = record["visit"].get("possibleYears", [])
                    assert years and all(y in record["guide"].get("verifiedEditions", []) for y in years), "Historical stars require covered guide editions"
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
    assert not leads, "No restaurant identities should remain unresolved"
    minetta = next(r for r in DATA["entries"] if r["id"] == "minetta-tavern-nyc-2016-2017")
    assert minetta["status"] == "confirmed" and minetta["guide"]["starsAtVisit"] == 1
    assert minetta["visit"]["possibleYears"] == [2016, 2017]
    assert minetta["guide"]["verifiedEditions"] == [2016, 2017]
    beckon = next(r for r in DATA["entries"] if r["id"] == "beckon-denver-2023")
    assert beckon["status"] == "confirmed" and beckon["kind"] == "restaurant"
    assert beckon["guide"]["stars"] == 1 and beckon["guide"]["edition"] == 2023
    assert beckon["guide"]["starAwardDate"] == "2023-09-12"
    assert beckon["visit"]["date"] is None and beckon["guide"]["historicalVisitDistinction"] == "unverified"
    ATLAS = (ROOT / "atlas.html").read_text(encoding="utf-8")
    assert "Personal Atlas" in ATLAS and "./index.html" in ATLAS and "./dining.html" in ATLAS
    assert "./atlas.html" in INDEX and "./atlas.html" in HTML
    charleston = next(r for r in DATA["entries"] if r["id"] == "charleston-baltimore-2018-2021")
    assert charleston["status"] == "confirmed"
    assert charleston["visit"]["date"] is None
    assert charleston["visit"]["possibleYears"] == [2020] and charleston["visit"]["timelineYear"] == 2020
    assert charleston["guide"]["distinction"] == "not_covered"
    assert charleston["guide"]["stars"] == 0
    assert any(r["year"] == 2025 and r["result"] == "winner" and r["timingRelativeToVisit"] == "after_visit" for r in charleston["recognitions"])
    woodberry = next(r for r in DATA["entries"] if r["id"] == "woodberry-kitchen-baltimore-2018-2021")
    assert woodberry["status"] == "confirmed" and woodberry["visit"]["date"] is None
    assert woodberry["visit"]["possibleYears"] == [2018] and woodberry["visit"]["timelineYear"] == 2018
    assert woodberry["guide"]["distinction"] == "not_covered"
    assert woodberry["guide"]["stars"] == 0
    assert any(r["recipient"] == "Spike Gjerde" and r["result"] == "winner" and r["year"] == 2015 and r["timingRelativeToVisit"] == "before_visit" for r in woodberry["recognitions"])
    assert "Culinary Passport" in HTML
    INTERVIEW = json.loads((ROOT / "data/dining-interview.json").read_text(encoding="utf-8"))
    QUESTIONS = (ROOT / "dining-interview.html").read_text(encoding="utf-8")
    assert len(INTERVIEW["candidates"]) >= 40
    assert len(set(r["id"] for r in INTERVIEW["candidates"])) == len(INTERVIEW["candidates"])
    assert set(r["area"] for r in INTERVIEW["candidates"]) == {"Baltimore", "Washington, DC", "Denver Metro", "Steamboat Springs", "Kansas City Metro"}
    assert all(r["visitStatus"] in {"unreviewed", "confirmed", "not_visited", "maybe"} and r["sourceUrl"].startswith("https://") for r in INTERVIEW["candidates"])
    confirmed_interview = [r for r in INTERVIEW["candidates"] if r["visitStatus"] == "confirmed"]
    assert len(confirmed_interview) == 5 and {r["confirmedVisitId"] for r in confirmed_interview} == {charleston["id"], woodberry["id"], "momofuku-ccdc-washington-dc", "rec-pier-chop-house-baltimore", "majestic-kansas-city"}
    clavel = next(r for r in INTERVIEW["candidates"] if r["area"] == "Baltimore" and r["name"] == "Clavel")
    assert clavel["visitStatus"] == "not_visited"
    cinghiale = next(r for r in INTERVIEW["candidates"] if r["name"] == "Cinghiale" and r["area"] == "Baltimore")
    assert cinghiale["visitStatus"] == "not_visited"
    petit_louis = next(r for r in INTERVIEW["candidates"] if r["name"] == "Petit Louis Bistro" and r["area"] == "Baltimore")
    assert petit_louis["visitStatus"] == "not_visited"
    foraged = next(r for r in INTERVIEW["candidates"] if r["name"] == "Foraged" and r["area"] == "Baltimore")
    assert foraged["visitStatus"] == "not_visited"
    dc_momo = next(r for r in INTERVIEW["candidates"] if r["name"] == "Momofuku CCDC" and r["area"] == "Washington, DC")
    assert dc_momo["visitStatus"] == "confirmed" and dc_momo["userMemoryLead"]["identityConfirmed"] is True
    assert dc_momo["confirmedVisitId"] == "momofuku-ccdc-washington-dc"
    momofuku = next(r for r in DATA["entries"] if r["id"] == "momofuku-ccdc-washington-dc")
    assert momofuku["status"] == "confirmed" and momofuku["visit"]["date"] is None
    assert momofuku["guide"]["distinction"] == "plate" and momofuku["guide"]["stars"] == 0
    assert momofuku["recognitions"][0]["recognitionAtDifferentVenue"] is True
    assert not any(r["name"] in {"Foraged", "Ekiben"} for r in DATA["entries"])
    ekiben = next(r for r in INTERVIEW["candidates"] if r["name"] == "Ekiben" and r["area"] == "Baltimore")
    assert ekiben["visitStatus"] == "not_visited"
    alma = next(r for r in INTERVIEW["candidates"] if r["name"] == "Alma Cocina Latina" and r["area"] == "Baltimore")
    assert alma["visitStatus"] == "maybe"
    assert "possibly visited" in alma["reviewSource"]
    assert not any(r["name"] == "Alma Cocina Latina" for r in DATA["entries"])
    magdalena = next(r for r in INTERVIEW["candidates"] if r["name"] == "Magdalena" and r["area"] == "Baltimore")
    assert magdalena["visitStatus"] == "unreviewed"
    assert "2020" in magdalena["interviewCue"]
    assert "visitStatus===\"maybe\"" in (ROOT / "dining-interview.js").read_text(encoding="utf-8")
    assert len([r for r in DATA["entries"] if r["status"] == "confirmed"]) == 12
    breck = next(r for r in DATA["entries"] if r["name"] == "Breckenridge Distillery Restaurant")
    assert breck["visit"]["visitYears"] == [2021, 2022, 2023]
    assert breck["visit"]["date"] is None
    assert breck["curation"]["status"] == "needs_verification"
    for name in ("Sauvage", "Gunther & Co.", "Thames Street Oyster House"):
        found = next(r for r in DATA["entries"] if r["name"] == name)
        assert found["status"] == "confirmed" and found["guide"]["distinction"] == "not_covered"
        assert found["guide"]["stars"] == 0
    sauv = next(r for r in DATA["entries"] if r["name"] == "Sauvage")
    gunther = next(r for r in DATA["entries"] if r["name"] == "Gunther & Co.")
    thames = next(r for r in DATA["entries"] if r["name"] == "Thames Street Oyster House")
    assert sauv["visit"]["precision"] == "month" and sauv["visit"]["approximateYear"] == 2021 and sauv["visit"]["month"] == 1
    assert gunther["visit"]["date"] == "2020-02-14"
    assert thames["visit"]["date"] is None and thames["visit"]["precision"] == "unknown"
    assert sauv["favorite"] is True and gunther["favorite"] is True
    pending = next(r for r in INTERVIEW["candidates"] if r["name"] == "Rec Pier Chop House")
    assert pending["visitStatus"] == "confirmed" and pending["userMemoryLead"]["identityConfirmed"] is True
    assert pending["confirmedVisitId"] == "rec-pier-chop-house-baltimore"
    assert not any(r["name"] == "Le Fou Frog" for r in DATA["entries"])
    assert not any(r["name"] == "Le Fou Frog" for r in INTERVIEW["candidates"])
    majestic = next(r for r in DATA["entries"] if r["id"] == "majestic-kansas-city")
    rec_pier = next(r for r in DATA["entries"] if r["id"] == "rec-pier-chop-house-baltimore")
    assert majestic["status"] == rec_pier["status"] == "confirmed"
    assert majestic["visit"]["date"] is None and rec_pier["visit"]["date"] is None
    assert any(r["name"] == "Rec Pier Chop House" for r in DATA["entries"])
    assert len(INTERVIEW["candidates"]) == 58
    assert not any(r["name"] == "Petit Louis Bistro" for r in DATA["entries"])
    assert not any(r["name"] == "Cinghiale" for r in DATA["entries"])
    assert not any(r["name"] == "Clavel" for r in DATA["entries"])
    assert "visitStatus===\"not_visited\"" in (ROOT / "dining-interview.js").read_text(encoding="utf-8")
    assert "getAnswer(r)" in (ROOT / "dining-interview.js").read_text(encoding="utf-8")
    assert "Charleston" in [r["name"] for r in INTERVIEW["candidates"]]
    assert "Interview" in QUESTIONS
    assert "./data/dining.json" in JS
    assert "./dining.html" in INDEX
    assert "body.is-embedded .dining-promo" in CSS
    assert 'src="http' not in HTML
    print("OK: dining archive distinctions, evidence gates, candidates and navigation")


if __name__ == "__main__":
    main()
