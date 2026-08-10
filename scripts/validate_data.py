#!/usr/bin/env python3
"""Validate the life-map source data and a few important geography invariants."""

from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLACES_PATH = ROOT / "data" / "places.json"
EXPERIENCES_PATH = ROOT / "data" / "experiences.json"


def load(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def distance_miles(a: dict, b: dict) -> float:
    """Great-circle distance between two place records."""
    lat1 = math.radians(a["coordinates"]["lat"])
    lon1 = math.radians(a["coordinates"]["lng"])
    lat2 = math.radians(b["coordinates"]["lat"])
    lon2 = math.radians(b["coordinates"]["lng"])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 3958.7613 * 2 * math.asin(math.sqrt(h))


def main() -> None:
    places_doc = load(PLACES_PATH)
    experiences_doc = load(EXPERIENCES_PATH)

    places = places_doc["places"]
    experiences = experiences_doc["experiences"]

    place_ids = [p["id"] for p in places]
    assert len(place_ids) == len(set(place_ids)), "Duplicate place id"
    by_id = {p["id"]: p for p in places}

    experience_ids = [e["id"] for e in experiences]
    assert len(experience_ids) == len(set(experience_ids)), "Duplicate experience id"

    for p in places:
        lat = p["coordinates"]["lat"]
        lng = p["coordinates"]["lng"]
        assert -90 <= lat <= 90, f"Invalid latitude: {p['id']}"
        assert -180 <= lng <= 180, f"Invalid longitude: {p['id']}"
        assert p["coordinatePrecision"] in {"building", "installation", "campus", "venue", "city"}

    for e in experiences:
        assert e["placeId"] in by_id, f"Unknown placeId in {e['id']}: {e['placeId']}"

    # Mid-Atlantic sanity check: Washington, DC is east and slightly north of DARPA HQ in Arlington.
    dc = by_id["washington-dc"]
    darpa = by_id["darpa-hq"]
    assert dc["coordinates"]["lng"] > darpa["coordinates"]["lng"], "DC must plot east of DARPA HQ"
    assert dc["coordinates"]["lat"] > darpa["coordinates"]["lat"], "DC must plot north of DARPA HQ"

    # UK sanity check: RAF Molesworth and RAF Alconbury are close neighbors, not distant UK points.
    molesworth = by_id["raf-molesworth"]
    alconbury = by_id["raf-alconbury"]
    uk_distance = distance_miles(molesworth, alconbury)
    assert 6.0 < uk_distance < 10.0, f"Molesworth/Alconbury distance looks wrong: {uk_distance:.2f} mi"

    # Guam sanity checks: Apra Harbor is southwest; Camp Blaz and Andersen are clustered in the north.
    naval = by_id["naval-base-guam"]
    blaz = by_id["camp-blaz"]
    andersen = by_id["andersen-afb"]
    assert naval["coordinates"]["lat"] < blaz["coordinates"]["lat"], "Naval Base Guam must plot south of Camp Blaz"
    assert naval["coordinates"]["lng"] < blaz["coordinates"]["lng"], "Naval Base Guam must plot west of Camp Blaz"
    assert blaz["coordinates"]["lng"] < andersen["coordinates"]["lng"], "Camp Blaz must plot west of Andersen AFB"
    assert distance_miles(blaz, andersen) < 7.0, "Camp Blaz and Andersen AFB should be a tight northern Guam cluster"

    # Southern California sanity checks: Space Park and LA SFB are in the LA South Bay cluster; Azusa is east.
    space_park = by_id["ng-space-park"]
    la_sfb = by_id["los-angeles-sfb"]
    azusa = by_id["ng-azusa"]
    assert distance_miles(space_park, la_sfb) < 5.0, "Space Park and LA SFB should plot near one another"
    assert azusa["coordinates"]["lng"] > la_sfb["coordinates"]["lng"], "Azusa should plot east of the LA South Bay sites"

    print(f"OK: {len(places)} places, {len(experiences)} experiences")
    print(f"RAF Molesworth ↔ RAF Alconbury: {uk_distance:.2f} mi")
    print(f"Camp Blaz ↔ Andersen AFB: {distance_miles(blaz, andersen):.2f} mi")
    print(f"Space Park ↔ Los Angeles SFB: {distance_miles(space_park, la_sfb):.2f} mi")


if __name__ == "__main__":
    main()
