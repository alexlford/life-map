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
assert len(records) == 55 and len(venues) == 53
assert len({r["id"] for r in records}) == len(records)
assert len({v["id"] for v in venues}) == len(venues)
types = {"dining", "bar", "concert", "opera", "theater"}
assert {c["id"] for c in records_data["categories"]} == types
venue_ids = {v["id"] for v in venues}
assert all(r["status"] in {"confirmed", "reservation_only"} and r["type"] in types for r in records)
assert len([r for r in records if r["status"] == "confirmed"]) == 53
assert {r["title"] for r in records if r["status"] == "reservation_only"} == {"Q House", "Wildflower"}
assert all(r["visit"]["date"] is None and r["reservations"] for r in records if r["status"] == "reservation_only")
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
assert len(candidates) >= 178
assert len({c["id"] for c in candidates}) == len(candidates)
assert len({(c["area"].casefold(), c["name"].casefold()) for c in candidates}) == len(candidates)
assert all(c["sourceUrl"].startswith("https://") for c in candidates)
assert all(c["visitStatus"] in {"confirmed", "not_visited", "maybe", "unreviewed"} for c in candidates)
# NYC bar interview must retain explicit user responses and never count either as confirmed.
pdt = next(c for c in candidates if c["area"] == "New York City" and c["name"] == "PDT (Please Don't Tell)")
rabbit = next(c for c in candidates if c["area"] == "New York City" and c["name"] == "The Dead Rabbit")
assert pdt["visitStatus"] == "maybe" and rabbit["visitStatus"] == "not_visited"
leyenda = next(c for c in candidates if c["area"] == "New York City" and c["name"] == "Leyenda")
dante = next(c for c in candidates if c["area"] == "New York City" and c["name"] == "Dante")
assert leyenda["visitStatus"] == "not_visited" and leyenda["visitPeriod"].startswith("2018–2020")
assert dante["visitStatus"] == "not_visited" and dante["visitPeriod"].startswith("New York City, 2018–2020")
assert "did not visit" in dante["reviewSource"].lower()
assert "2018" in dante["recognition"] and dante["screening"]["status"] == "award_qualified"
bar_goto = next(c for c in candidates if c["area"] == "New York City" and c["name"] == "Bar Goto")
assert bar_goto["visitStatus"] == "not_visited"
assert bar_goto["reviewedOn"] == "2026-10-25"
assert "did not visit" in bar_goto["reviewSource"].lower()
assert bar_goto["recognitionYear"] == 2018 and bar_goto["screening"]["status"] == "award_qualified"
assert not any(r["title"] in {"Bar Goto", "The Dead Rabbit", "Dante", "Leyenda", "PDT (Please Don't Tell)"} for r in records)
existing_conditions = next(c for c in candidates if c["area"] == "New York City" and c["name"] == "Existing Conditions")
assert existing_conditions["visitStatus"] == "not_visited"
assert not any(r["title"] == "Existing Conditions" for r in records)
assert pdt["visitStatus"] == "maybe" and rabbit["visitStatus"] == "not_visited"
assert leyenda["visitStatus"] == "not_visited"
assert not any(r["title"] in {"Leyenda", "Dante"} for r in records)
assert rabbit["recognitionYear"] == 2019 and "finalist" in rabbit["recognition"]
assert not any(r["title"] in {"PDT (Please Don't Tell)", "The Dead Rabbit"} for r in records)

