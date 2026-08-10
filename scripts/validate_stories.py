#!/usr/bin/env python3
"""Validate curated story data against the canonical life-map datasets."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load_json(path: str) -> dict:
    with (ROOT / path).open("r", encoding="utf-8") as handle:
        return json.load(handle)


def main() -> None:
    places = load_json("data/places.json").get("places", [])
    experiences = load_json("data/experiences.json").get("experiences", [])
    stories = load_json("data/stories.json")

    place_ids = {place["id"] for place in places}
    experience_place_ids = {exp["placeId"] for exp in experiences}
    errors: list[str] = []

    chapters = stories.get("careerChapters", [])
    chapter_ids = [chapter.get("id") for chapter in chapters]
    if len(chapter_ids) != len(set(chapter_ids)):
        errors.append("careerChapters contains duplicate ids")

    for chapter in chapters:
        place_id = chapter.get("placeId")
        if place_id not in place_ids:
            errors.append(f"career chapter {chapter.get('id')!r} references unknown place {place_id!r}")
        elif place_id not in experience_place_ids:
            errors.append(f"career chapter {chapter.get('id')!r} references a place with no experience")

    for place_id, story in stories.get("places", {}).items():
        if place_id not in place_ids:
            errors.append(f"story references unknown place {place_id!r}")
            continue
        if place_id not in experience_place_ids:
            errors.append(f"story place {place_id!r} has no mapped experience")

        for related_id in story.get("relatedPlaceIds", []):
            if related_id not in place_ids:
                errors.append(f"story {place_id!r} references unknown related place {related_id!r}")

    if errors:
        raise SystemExit("Story validation failed:\n- " + "\n- ".join(errors))

    print(
        f"Story validation passed: {len(chapters)} career chapters, "
        f"{len(stories.get('places', {}))} curated place stories."
    )


if __name__ == "__main__":
    main()
