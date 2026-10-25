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

## Charleston, SC and Kansas City memory reconstruction (October 2026)

- Charleston, SC (2017–2018): Alex spent about three months in Charleston across 2017–2018. The 16 new candidates include period-correct culinary landmarks. FIG's 2018 James Beard Outstanding Wine Program win and Rodney Scott's 2018 Best Chef: Southeast award are contemporaneous historical honors, but specific meals could predate them.
- Kansas City metro (2010–present): Alex has spent considerable time in the region. The 17 new candidates cover both the Missouri and Kansas sides. High-priority identification lead: a remembered steakhouse with a basement jazz bar, which strongly matches The Majestic Restaurant at 931 Broadway. Not yet confirmed by Alex, so do not count it as a visit.
- Historical restaurant candidates are researched leads, not evidence of visits. Never add them to the nine confirmed records without explicit user confirmation.
- The map must load the Leaflet library before its application script. The validator enforces script ordering.

Sources:
- https://majestickc.com/jazz-club/
- https://www.visitkc.com/articles/jazz-clubs-in-kansas-city/
- https://www.jamesbeard.org/stories/the-2018-james-beard-award-winners
- https://carolinas.eater.com/2018/2/16/17017044/james-beard-awards-2018-charleston
- https://www.visitkc.com/articles/kansas-citys-james-beard-award-restaurants-and-bars/

## October 25, 2026 confirmations

**The Majestic Restaurant** in Kansas City and **Rec Pier Chop House** in Baltimore (Sagamore Pendry) are confirmed restaurant visits, exact dates unknown. Rec Pier belongs to the 2018–2021 Baltimore period. **Le Fou Frog** at 400 E. 5th Street in Kansas City is a high-confidence but unconfirmed identification lead for the remembered "frog" restaurant. Never count it as visited until the user directly confirms. 11 confirmed dining restaurants; two Michelin-starred venues. Dining with live jazz at The Majestic is not itself a separately documented concert.