assert {"Baltimore", "Washington, DC", "Denver Metro", "Steamboat Springs", "Charleston, SC", "Kansas City Metro"}.issubset({c["area"] for c in candidates})
assert interview_data["periods"]["Charleston, SC"].endswith("2017–2018")
assert "2010" in interview_data["periods"]["Kansas City Metro"]
majestic = next(c for c in candidates if c["name"] == "The Majestic Restaurant" and c["area"] == "Kansas City Metro")
assert majestic["visitStatus"] == "confirmed" and majestic["userMemoryLead"]["identityConfirmed"] is True
assert majestic["confirmedVisitId"] == "dining-majestic-kansas-city"
assert "DOWNSTAIRS" in majestic["interviewCue"]
assert any(r["title"] == "The Majestic Restaurant" and r["status"] == "confirmed" for r in records)
rec_pier = next(c for c in candidates if c["name"] == "Rec Pier Chop House" and c["area"] == "Baltimore")
assert rec_pier["visitStatus"] == "confirmed" and rec_pier["confirmedVisitId"] == "dining-rec-pier-chop-house-baltimore"
assert not any(r["title"] == "Le Fou Frog" for r in records)
assert not any(c["name"] == "Le Fou Frog" for c in candidates)
north_pond = next(c for c in candidates if c["name"] == "North Pond" and c["area"] == "Chicago")
assert north_pond["visitStatus"] == "confirmed" and north_pond["confirmedVisitId"] == "dining-north-pond-chicago-2021"
assert north_pond["userMemoryLead"]["identityConfirmed"] is True
assert north_pond["screening"]["basis"] == "both"
assert any(r["title"] == "North Pond" and r["guide"]["stars"] == 1 for r in records)
assert len([r for r in records if r["type"] == "dining" and r["status"] == "confirmed"]) == 22
assert len([r for r in records if r["type"] == "bar" and r["status"] == "confirmed"]) == 2
breck = [r for r in records if r["venueId"] == "venue-breckenridge-distillery"]
assert len(breck) == 3
assert sorted(r["visit"]["year"] for r in breck) == [2021, 2022, 2023]
assert all(r["visit"]["date"] is None and r["visit"]["precision"] == "approximate_year" for r in breck)
assert all(r["editorial"]["awardQualified"] is False and r["editorial"]["featuredException"] is False for r in breck)
assert len({r["venueId"] for r in records}) == 53
qbreck = next(c for c in candidates if c["name"] == "Breckenridge Distillery Restaurant")
assert qbreck["visitStatus"] == "confirmed" and set(qbreck["linkedVisitIds"]) == {r["id"] for r in breck}
assert qbreck["screening"]["status"] == "memory_only"
assert {"New York City", "Chicago", "St. Louis", "Breckenridge"}.issubset({c["area"] for c in candidates})
assert interview_data["periods"]["New York City"].startswith("2018–2020")
assert "2010" in interview_data["periods"]["Chicago"]
assert interview_data["periods"]["St. Louis"].startswith("2011–2014")
assert interview_data["periods"]["Breckenridge"] == "2021, 2022 and 2023"
assert all(next(c for c in candidates if c["name"] == name)["visitStatus"] == "unreviewed" for name in ["The Aviary", "The Violet Hour"])
dominics = next(c for c in candidates if c["name"] == "Dominic's on the Hill")
assert dominics["visitStatus"] == "confirmed" and dominics["visitPeriod"] == "December 28, 2012"
assert dominics["researchOnly"] is True
assert not any(r["title"] == "Dominic's on the Hill" for r in records)
assert next(c for c in candidates if c["name"] == "The Aviary")["screening"]["status"] == "award_qualified"
assert not any(r["title"] in {"PDT (Please Don't Tell)", "The Aviary", "Dominic's on the Hill"} for r in records)
manifesto = next(r for r in records if r["title"] == "Manifesto" and r["type"] == "bar")
assert manifesto["editorial"]["awardQualified"] is True
assert any(a["year"] == 2018 and a["category"] == "Outstanding Bar Program" and a["result"] == "semifinalist" for a in manifesto["recognitions"])
death_and_co = next(r for r in records if r["title"] == "Death & Co Denver" and r["type"] == "bar")
assert death_and_co["editorial"]["awardQualified"] is False and death_and_co["editorial"]["featuredException"] is True
for name in ("Sauvage", "Gunther & Co.", "The Majestic Restaurant"):
    rec = next(r for r in records if r["title"] == name)
    assert rec["editorial"]["awardQualified"] is False and rec["editorial"]["featuredException"] is True
