#!/usr/bin/env python3
"""Validate conference identity metadata against mapped experiences."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load(path):
    with path.open('r', encoding='utf-8') as handle:
        return json.load(handle)


def main():
    experiences = load(ROOT / 'data' / 'experiences.json')['experiences']
    conferences = load(ROOT / 'data' / 'conferences.json')['conferences']

    conference_experiences = {e['id']: e for e in experiences if e.get('category') == 'conference'}
    metadata = {c['experienceId']: c for c in conferences}

    assert set(conference_experiences) == set(metadata), (
        'Every conference experience must have exactly one named conference metadata record'
    )

    for experience_id, conference in metadata.items():
        experience = conference_experiences[experience_id]
        assert conference['placeId'] == experience['placeId'], f'Place mismatch for {experience_id}'
        assert conference.get('eventName'), f'Missing eventName for {experience_id}'
        assert conference.get('shortName'), f'Missing shortName for {experience_id}'
        assert conference.get('locationLabel'), f'Missing locationLabel for {experience_id}'

    expected = {
        'conference-kirtland-afb': 'VOLTRON Meeting',
        'conference-los-angeles': 'Ground System Architectures Workshop (GSAW)',
        'conference-big-sky': 'IEEE Aerospace Conference',
        'conference-ieee-past-2019': '2019 IEEE International Symposium on Phased Array Systems and Technology',
    }
    for experience_id, event_name in expected.items():
        assert metadata[experience_id]['eventName'] == event_name

    print(f'OK: {len(conferences)} named conference records')


if __name__ == '__main__':
    main()
