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

**The Majestic Restaurant** in Kansas City and **Rec Pier Chop House** in Baltimore (Sagamore Pendry) are confirmed restaurant visits, exact dates unknown. Rec Pier belongs to the 2018–2021 Baltimore period. 11 confirmed dining restaurants; two Michelin-starred venues. Dining with live jazz at The Majestic is not itself a separately documented concert.

## Cocktail bars and explicit personal favorites (October 25, 2026)

The user elected to keep **Sauvage** (January 2021), **Gunther & Co.** (Valentine's Day 2020), and provisionally **The Majestic Restaurant** in the primary cultural collection despite no verified Michelin/James Beard distinction for those individual establishments. These are featured curator exceptions, labeled transparently as not award-qualified. **Death & Co Denver** is also an explicit personal cocktail-bar favorite. Its NYC predecessor's accolades are not transferred to this separate Denver location.

**Manifesto**, Kansas City, is a confirmed cocktail-bar experience and a verified **2018 James Beard Outstanding Bar Program semifinalist**, directly supported by https://www.jamesbeard.org/stories/the-2018-james-beard-award-semifinalists . Its exact visit date is unrecorded. Manifesto subsequently closed. Death & Co Denver opened May 2018 at The Ramble Hotel per https://denver.eater.com/2018/5/7/17327296/death-and-co-rino-denver-ramble-hotel . This adds the fifth site chapter, Cocktail Bars, with two confirmed bar visits and 11 confirmed restaurant visits.

The default collection shows either verified Michelin/James Beard-eligible records or expressly requested favorites. Other memories are preserved and can be revealed with the 'include other memories' filter. Candidate bars with James Beard recognition (Drastic Measures, Lady Jane, Yacht Club) enter the interview as unreviewed, not as visited.

## Selective curation

Historical interview candidates without verified qualifying Michelin or James Beard recognition are subject to exclusion from the public collection and the website interview at the user's direction. The award-selection rule never overrides explicitly retained favorites, which are labeled as personal exceptions rather than award-winning venues.

## Breckenridge Distillery & US city reconstruction windows (October 25, 2026)

The user explicitly confirmed **Breckenridge Distillery Restaurant in 2021, 2022 and 2023**. Each year is recorded as an independent, undated confirmed experience linked to one shared venue. Three visits are a minimum of one per year, not three exact meal dates. Its link with James Beard-honored chef David Burke is only an association, **not a qualifying award for the restaurant**, so this restaurant remains in the complete personal archive, not the default Michelin/JBF collection. Breckenridge Distillery is kept as 1 legacy restaurant with three visit years.

The user gave additional reconstruction windows: NYC (2018–2020, for the unidentified speakeasy), Chicago (2010–present), Kansas City (2010–present), and St. Louis/The Hill (2011–2014). The NYC speakeasy is **not assumed to be PDT**, even though PDT won a 2012 James Beard Outstanding Bar Program award. Other verified candidates include The Aviary (2013 award), The Violet Hour (2015 award), Kumiko (2025 award), Lost Lake (2018–2020 semifinalist), Dead Rabbit (2019 semifinalist), the Monarch Bar (2019 semifinalist), and Williams & Graham Denver (2020 semifinalist). Exact recognition years remain separate from possible visit years. Source examples:
- https://archive.jamesbeard.org/blog/outstanding-bar-program-pdt
- https://archive.jamesbeard.org/chicago
- https://archive.jamesbeard.org/index.php/blog/2015-james-beard-award-winners
- https://www.jamesbeard.org/stories/the-2019-james-beard-award-semifinalists
- https://www.jamesbeard.org/stories/the-2020-james-beard-award-semifinalists
- https://www.jamesbeard.org/stories/2017-americas-classic-gioias-deli

The user's recalled upscale Italian restaurant on St. Louis's Hill is **not yet identified**. Dominic's, Charlie Gitto's, and Gian-Tony's are research leads, and no visited status has been assumed.

## Screenshot-sourced reservation history (October 25, 2026)

Ten uploaded OpenTable screenshots contain **20 unique dated reservation or waitlist entries suitable for research**, after omitting Le Fou Frog from published data per the user's explicit request. A repeated venue with two distinct dates (Ritual Social House on September 26 and 30, 2021) is retained as two reservation events, not two venues. Blanco Cocina on May 5, 2022 is a completed **waitlist**, not proof of seated dining. The cropped Gunther & Co. reservation is already represented by a directly confirmed February 14, 2020 meal; no duplicate entry was introduced.

The photographs resolve the user's 2011–2014 mystery Italian restaurant as **Dominic's on the Hill** (completed reservation for two on December 28, 2012). It remains outside the award-focused public experience collection because no qualifying Michelin or James Beard distinction is yet verified. An excluded restaurant, Le Fou Frog, had a January 2016 reservation but is purposefully absent from the deployed JSON files.

The 2019 James Beard **Best New Restaurant semifinalist** Q House was reserved on October 21, 2021; it became Michelin Selected in 2023, after that visit. **Wildflower** had a March 21, 2022 reservation and later appeared in the Michelin Guide as Selected and won the 2025 Young Chef Award for Aiden Tibbetts, all after the meal. Both are shown as qualifying venues with explicit reservation-based evidence and historical award dates. **Uchi Denver** had a May 15, 2022 reservation, but founder Tyson Cole's 2011 James Beard honor belongs to the original **Austin** Uchi; keep that affiliation research-only rather than misattribute an award to Denver. The screenshot for **Mister Oso Wash Park** does not prove visiting the Michelin-listed **RiNo** branch; do not automatically attribute that Bib Gourmand to Wash Park.

Source links:
- https://www.jamesbeard.org/blog/the-2019-james-beard-award-semifinalists
- https://guide.michelin.com/us/en/colorado/denver_1261491/restaurant/wildflower
- https://guide.michelin.com/us/en/article/michelin-guide-ceremony/aiden-tibbetts-wildflower-young-chef-award-winner-michelin-star-guide-ceremony-colorado
- https://uchi.uchirestaurants.com/our-story/

## PDT possible visit and further cocktail-bar screening (October 25, 2026)

- **PDT (Please Don't Tell), New York City**: explicitly marked `maybe` by user for 2018–2020. No confirmed experience created. JBF officially lists PDT as the **2012 Outstanding Bar Program winner** (award year is not a visit year): https://archive.jamesbeard.org/blog/outstanding-bar-program-pdt .
- Nine further award-recognized candidate bars were researched using **primary James Beard semifinalist rosters**: Clover Club (NYC), Columbia Room (DC), Best Intentions, Bisous, Hopleaf Bar, Truce (Chicago), Fern Bar and Wild Child (Kansas City metro), Traveling Mercies (Aurora/Denver metro). These are **all unreviewed and excluded from confirmed totals**.
- **Award recipient integrity**: bartender-level semifinalist nominations for Best Intentions (Christopher Marty), Fern Bar (Diana Condori) and Wild Child (Jay Sanders) are attributed to the professional, not passed off as venue-level awards.
- **Temporal screening**: entries awarded in 2025 or 2026 may only have been available on later visits. Do not present those bars as 2018–2020 NYC destinations or infer their existence on a user's earlier trip.
- Official records: https://archive.jamesbeard.org/blog/the-2018-james-beard-award-semifinalists ; https://www.jamesbeard.org/stories/the-2025-james-beard-award-semifinalists ; https://www.jamesbeard.org/stories/james-beard-award-semifinalists-2026 .

## Dated reservation evidence and République (2026-10-25)

The user explicitly confirmed dining at République on **2026-10-24**, after Margarita Manzke's 2023 James Beard win. Preserve its 2026 Michelin Selected (not starred) category. Additional screenshots establish completed reservations for Woodberry Kitchen (May 16, 2018, two), Rec Pier Chop House (May 16, 2018, two), and Momofuku CCDC (August 21, 2018, four), each already a directly confirmed venue. These date changes are reservation-backed; a completed reservation does not independently establish physical attendance. The full source-derived reservations are collected in `culture/data/reservation-evidence.json` (40 entries / 38 distinct restaurants), with duplicate dates and the Blanco waitlist differentiated. **Le Fou Frog remains excluded by explicit user request.** Screening decisions are not automatic from completed reservations.

## Yuan Wonton and Bistro Barbès screening (October 25, 2026)

Yuan Wonton in Denver is a user-recalled confirmed visit (date unknown), and clearly qualifies for the curated collection through chef-owner Penelope Wong's **2026 James Beard Best Chef: Mountain** win. Source: https://www.jamesbeard.org/stories/james-beard-award-winners-2026. Do not assert the award predates the visit until a date is known. Bistro Barbès in Denver (closed June 2026, chef Jon Robbins) has no verified direct Michelin Guide or James Beard distinction. Preserve the user-supplied memory in `culture/data/excluded-dining-memories.json` rather than publishing it as a curated experience; this follows the user's preference for limiting displayed entries to qualified venues or explicitly selected favorites. Bistro Barbès is not currently a featured exception.

October 25 merge: preserved the separately merged North Pond (Chicago) unreviewed memory lead and the original 20 typed reservation entries, then appended 39 supplemental review-only screenshot rows; Le Fou Frog was excluded entirely from the public ledger in accordance with user preference.

## Story-first Mister Oso history (October 2026)

Mister Oso is a single user-confirmed restaurant story, not a branch-level award eligibility interview. In 2017, chef Blake Edmunds and Culinary Creative opened Señor Bear in Highland, followed by Mister Oso as its casual sibling in RiNo in November 2019. Mister Oso expanded to Wash Park in summer 2022; the original RiNo restaurant received Michelin Bib Gourmand recognition beginning in 2023. The user had a Wash Park reservation on file but did not ask for precision about which branch earned the award. Feature the family-and-expansion story with Michelin context and keep source/address details in a secondary archive section. Cite primary Michelin and Mister Oso sources and contemporary reporting:
- https://guide.michelin.com/us/en/colorado/denver_1261491/restaurant/mister-oso
- https://www.misterosodenver.com/about/
- https://www.westword.com/food-drink/mr-oso-wash-park-open-14893628/

Public Culture pages prioritize story over booking fields. Story copy migrated from an earlier editorial branch has been merged with newer records without reverting the Yuan Wonton, Safta, or Smok updates. 

## Faster Boulder and mountain-town dining interview (2026-10-25)

27 historically relevant Michelin Guide 2026 candidates have been added across Boulder, Aspen, Breckenridge, Vail/Beaver Creek, Telluride, and RiNo/Denver. Frasca Food and Wine is correctly assigned to Boulder. All new candidates are **unreviewed** until confirmed directly by the user and are not included in the visited collection. Main source: https://www.michelin.com/en/publications/products-and-services/michelin-guide-unveils-first-statewide-selection-for-colorado . Collect replies in batches rather than demanding exact dates or multiple follow-up questions per venue.

## NYC cocktail interview: Dante (October 25, 2026)

Dante in Greenwich Village is explicitly **not visited** during the user's 2018–2020 New York City period, despite the bar's recognized 2018 James Beard semifinalist status. This result remains an interview exclusion and never creates a confirmed culture experience. Preserve prior answers: **PDT** possibly visited; **The Dead Rabbit** and **Leyenda** not visited. The next unreviewed, award-recognized NYC cocktail-bar candidate is **Bar Goto**.

## Rapid-fire interview stability and Resy/Tock evidence (October 25, 2026)

The interview previously replaced its entire card list every time a visitor selected Yes/Maybe/No. That causes focus and scroll loss on mobile, making questions seem to disappear. Now clicks update only the three answer buttons in-place; the page stays put. Candidates are shown in twelve-place batches with manual Next/Previous navigation. Both responses and current area/screen/batch persist in browser localStorage, with explicit warning if browser storage fails, and a copy-to-ChatGPT workflow. Previously locked confirmations and exclusions remain immutable in this on-site draft.

Thirteen unique Tock/Resy historical reservations were extracted (duplicate screenshots deduplicated), including Sauvage January 2021 and Valentine's Day 2022, Charleston October 2020, Safta summer 2022, two Breckenridge Distillery bookings in January 2023, Manifesto drinks via The Rieger in October 2019, Q39 South, Willow Creek, the West Hollywood Butcher's Daughter and three Mountain House event bookings. These are archival supporting details, not independently proven meals. Nonqualifying or unconfirmed locations do not become public experience cards. Source screenshots remain in the user's ChatGPT conversation; the public repo stores only compact extracted metadata.