assert {r["title"] for r in records if r["status"] == "confirmed" and r.get("editorial", {}).get("awardQualified")} == {"République", "Minetta Tavern", "Beckon", "Charleston", "Woodberry Kitchen", "Momofuku CCDC", "Manifesto", "Yuan Wonton", "Safta", "Smok", "Mister Oso", "North Pond", "Annette", "Mercantile Dining & Provision", "Barolo Grill"}
assert all(not r.get("editorial", {}).get("awardQualified") or not r.get("editorial", {}).get("featuredException") for r in records)
assert any(c["name"] == "Manifesto" and c["visitStatus"] == "confirmed" for c in candidates)
assert any(c["name"] == "Death & Co Denver" and c["visitStatus"] == "confirmed" for c in candidates)
assert 'data-type="bar"' in (ROOT / "explore.html").read_text(encoding="utf-8")
assert 'id="bar-count"' in (ROOT / "index.html").read_text(encoding="utf-8")
assert 'x.editorial?.featuredException' in (ROOT / "assets/app.js").read_text(encoding="utf-8")
assert all(c.get("confirmedVisitId") in {r["id"] for r in records}
           for c in candidates if c["visitStatus"] == "confirmed" and c.get("confirmedVisitId"))
assert any(c["name"] == "Alma Cocina Latina" and c["visitStatus"] == "maybe" for c in candidates)
pdt = next(c for c in candidates if c["name"] == "PDT (Please Don't Tell)" and c["area"] == "New York City")
assert pdt["visitStatus"] == "maybe" and "2018–2020" in pdt["visitPeriod"]
assert pdt["recognitionYear"] == 2012 and pdt["screening"]["status"] == "award_qualified"
assert pdt["sourceUrl"].startswith("https://archive.jamesbeard.org")
assert not any(r["title"] == "PDT (Please Don't Tell)" for r in records)
for name, area in [("Clover Club", "New York City"), ("Columbia Room", "Washington, DC"),
                   ("Best Intentions", "Chicago"), ("Hopleaf Bar", "Chicago"),
                   ("Fern Bar", "Kansas City Metro"), ("Wild Child", "Kansas City Metro"),
                   ("Traveling Mercies", "Denver Metro")]:
    candidate = next(c for c in candidates if c["name"] == name and c["area"] == area)
    assert candidate["visitStatus"] == "unreviewed"
    assert candidate["screening"]["status"] == "award_qualified"
    assert candidate["sourceUrl"].startswith("https://")
assert any(c["name"] == "Gunther & Co." and c["visitStatus"] == "confirmed" for c in candidates)
assert all(len(c.get("linkedVisitIds", [])) == 3 for c in candidates if c["name"] == "Breckenridge Distillery Restaurant")
assert all(c["name"] not in {r["title"] for r in records}
           for c in candidates if c["visitStatus"] == "not_visited")
for page in ("index", "explore", "timeline", "map", "record", "interview"):
    source = (ROOT / (page + ".html")).read_text(encoding="utf-8")
    assert "Culture Passport" in source and "./assets/site.css" in source
    assert "./assets/app.js" in source
map_html = (ROOT / "map.html").read_text(encoding="utf-8")
assert map_html.index("leaflet.js") < map_html.index('src="./assets/app.js'), "Load Leaflet before Culture map app"
assert 'id="interview-period"' in (ROOT / "interview.html").read_text(encoding="utf-8")
assert 'byId("interview-period")' in (ROOT / "assets/app.js").read_text(encoding="utf-8")
assert (ROOT / "assets/app.js").exists()
assert (ROOT / "assets/site.css").exists()
evidence_data = json.loads((ROOT / "data/reservation-evidence.json").read_text(encoding="utf-8"))
reservations = evidence_data["entries"]
assert len(reservations) == 20 and len({e["id"] for e in reservations}) == 20
assert all(e["reservationDate"] and e["partySize"] >= 1 and e["source"] == "user_provided_reservation_screenshot" for e in reservations)
assert not any(e["name"] == "Le Fou Frog" for e in reservations)
assert sum(1 for e in reservations if e["name"] == "Ritual Social House") == 2
assert sum(1 for e in reservations if e["reservationStatus"] == "waitlist_completed") == 1
blanco = next(e for e in reservations if e["name"].startswith("Blanco Cocina"))
assert blanco["attendanceInference"] == "not_confirmed"
for name, date in [("Q House", "2021-10-21"), ("Wildflower", "2022-03-21")]:
    restaurant = next(r for r in records if r["title"] == name)
    assert restaurant["status"] == "reservation_only"
    assert restaurant["visit"]["date"] is None and restaurant["visit"]["evidenceType"] == "completed_reservation_only"
    assert restaurant["editorial"]["awardQualified"] is True  # Eligible venue, NOT proven attendance
    assert any(b["date"] == date and b["attendanceInference"] == "not_independently_verified" for b in restaurant["reservations"])
    assert any(e.get("archivedRecordId") == restaurant["id"] and e["publicCuration"] == "research_only" for e in reservations)
    candidate = next(c for c in candidates if c["name"] == name and c["area"] == "Denver Metro")
    assert candidate["visitStatus"] == "unreviewed" and candidate.get("bookingLeadRecordId") == restaurant["id"]
    assert not candidate.get("confirmedVisitId")
