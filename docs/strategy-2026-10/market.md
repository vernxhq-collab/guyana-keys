# Market

Boss chose this direction on 22 Oct 2026. The earlier options on the strategy review (Quay, Corridor, and Desk) stay in that review. They are not the public look.

Market is a premium, modern, mobile-first property search. The reference is the search experience of Rightmove, Zoopla, and Zillow: a large search, listing cards, and area categories. It is not a copy of those sites, and it does not invent their inventory, prices, or claims.

## What the public home shows

- Search by area, type, budget, and buy, rent, or land. The form goes to `/listings`. `purpose=Land` means land, with no sale-or-rent filter. A budget is a ceiling in GYD. Existing buy and rent URLs stay valid.
- Cards show a photo when the listing has one, the price in GYD, a USD guide, beds and baths or land size, the area, and the agent's name when that profile exists. "Founding agent" appears only when the account has that flag. "New" means the listing was created in the last 14 days. "Reduced" means the saved price is lower than the previous price.
- Area names are categories: Georgetown, East Bank, East Coast, Berbice, Essequibo, West Coast. No counts and no prices on the strip.
- A block for people buying from outside Guyana: GYD and a USD guide, title is not proved by a listing, use an attorney, a viewing is a request. It is not a valuation and not a promised return.
- "List your property free" goes to the application form. Free to list, no limits. Optional extras, such as a boost or featured placement, do not change that.
- When the live catalog is empty, the page says no homes are listed yet. It does not fill the gap with samples.

The same card component is used for real database listings on `/`. Sample cards are imported only by `/preview/home`.

## Preview

`/preview/home` and `/preview/desk` return 404 unless `PREVIEW_DESK=1`. They are `noindex`, and `robots.txt` already disallows `/preview`. Sample cards are labeled "Sample preview — not a real listing". They are not written to the database and are not returned by `/`, `/listings`, or `/api/listings`.

This pull request does not set `PREVIEW_DESK` on Vercel. A hosted preview deployment will 404 those paths until that flag is set. Local screenshots use the flag on a local server only.
