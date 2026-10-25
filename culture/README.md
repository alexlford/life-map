# Culture Passport

A distinct cultural-experiences passport for Alex Ford: **Restaurants · Concerts · Opera · Theater**.

## Status

This folder is a functional static-site **preview**, temporarily deployed at `https://alexlford.github.io/life-map/culture/` while an independent `alexlford/culture-passport` GitHub repository and the proposed `culture.alexlford.com` subdomain are configured. The current GitHub connection cannot create new repositories, and this preview must not alter the Life Map Pages domain.

## Architecture

The website is self-contained under `culture/`. It uses `data/records.json` as its canonical preview experience and venue catalog and `data/interview.json` as its independent research queue. Both were seeded by a deliberate snapshot of the Life Map's existing dining history, with a one-way consistency validator. The site contains no runtime imports from the Life Map. Individual experiences have a stable ID, type, confirmation status, date precision, venue reference, user favorite status, and attribution for externally awarded distinctions. Map pins deliberately use city centroids until validated venue coordinates are available.

Confirmed dining experiences total **nine**. Two named dining favorites are Sauvage (Jan 2021) and Gunther & Co. (Feb 14 2020). Thames Street Oyster House is confirmed, exact date unknown. The Rec Pier Chop House name is only a possible identity for the user's recalled Pendry Hotel restaurant. Other restaurants in the interview are unverified candidates and do not increment the visit count. There are **no** fabricated concert, opera, or theater experiences.

## Local preview

```sh
python -m http.server 8000
```

Navigate to `http://localhost:8000/culture/` from the repository root. Run checks:

```sh
python culture/scripts/validate.py
node --check culture/assets/app.js
```

## Independent deployment

1. Provision `alexlford/culture-passport`, then copy the **contents** of `culture/` to its root.
2. Enable GitHub Pages from main (or a Pages Actions deployment) and verify the temporary github.io address.
3. Create a DNS CNAME for `culture.alexlford.com` pointing to `alexlford.github.io`, and configure the GitHub Pages custom domain on the **new** repository; verify HTTPS.
4. Update links from the Life Map's historical Culinary Passport, leaving a compatibility redirect or curated link behind.
5. Migrate ongoing historical interview additions to the new single source of truth so the two copies do not diverge.