q_house = next(r for r in records if r["title"] == "Q House")
assert any(a["organization"] == "James Beard Foundation" and a["year"] == 2019 and a["result"] == "semifinalist" and a["timingRelativeToVisit"] == "unknown_visit_date" for a in q_house["recognitions"])
wildflower = next(r for r in records if r["title"] == "Wildflower")
assert wildflower["guide"]["stars"] == 0 and all(a["timingRelativeToVisit"] == "unknown_visit_date" for a in wildflower["recognitions"])
uchi = next(c for c in candidates if c["name"] == "Uchi Denver")
assert uchi["visitStatus"] == "confirmed" and not uchi.get("confirmedVisitId")
assert uchi["screening"]["status"] == "needs_verification"
mister = next(c for c in candidates if c["name"] == "Mister Oso" and c["area"] == "Denver Metro")
assert mister["visitStatus"] == "confirmed"
assert mister["confirmedVisitId"] == "dining-mister-oso-denver"
assert mister["screening"]["status"] == "award_qualified"
assert "branchWarning" not in mister
oso = next(r for r in records if r["title"] == "Mister Oso")
assert oso["guide"]["distinction"] == "bib" and oso["guide"]["stars"] == 0
assert "Señor Bear" in oso["memory"]["story"] and "Wash Park" in oso["memory"]["story"] and "RiNo" in oso["memory"]["story"]
assert not any(r["title"] in {"Uchi Denver", "Mister Oso Wash Park"} for r in records)
assert "culture.alexlford.com" in (ROOT / "README.md").read_text(encoding="utf-8")
print("Culture Passport OK: %d experiences, %d venues, %d interview prospects" %
      (len(records), len(venues), len(candidates)))

# Reservation provenance must be distinct from user-confirmed visits.
evidence = json.loads((ROOT / "data/reservation-evidence.json").read_text(encoding="utf-8"))
assert len(evidence["entries"]) == 20 and len(evidence["rows"]) == 52 and len({r["name"] for r in evidence["rows"]}) == 46
assert not any(r["name"] == "Le Fou Frog" for r in evidence["rows"])
assert not any(r["title"] == "Le Fou Frog" for r in records)
republique = next(r for r in records if r["title"] == "République")
assert republique["visit"]["date"] == "2026-10-24" and republique["visit"]["evidenceType"] == "direct_user_recollection"
for title, date in [("Woodberry Kitchen", "2018-05-16"), ("Momofuku CCDC", "2018-08-21"), ("Rec Pier Chop House", "2018-05-16")]:
    row = next(r for r in records if r["title"] == title)
    assert row["status"] == "confirmed" and row["visit"]["date"] is None
    assert row["visit"]["precision"] != "day"
    assert row["visit"]["attendanceCertainty"] == "user_confirmed_venue_exact_meal_date_unverified"
    assert any(b["date"] == date and b["attendanceInference"] == "not_independently_verified" for b in row["reservations"])
assert "2018" in next(r for r in records if r["title"] == "Woodberry Kitchen")["visit"]["label"]

