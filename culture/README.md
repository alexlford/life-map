# Culture Passport — independent site preview

Culture Passport is a fourth personal experience website alongside Sports, Adventures, and Personal Atlas. It covers restaurants, concerts, opera, plays, musicals, and live theater.

## Publishing status

Preview: https://alexlford.github.io/life-map/culture/
Proposed independent domain: culture.alexlford.com (not configured or live).

The preview is isolated under the culture/ subdirectory within the existing life-map repository because the current GitHub connector can edit repository files but cannot create a new repository or configure DNS. The new site should ultimately live in its own GitHub repository and publishing pipeline, independent of all three existing websites.

## Experience archive

- index.html: editorial home with four cultural chapters
- explore.html: category and city search
- timeline.html: chronological experiences, with undated visits preserved as undated
- map.html: city-center pins with explicit approximate-coordinate disclaimers
- record.html: per-experience evidence, dated awards and provenance
- interview.html: historical restaurant questionnaire, locally saved until reviewed

data/records.json is the independent canonical dataset of confirmed experiences (currently nine documented restaurants); no concerts, operas or theater appearances are invented. Each experience references a stable venue ID. Repeat restaurant trips will receive unique experience IDs. Unknown dates remain unknown.

data/interview.json is a separate candidate ledger with directly answered visited/not-visited/maybe statuses and new research candidates. Browsing or clicking a response never publishes an unverified visit. New answers are saved only in the browser and must be copied into ChatGPT for review and commit.

## Ongoing restaurant discovery

Continue asking Alex about one plausible restaurant at a time: first Magdalena, then La Cuchara, then new Baltimore candidates, then Washington DC, Denver and Steamboat. Keep researching credible period-matched candidates and historically dated Michelin and James Beard distinctions. Source every new candidate and remember that a chef award is not necessarily a restaurant award, a guide selection is not a star, and a later honor cannot be retroactively attached to a meal. Do not recount confirmed visits or assume ambiguous dates.

## Migration plan

1. Create a separate Culture Passport GitHub repository.
2. Copy the complete culture/ folder contents into its repository root.
3. Configure independent GitHub Pages, DNS and HTTPS at culture.alexlford.com.
4. Verify all URLs, maps, permissions and mobile layouts.
5. Redirect the previous Culinary Passport URL without breaking old inbound links.

## Validation

Run python culture/scripts/validate.py and node --check culture/assets/app.js from the parent life-map repository. Enforce these in CI before merging.