# Yuan Wonton qualifies on its chef-owner's 2026 James Beard Best Chef: Mountain win.
yuan = next(r for r in records if r["title"] == "Yuan Wonton")
assert yuan["editorial"]["awardQualified"] is True and yuan["visit"]["date"] is None
assert yuan["recognitions"][0]["recipient"] == "Penelope Wong" and yuan["recognitions"][0]["year"] == 2026
assert yuan["recognitions"][0]["timingRelativeToVisit"] == "unknown_visit_date"
assert next(q for q in candidates if q["name"] == "Yuan Wonton")["confirmedVisitId"] == yuan["id"]
assert not any(r["title"] == "Bistro Barbès" for r in records)
excluded = json.loads((ROOT / "data/excluded-dining-memories.json").read_text(encoding="utf-8"))
assert any(r["name"] == "Bistro Barbès" and r["qualifies"] is False for r in excluded["entries"])

# Two user-confirmed Source Hotel visits are Michelin Selected, never stars.
for name in ("Safta", "Smok"):
    r = next(x for x in records if x["title"] == name)
    assert r["type"] == "dining" and r["status"] == "confirmed"
    assert r["visit"]["date"] is None and r["visit"]["year"] is None
    assert r["guide"]["distinction"] == "selected" and r["guide"]["stars"] == 0
    assert r["editorial"]["awardQualified"] is True and r["memory"]["headline"]
    q = next(x for x in candidates if x["name"] == name and x["area"] == "Denver Metro")
    assert q["visitStatus"] == "confirmed" and q["confirmedVisitId"] == r["id"]

# The story should lead the experience page, with precise booking details tucked away.
assert sum(bool(r.get("memory")) for r in records) >= 19
assert 'Archive details & sources' in (ROOT / "assets/app.js").read_text(encoding="utf-8")
assert 'const storyPeriod=(r)' in (ROOT / "assets/app.js").read_text(encoding="utf-8")
assert 'function timelineChapter' not in (ROOT / "assets/app.js").read_text(encoding="utf-8") or 'Other memories' in (ROOT / "assets/app.js").read_text(encoding="utf-8")

# Historical Colorado interview expansion: candidates, not automatically confirmed visits.
for area in ("Boulder", "Aspen", "Vail / Beaver Creek", "Telluride", "Breckenridge"):
    assert sum(c["area"] == area for c in candidates) >= (11 if area == "Boulder" else 3 if area != "Telluride" else 1)
for name,area in (("Basta","Boulder"),("Bosq","Aspen"),("Radicato","Breckenridge"),("Sweet Basil","Vail / Beaver Creek"),("The National","Telluride")):
    c = next(c for c in candidates if c["name"] == name and c["area"] == area)
    assert c["visitStatus"] == "unreviewed" and c["screening"]["status"] == "award_qualified"
assert next(c for c in candidates if c["name"] == "Frasca Food and Wine")["area"] == "Boulder"

# Stable batch interview: answering must never rebuild the list and lose scroll position.
app_js = (ROOT / "assets/app.js").read_text(encoding="utf-8")
interview_html = (ROOT / "interview.html").read_text(encoding="utf-8")
assert 'const batchSize=12' in app_js
assert 'do not rebuild the card or page after answering' in app_js
assert 'localStorage.setItem(uiKey' in app_js
assert 'id="interview-next"' in interview_html and 'id="interview-previous"' in interview_html
assert 'id="interview-save-status"' in interview_html
for title in ("Sauvage", "Charleston", "Safta", "Manifesto"):
    rec = next(r for r in records if r["title"] == title)
    assert rec.get("reservations") and rec.get("memory",{}).get("story")
manifesto = next(r for r in records if r["title"] == "Manifesto")
assert manifesto["reservations"][0]["date"] == "2019-10-25"
assert len([r for r in evidence["rows"] if r["name"] == "Sauvage"]) == 2
assert len([r for r in evidence["rows"] if r["name"] == "Michelob Ultra Mountain House"]) == 3
assert not any(r["title"] in {"Michelob Ultra Mountain House", "The Butcher's Daughter - West Hollywood", "Willow Creek Restaurant", "Q39 South"} for r in records)


# Venue-level audit: do not inflate stats with repeat visits or unverified awards.
aud = json.loads((ROOT / "data/dining-awards-audit.json").read_text(encoding="utf-8"))
assert aud["summary"] == {
    "canonExperienceRecords": 24,
    "distinctPublishedVenues": 22,
    "recognized": 15,
    "featuredPersonal": 4,
    "unfeaturedOther": 3,
    "additionalConfirmedArchiveOnly": 6,
    "possibleVisitLeads": 3,
    "reviewedButNotConfirmedReservations": 4,
}
assert {x["venueId"] for x in aud["publishedVenues"]} == {r["venueId"] for r in records if r["type"] in {"dining", "bar"} and r["status"] == "confirmed"}
assert {x["name"] for x in aud["reservationOnlyVenues"]} == {"Q House", "Wildflower"}
assert not {"Q House", "Wildflower"} & {x["name"] for x in aud["publishedVenues"]}
assert {r["title"] for r in records if r["status"] == "reservation_only"} == {x["name"] for x in aud["reservationOnlyVenues"]}
assert sum(r["status"] == "confirmed" and r["type"] in {"dining", "bar"} for r in records) == 24
assert {x["name"] for x in aud["confirmedArchiveOnly"]} == {
    "Joe's Kansas City Bar-B-Que", "Q39", "Arthur Bryant's Barbeque",
    "Jack Stack Barbecue", "Uchi Denver", "Dominic's on the Hill"
}
assert {x["name"] for x in aud["possiblyVisited"]} == {
    "Alma Cocina Latina", "Lucina Eatery & Bar", "PDT (Please Don't Tell)"
}
assert next(x for x in aud["publishedVenues"] if x["name"] == "North Pond")["recognitionStatus"] == "qualifies"
for name in ("Annette", "Mercantile Dining & Provision", "Barolo Grill"):
    row = next(r for r in records if r["title"] == name)
    assert row["status"] == "confirmed" and row["editorial"]["awardQualified"] is True
    assert row["visit"]["date"] is None and row["memory"]["headline"]
for name in ("Q39", "Joe's Kansas City Bar-B-Que", "Arthur Bryant's Barbeque", "Jack Stack Barbecue (Freight House)"):
    candidate = next(q for q in candidates if q["name"] == name)
    assert candidate["visitStatus"] == "confirmed" and candidate["screening"]["status"] == "memory_only"
    assert not any(r["title"] == name for r in records)
assert next(q for q in candidates if q["name"] == "Lucina Eatery & Bar")["visitStatus"] == "maybe"
assert len([r for r in records if r.get("guide", {}).get("distinction") == "starred"]) == 3
assert len([r for r in records if r["status"] == "confirmed" and r.get("editorial", {}).get("awardQualified")]) == 15

# Theater memories: preserve uncertainty in titles, not in the fact an outing occurred.
stage=[r for r in records if r["id"] in {"theater-book-of-mormon-kansas-city-2016", "theater-second-city-chicago-2017", "theater-six-denver-2023", "theater-denver-holiday-theater-2024"}]
assert len(stage) == 4
assert all(r["visit"]["date"] is None and r["visit"]["year"] in {2016,2017,2023,2024} for r in stage)
assert {r["title"] for r in stage} == {"The Book of Mormon", "SIX", "The Second City — Chicago holiday outing", "Denver holiday theater outing"}
assert next(r for r in stage if r["title"] == "The Book of Mormon")["production"]["engagementWindow"] == "December 6–11, 2016"
assert next(r for r in stage if r["title"] == "SIX")["production"]["engagementWindow"] == "December 5–24, 2023"
assert next(r for r in stage if r["title"] == "Denver holiday theater outing")["production"]["titleConfirmed"] is False
assert next(r for r in stage if r["title"] == "The Second City — Chicago holiday outing")["production"]["titleConfirmed"] is False
stage_research=json.loads((ROOT / "data/performance-interview.json").read_text(encoding="utf-8"))
assert len(stage_research["candidates"]) >= 3
assert any(c["id"] == "denver-unknown-play" for c in stage_research["candidates"])

# Stage chronology preserves distinct performances and existing theater entries.
stage = [r for r in records if r["type"] in {"concert","opera","theater"}]
assert len(stage) == 29 and len([r for r in stage if r["title"].startswith("Lollapalooza")]) == 1
assert any(r["title"] == "The Book of Mormon" and r["visit"]["year"] == 2016 and r["visit"]["date"] is None for r in stage)
assert any(r["title"] == "SIX" and r["visit"]["year"] == 2023 and r["visit"]["date"] is None for r in stage)
assert any(r["type"] == "opera" and "Ring" in r["title"] for r in stage)
assert all(r["memory"]["story"] for r in stage)
theater_leads = json.loads((ROOT / "data/performance-leads.json").read_text(encoding="utf-8"))
assert any(x["id"] == "another-denver-show" for x in theater_leads["leads"])

# Precision and provenance in date presentation.
assert next(c for c in candidates if c["name"] == "PDT (Please Don't Tell)")["visitStatus"] == "maybe"
assert next(c for c in candidates if c["name"] == "The Dead Rabbit")["visitStatus"] == "not_visited"
assert next(c for c in candidates if c["name"] == "Existing Conditions")["visitStatus"] == "not_visited"
assert any(c["id"] == "lyric-ring-performances" for c in stage_research["candidates"])
date_app=(ROOT / "assets/app.js").read_text(encoding="utf-8")
assert "const readableDate=(d)=>" in date_app
assert "reservation on file" in date_app
assert "Reservation evidence:" in date_app
assert "Production's engagement dates:" in date_app
assert "const dateMonth=" in date_app

# The performing-arts interview must preserve all published memories and keep research leads separate.
performance_leads=json.loads((ROOT / "data/performance-interview.json").read_text(encoding="utf-8"))
assert len(performance_leads["candidates"]) >= 9
assert len({c["id"] for c in performance_leads["candidates"]}) == len(performance_leads["candidates"])
assert any(c["id"] == "denver-unknown-play" for c in performance_leads["candidates"])
assert any(c["id"] == "denver-hamlet-2024" and c["confirmation"] == "unreviewed_candidate" for c in performance_leads["candidates"])
assert all(c["sourceUrl"].startswith("https://") for c in performance_leads["candidates"])
performance_page=(ROOT / "performance-interview.html").read_text(encoding="utf-8")
performance_js=(ROOT / "assets/performance-interview.js").read_text(encoding="utf-8")
assert "performance-candidates" in performance_page and "performance-notes" in performance_page
assert "performance-interview.js" in performance_page and "performance-interview.html" in (ROOT / "interview.html").read_text(encoding="utf-8")
assert "performance-interview.html" in (ROOT / "index.html").read_text(encoding="utf-8")
assert 'localStorage.setItem(storageKey' in performance_js
assert "preserve the entire card" in performance_js
assert "denver-unknown-play" in performance_js
assert {"The Book of Mormon", "SIX", "The Second City — Chicago holiday outing", "Denver holiday theater outing"}.issubset({x["title"] for x in stage})


# Provenance and geography integrity for the new Boston / Cape Cod memory lead.
assert {"Boston", "Cape Cod"}.issubset(interview_data["periods"])
assert any(lead["id"] == "boston-cape-cod-seafood-unknown"
           and lead["venueIdentityConfirmed"] is False
           and lead["publishAsExperience"] is False
           and lead["visitDate"] is None
           for lead in interview_data["memoryLeads"])
assert not any(r["title"].startswith("Unidentified excellent fish restaurant") for r in records)
# Bookings must not be treated as a user-confirmed dinner date.
assert all(r["visit"]["date"] is None for r in records if r["visit"].get("evidenceType") == "completed_reservation_only")
assert not any(r["status"] == "confirmed" and r["visit"]["attendanceCertainty"] == "not_independently_verified"
               for r in records if "attendanceCertainty" in r["visit"])
