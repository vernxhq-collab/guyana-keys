# Guyana Keys redesign specification

Status: official spec for the 24 Oct 2026 owner brief. Priority 1 is the first build on this branch. Priorities 2 and 3 are specified here and are not built yet.

This document overrides informal notes. Standing rules in the section **Conflicts with the brief** override the brief wherever they disagree. Public pages must not name benchmark companies, must not publish a roadmap, and must not invent listings, prices, people, or statistics.

## 1. Product intent

Guyana Keys should feel like a finished property marketplace for a buyer of a modest rental and for someone considering a serious purchase, with the same listings and the same respect for both. The visual language is Forest, Ivory, and a spare use of Gold, set in Manrope with Playfair Display only on editorial headlines.

The site must look complete when the live catalogue is empty. Illustrative photographs are scenery and architecture. They are never presented as homes for sale or rent.

Preserve working routes, APIs, Supabase writes, and the held sentences listed in **Preserve**. Restyle around them.

## 2. Conflicts with the brief

| Brief item | Rule | How this spec handles it |
| --- | --- | --- |
| Zoopla and OnTheMarket named as the benchmark. The standing rule also bars Goodlord and any other company name. | Never name those companies, or any other company, in public copy. | Internal only. No public page, title, meta description, alt text, or empty state names them. |
| Section 9 names an AI concierge, agent command centre, tenancy-style tools, reminders, and dashboards. | Do not name future features in public. “Coming soon” stays non-specific: “more to come”. | Those names exist only in this spec’s P3 section. Public empty states say “More to come.” and describe what a visitor can do today. |
| WhatsApp contact and a visible business phone. | No approved company number. No phone and no WhatsApp number on public pages. | `showCompanyWhatsApp` in `src/lib/public-flags.ts` stays `false`. No `wa.me` company link is rendered. Enquiry fields may still ask the visitor for their own number, because that is an existing form write, not a company number. |
| Privacy and terms pages. | Do not invent legal text or claim a review that has not happened. | P2 adds the routes only after counsel. P1 footer does not pretend those pages exist. |
| Testimonials, stats, agent profiles, prices. | Do not invent them. | Zero listings and zero agents render a prelaunch state. Real rows from the catalogue render as they do today. |
| Imagery of foreign property. | Only genuine Guyana scenery or architecture under a free commercial-use licence, or a Forest/Ivory graphic. | New photographs are listed in `docs/redesign/IMAGE-CREDITS.md`. Each is marked illustrative. Category cards in P1 are graphic treatments, not houses. Existing Unsplash files on `/advertise` are deferred to P2 and are not reused on new sections. |
| Title-verification sentence in the hero. | Keep the wording and move it off the homepage hero into buyer-protection, disclosure, or deposit guidance. | The sentence `A listing is not proof of title.` is off the hero. On the homepage it appears once, as its own line under the guides heading. The longer deposit paragraph, which contains that sentence, lives on `/guides/spotting-scams`. The footer line is hidden on the homepage so it is not repeated there, and it still shows on other pages. |
| About in the top navigation. | About stays out of the top-level header. It lives in the More menu and the footer. | Header has no About link. More and the footer link to `/about`. |
| About story. | Reuse the About story from branch `cursor/about-story-6636` word for word. | `/about` uses that copy, including the title and meta description. Presentation may use the new tokens. |
| Bank rate lists. | No bank names and no bank rate list. The calculator keeps a rate the visitor types. | `/tools` and `MortgageCalculator` are unchanged in P1. |
| Paid listing tiers. | “Free to list, no limits” stays. No paid tiers on public pages. | Public list CTAs keep that sentence. Plan and feature tools stay inside the signed-in desk. |
| Held sentences. | Do not edit Messenger-in-copy wording (none is present in `src` today), the `/advertise/listing` payment sentence, or the agent ID promise including `Do not send an ID image` on `/agents/apply`. | Those files are not edited for copy. They may inherit global tokens. |

## 3. Design tokens

Tokens live on `:root` in `src/app/globals.css` and are the only colour system public pages use.

### Colour

| Token | Value | Use |
| --- | --- | --- |
| `--forest` / `--green` | `#103C32` | Primary buttons, header wordmark accent, footer ground |
| `--deep` | `#0C2E26` | Pressed primary, dark bands |
| `--gold` | `#C6A46A` | Tagline, small rules, focus rings. Never large fills. |
| `--ivory` | `#F6F3EB` | Page background |
| `--white` | `#FFFFFF` | Cards, header bar, form controls |
| `--charcoal` / `--ink` | `#202A28` | Text |
| `--muted` | `#5C6762` | Secondary text. At least 4.5:1 on ivory and white. |
| `--line` | `#E4DFD4` | Hairline borders |
| `--danger` | `#8A3A2A` | Form errors only |

White text on `--forest` is the primary button. Charcoal text on ivory is body copy. Gold is not used as text on white below 14px.

### Type

Loaded with `next/font/google` only: Manrope (UI) and Playfair Display (editorial). Both `display: "swap"` and `subsets: ["latin"]`. CSS variables: `--font-ui`, `--font-display`.

| Role | Family | Size | Line height | Weight |
| --- | --- | --- | --- | --- |
| Body | Manrope | 16px | 1.6 | 400 |
| Small / meta | Manrope | 14px | 1.45 | 500 |
| Eyebrow | Manrope | 12px | 1.3 | 650, tracking 0.14em, uppercase |
| Nav link | Manrope | 15px | 1 | 600 |
| Button | Manrope | 15px | 1 | 650 |
| Section title | Playfair Display | clamp(28px, 4vw, 40px) | 1.2 | 560 |
| Hero title | Playfair Display | clamp(36px, 5vw, 64px) | 1.08 | 560 |
| Wordmark | Playfair Display | 26px desktop, 20px below 768px | 1 | 600 |

Do not set Playfair on form controls, tables, or desk pipelines. Desk page titles may use Playfair because they are `h1` elements.

### Spacing

4px base. Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96. Page gutter is 16px below 768px and 24px from 768px. Content column is `min(1120px, 100% - 32px)` for marketing sections. Existing `.wrap` stays `min(1200px, 100% - 32px)` so desk pages do not reflow.

Stack rhythm inside a section: eyebrow, title, body, then 24px before actions. Sections separate by 48px on small screens and 72px from 768px.

### Radii, shadow, motion

| Token | Value |
| --- | --- |
| `--radius-s` | 8px, inputs and ghost buttons that are not pills |
| `--radius` | 16px, cards |
| `--radius-pill` | 999px, primary buttons and filter chips |
| `--shadow` | `0 12px 32px rgba(16, 42, 40, 0.08)` |
| `--shadow-strong` | `0 18px 50px rgba(16, 42, 40, 0.16)`, search panel and drawer |

Motion, only when `prefers-reduced-motion: no-preference`: colour and shadow 180ms ease, card hover translateY(-2px). No infinite animation. Drawers and sheets ease transform 200ms. Focus visible is a 2px `--gold` outline with 2px offset, not colour alone.

### Tap targets and type floor

Interactive controls are at least 44px tall. Body text does not go below 16px. Meta may be 14px. Nothing interactive is under 12px.

## 4. Breakpoints

Design and QA widths: 360, 390, 768, 1280. No horizontal scroll at any of them.

| Range | Behaviour |
| --- | --- |
| 360–767 | Single column. Header shows wordmark, List a property, and the menu button. Nav links live in the drawer. Search fields stack. Filter UI is a bottom sheet. |
| 768–1079 | Still the drawer, because six links plus the list button do not fit. Grids become two columns. |
| 1080 and up, checked at 1280 | Full header on one centre line. Grids of three. Hero is a two-column image and copy band. |

`overflow-x: clip` on `body`. Images use `max-width: 100%` and a fixed aspect ratio so they cannot widen the page.

## 5. Component rules

### Wordmark and favicon

Text wordmark only. No key pictogram in the header. “Guyana” in charcoal (ivory when on forest) and “Keys” in forest or gold on forest. Under it, the tagline `PROPERTY & INVESTMENT` in 10px Manrope, uppercase, gold, tracking 0.16em. The favicon is a 32px forest square with the letters GK in ivory, from `src/app/icon.tsx`. The old `favicon.ico` is removed so the new icon is the one browsers request.

### Header

Sticky, white, 1px `--line` bottom border, z-index 30. One flex row, `align-items: center`. No `margin-top` on Sign in. No baseline alignment.

Desktop, from 1080px, left to right:

1. Wordmark linking to `/`.
2. Buy → `/listings?purpose=Sale`
3. Rent → `/listings?purpose=Rent`
4. Land → `/listings?type=Land`
5. Commercial → `/listings?type=Commercial`
6. Explore Guyana → `/areas`
7. Agents → `/agents`
8. More, a button, not a navigation destination.
9. Spacer.
10. Sign in → `/account`, or the desk link and Log out when the session endpoint says the visitor is signed in.
11. List a property → `/advertise`, forest pill, the only filled button in the bar.

Sign in uses `inline-flex`, `align-items: center`, `line-height: 1`, and the same vertical padding as the pill (`padding-block: 14px`). `.nav-actions` is `display: flex; align-items: center`. This is the PR #26 fix, kept as the header is replaced.

More opens a white panel, shadow `--shadow-strong`, items: Tools `/tools`, Buying guides `/guides`, About `/about`, Partner with us `/partners`. Escape, outside click, and route change close it. The button exposes `aria-expanded` and `aria-controls`.

Signed-in Log out POSTs `{ action: "logout" }` to `/api/auth` and then goes to `/`. The desk link stays `/account`, `/agent`, or `/admin` from the same role check as today.

On desk routes (`body:has(.desk)`) the link row, More, the menu button, the actions, and the public footer stay hidden. The wordmark remains. Desk logout stays in the desk nav.

### Mobile drawer

Below 1080px the link row and More are not in the bar. A 44px menu button opens a full-height panel under the header. Background ivory. Links are block-level, 48px minimum, 16px type. Order: the six primary links, then the four More links, then Sign in or the desk actions, then a full-width List a property button. Focus moves to the close button. Escape and route change close the drawer and clear the body scroll lock. There is no second, wrapping nav row.

### Search panel (homepage)

White card, radius 16px, shadow `--shadow-strong`, sitting on ivory directly under the hero. Four tabs: Buy, Rent, Land, Commercial. They set hidden GET fields, they do not invent a new query language.

| Tab | Submitted fields |
| --- | --- |
| Buy | `purpose=Sale` |
| Rent | `purpose=Rent` |
| Land | `type=Land` |
| Commercial | `type=Commercial` |

The homepage card submits `q` (area text, with the existing area datalist) plus the tab’s `purpose` or `type`. Budget stays on the listings filters, not on this card. Action is `/listings`. The search button sits inside the rounded field.

### Cards

White, 1px `--line`, radius 16px, shadow `--shadow`. Image ratio 3:2 where a photograph is used. Hover lifts 2px when motion is allowed. Real listing cards stay on `MarketCard` and only render catalogue rows. The homepage photograph carries `data-illustrative="true"`. Its alt text says it is illustrative and not a listing. The licence credit is on `/credits`.

Graphic cards (no photograph) use a forest or ivory ground, a 2px gold rule, and a label. They do not use stock houses.

### Buttons

Primary: forest fill, ivory text, pill, padding 14px 22px, `inline-flex`, centred. Ghost: white fill, charcoal text, 1px `#CFD6D2`, radius 8px, same vertical centring. Disabled controls drop to 40% opacity and do not submit.

### Forms

Labels are visible, not placeholder-only, on new marketing forms. Inputs are 16px, radius 12px, 1px border, 48px min height. Errors sit under the field in `--danger` and are not colour-only. The honeypot field `website` stays on alert forms and stays off-screen. Submit posts the same JSON as today.

### Empty and prelaunch states

Used when the catalogue query returns no listings (Buy, Rent, Land, Commercial, and the unfiltered search) or no public agents. Not used when the catalogue has rows and the current filters match none. That case keeps “No home matches. Try a neighbourhood, or clear a filter.”

The prelaunch block contains:

- A welcoming heading that does not say the search failed and does not say “No homes listed yet”, “No land listed yet”, “No rentals listed yet”, or “No agents listed yet”.
- One line on what happens next: owners and agents list, then a person reviews before anything is public.
- The sentence “More to come.” with no feature names.
- Actions: List a property (`/advertise`), Become a founding agent (`/agents/apply`), Explore Guyana (`/areas`), Buying guide (`/guides`).
- The existing alert form (email, area, honeypot) posting to `POST /api/alerts`.
- “Free to list, no limits” on the agent state and wherever a list offer is made.

### Footer

Forest ground, ivory text. Three groups: wordmark and `info@gykeys.com`; List (list a property, apply, agents, alerts); Company (tools, buying guide, about, partner, contact). Buy, rent, land, commercial, and neighbourhoods stay in the header, so the footer has no Search column. No phone. No WhatsApp. No social network other than the contact page’s existing Facebook link, which stays on `/contact` rather than being repeated as a new icon row. On pages other than the homepage, the closing line includes `Free to list, no limits.` and `A listing is not proof of title.` The homepage hides that closing line because both sentences already appear once in the page.

### Bottom-sheet filters

On Buy, Rent, Land, and the rest of `/listings`, below 768px the existing `SearchPanel` is hidden until a Filters button opens a sheet fixed to the bottom of the viewport, max-height 85vh, scroll inside the sheet, radius 18px on the top corners, a Close control, and a dimmed backdrop. From 768px the same form is inline, as it is today. Field names do not change.

### WhatsApp flag

`showCompanyWhatsApp` is `false`. Any future public “message the company” control must read that flag and must not render while it is false. Agent-desk “open WhatsApp” for a lead the agent already has is not a company number and stays as it is.

### Ask Keys flag

`showAskKeys` is `false`. The floating chat control stays unrendered while that flag is false, because its label is a later product name. `/api/chat` remains.

## 6. Page layouts

Measurements below are the content inside the gutter. “Desktop” means 1280. “Mobile” means 390, and the same stack must hold at 360.

### Homepage `/`

Order is fixed.

1. **Header.** As specified above. Not repeated in the page body.
2. **Hero and search.** Full-width photograph of St George's Cathedral in Georgetown, object-fit cover, weighted toward the wooden facade and the blue sky, with a soft curved bottom edge and a dark overlay. The headline “Your next key is in Guyana.” is centred in white over the photograph. There is no subline and no caption on the photograph. Credit for the photograph is on `/credits`. A white card overlaps the bottom, centred, radius 22px on every corner, with a soft shadow. Tabs are Buy, Rent, Land, and Commercial, and the active tab is underlined in Gold. One rounded area field submits to `/listings`, with the search button inside the field. The card does not carry a second message. At 390 the card uses the page margins and the tabs scroll horizontally inside the card. No title-verification sentence in this block.
3. **Explore Guyana by area.** Title, then a grid of six regions that already exist: Georgetown, East Coast Demerara, East Bank Demerara, West Coast Demerara, Essequibo, Berbice. Each card links to `/areas/region/{slug}`, uses the same Forest gradient, and shows the area name at the bottom left. A Gold “Coming soon” pill sits at the top left of a tile only while that region has no live listing, and it is omitted once a live listing exists. Two columns at 390, three from 768px.
4. **Guides.** Heading “Guides for buying and renting in Guyana”, then the sentence `A listing is not proof of title.` once, then three cards: Buying from abroad (`/guides/buying-from-abroad`), Spotting property scams (`/guides/spotting-scams`), and Renting in Guyana (`/guides/renting`). Each card has a simple stroke icon, a title, one line, and the words “Read guide”. The index is `/guides`. There is no blog and no category grid, because Buy, Rent, Land, and Commercial already sit in the header and the search card.
5. **Free to list.** One forest band, separate from the search card, with radius 16px. It says “Free to list, no limits.” and links “List your property free” to `/advertise`. This is the only list pitch on the homepage besides the header button. The footer still links to `/advertise` as a directory item and does not repeat the sentence, because the homepage hides `.footer-base`.
6. **Listed now, then footer.** If `loadCatalog` returns listings, a “Listed now” grid of `MarketCard`s follows the band. It is omitted entirely when the list is empty. It is not an empty-state message. Footer follows. The homepage does not repeat the deposit paragraph or “More to come.” There is no founding-agent block on this page. `/agents/apply` is unchanged. The full deposit paragraph lives on `/guides/spotting-scams`.

The sample-preview banner still renders when `sample` is true, above the hero, and sample cards keep their existing sample label.

### Buy, Rent, Land, and Commercial `/listings`

These are one route. The query string selects the reading.

Desktop, top to bottom: header, `h1` for the mode (“Property for sale in Guyana”, “Property to rent in Guyana”, “Land in Guyana”, “Commercial property in Guyana”, or “Search property in Guyana”), inline `SearchPanel`, save-search control, then either the prelaunch state or the count line, the card grid, and `MapView`.

Mobile: same, with `SearchPanel` inside the bottom sheet. The count line, cards, map, and save-search behaviour are unchanged when rows exist. Map remains on the page in P1 so the current map is not removed; a labelled grid/map toggle is P2.

Acceptance for the empty catalogue is the prelaunch component, including a successful or paused alert write. Acceptance for a non-empty catalogue with no filter match is the existing “No home matches” line.

### Find an agent `/agents`

Desktop and mobile: header, `h1` “Agents”, the line “Apply to list a property. Free to list, no limits.”, then either profile cards or the agent prelaunch state.

Cards, when rows exist, stay links to `/agents/{id}` and keep name, founding badge, check badge, company, and areas. Do not draw a portrait that is not the agent’s own photo.

Empty state: “Profiles are published after a person reviews the application.”, “Become a founding agent”, the list and alerts actions, and “More to come.” No invented agent, no headshot, no quotation.

### List your property `/advertise`

P1 does not rebuild this page. P2 layout, desktop: hero with the existing segmentation (agent, landlord, developer, advertise a listing) as four equal cards, then a short process (apply, review, publish) and the sentence “Free to list, no limits.” Mobile: one column, cards at 16:10, full-width buttons. Replace the current Unsplash files with licensed Guyana photographs or graphic treatments, credited in `IMAGE-CREDITS.md`. Do not change the four destinations: `/agent/login`, `/landlords`, `/developers`, `/advertise/listing`.

### Agent registration `/agents/apply`

P1 does not edit the copy. P2 restyles spacing only. The page keeps a single column, max width 640px, on desktop and mobile. Order stays: the ID promise including `Do not send an ID image`, then the form, then field-level validation, then a confirmation that names the saved application, then a link to the status the account will see after sign-in. Progress is “Application” then “Review” then “Able to publish”, as text, not a percentage. The POST body to `/api/agent-applications` does not change.

### Property details `/listings/[id]`

P1 leaves the page. P2 layout, desktop: gallery (16:9, with a count) on the left at 12 columns’ worth of a 2/3 column, and a sticky enquiry column on the right. Under the gallery: price in GYD, USD guide, facts, the existing title statement verbatim, map, and features that are actually stored. Mobile: gallery, price, facts, enquiry form, then map. Floor plans and video render only when the listing has those files. No control may imply a tour, a floor plan, or a WhatsApp thread that does not exist. Enquiry POST stays on `/api/enquiries` and `/api/buyer`.

### Neighbourhoods `/areas`, `/areas/[slug]`, `/areas/region/[slug]`

P1 links to these routes and does not rewrite them. P2: index is a directory grouped by region, each region a card. A neighbourhood page is: name, region, the existing note, illustrative photograph only when one is credited, then live listings for that area or the prelaunch state, then the existing pros and cons. No average price other than the current “Not enough sales on Guyana Keys yet.” Mobile is one column. Desktop directory is three columns.

### Mortgage tools `/tools`

P1 does not change the calculator. P2 visual refresh only: the typed rate stays the only rate, results stay prominent, assumptions stay the ones already printed. No bank name, no preset lender list.

### Investor pathways

There is no `/investors` route in P1. The homepage section is the public surface. P2 may add `/investors` as a directory to land, commercial, the buying guide, and contact. It must not state a yield, a growth rate, or a tax outcome. It must not mention another country as a sister brand.

### About `/about` and Contact `/contact`

About uses the story from `cursor/about-story-6636` with the same headings, paragraphs, list, and two CTAs (Browse listings → `/listings`, List your property free → `/advertise`). Desktop measure is 680px centred. The promise panel is ivory on a white page with a forest left border. The “We’re not done here.” band is forest with ivory type and does not name a feature. Mobile is the same stack with 16px gutter.

Contact stays email `info@gykeys.com` and the existing Facebook link. P2 may add a clearer support line and the enquiry-response expectation (“we read what you send”) without a phone number. No new fields in P1.

### Advertise segmentation

Covered under List your property. `/landlords` and `/developers` keep their forms and their POST to `/api/enquiries`. P2 aligns them to the form rules without changing field names.

## 7. Functional acceptance criteria

### Global

- At 360, 390, 768, and 1280 the public header and homepage have no horizontal scroll, no overlapping text, and no type under 14px.
- Sign in and List a property share one vertical centre on the desktop header.
- About is absent from the top-level link row and present in More and the footer.
- `info@gykeys.com` is the only email shown. No grokbot address, no phone, no company WhatsApp.
- `showCompanyWhatsApp` is false and no public company WhatsApp control is visible.
- Keyboard users can open and close More, the drawer, and the filter sheet, and can see a focus ring.
- `next build` passes. Existing API routes respond as before.

### Homepage

- Sections appear in the order in section 6, including the footer.
- With an empty catalogue the page does not say “No homes listed yet” and does not show a fake card.
- Search submits to `/listings` with the field mapping in this spec.
- The hero does not contain “A listing is not proof of title.” The guides section does, once, as its own line. The longer deposit paragraph is on `/guides/spotting-scams`.
- “Free to list, no limits” is present.
- Every photograph has a credit on `/credits` that matches `IMAGE-CREDITS.md`. The homepage hero alt text says the photograph is illustrative and not a listing.

### Buy, Rent, Land, Agents

- Empty catalogue shows the prelaunch state for that mode, with a working alert form.
- A catalogue that has rows still shows those rows, the map on listings, and agent links.
- A filter that matches nothing, when other listings exist, still shows the no-match line.
- No invented price, agent, or testimonial.

### Held behaviour

- `/agents/apply` still contains `Do not send an ID image`.
- `/advertise/listing` still contains `Payment is arranged with Guyana Keys before anything is featured or advertised.`
- `/list` still redirects to `/advertise`. `/a/[id]` still redirects to `/agents/[id]`. `/pro` still redirects to `/agent/login`.

## 8. Phasing

### P1 Visual (this branch)

Tokens, Manrope, Playfair Display, wordmark, tagline, favicon, header, More menu, Sign in alignment, mobile drawer, homepage in the order in section 6, mobile layout of those sections, prelaunch states on Buy, Rent, Land, Commercial, and Agents, bottom-sheet filters around the existing search form, About story restored word for word, footer, image credits, WhatsApp flag left off.

### P2 Journeys

Restyle search results, listing detail, neighbourhood pages, `/advertise` and its segments, `/agents/apply` spacing, `/tools` presentation, `/contact`, and an investor directory that does not invent returns. Add a real grid/map toggle that shows the map already on the page. Alert and enquiry flows stay on their current endpoints. Privacy and terms routes wait for counsel. Replace `/advertise` Unsplash images. Bottom sheets gain the same fields, not new ones.

### P3 Intelligence

Not public. Campaign URLs and attribution that already exist in `src/lib/attribution.ts` can be surfaced in the admin desk. CRM, moderation, and monitoring stay server-side. No public page names an assistant, a dashboard, a reminder product, or a check product. Public copy for anything not shipped remains “More to come.”

Architecture that must keep working so later phases do not need a rewrite: listing search query keys, catalogue loaders, alert and enquiry writes, agent application writes, auth session, and the area slugs.

## 9. Preserve

P1 does not add or alter Supabase SQL, environment variables, or production data. Tables are read and written exactly as they are today.

### Routes that must keep resolving

Public: `/`, `/listings`, `/listings/[id]`, `/areas`, `/areas/[slug]`, `/areas/region/[slug]`, `/agents`, `/agents/[id]`, `/agents/apply`, `/about`, `/contact`, `/tools`, `/guides`, `/alerts`, `/advertise`, `/advertise/listing`, `/landlords`, `/developers`, `/partners`, `/account`, `/list` (redirect to `/advertise`), `/a/[id]` (redirect to `/agents/[id]`), `/pro` (redirect to `/agent/login`).

Signed-in agent: `/agent/login`, `/agent`, `/agent/listings`, `/agent/listings/[id]`, `/agent/leads`, `/agent/leads/[id]`, `/agent/calendar`, `/agent/checks`, `/agent/compose`, `/agent/outbox`, `/agent/profile`, `/agent/agency`, `/agent/performance`, `/agent/plan`, `/agent/help`.

Admin: `/admin/login`, `/admin`, `/admin/applications`, `/admin/listings`, `/admin/people`, `/admin/people/[id]`, `/admin/inbox`, `/admin/inbox/[id]`, `/admin/requests`, `/admin/requests/[id]`, `/admin/licences`, `/admin/keys-check`.

Preview, still gated: `/preview`, `/preview/home`, `/preview/desk`, `/preview/partners`, `/preview/keys-check`.

Buyer: `/dashboard` and `/account` stay.

### API routes and the writes they own

| Route | Keep |
| --- | --- |
| `/api/auth` | GET session. POST `start`, `logout`, `session`. |
| `/api/listings` | GET catalogue search. |
| `/api/alerts` | POST email, area, honeypot `website`. |
| `/api/enquiries` | POST name and phone, from listing enquiry, landlord, developer, and feature forms. |
| `/api/agent-applications` | POST the apply form. |
| `/api/agent` | GET `part` desk reads. POST actions including `saveListing`, `duplicate`, `hide`, `delete`, `profile`, `lead`, `request`, `saveLicence`, `requestDeletion`, `describe`, `saveDescription`, `replyDraft`, `hold`, `issueCode`, `submitKeysCheck`. |
| `/api/agent/photos` | POST listing and profile photos. |
| `/api/agent/identity` | POST identity file, still not from a public ID-image prompt. |
| `/api/buyer` | GET account. POST `save`, `unsave`, `view`, `enquiry`, `viewing`, `search`, `migrate`. |
| `/api/admin` | Existing `part` reads and POST review actions (`reviewApplication`, `publish`, `hide`, `feature`, `approve`, `suspend`, licence and identity reviews, deletion purge). |
| `/api/chat` | POST the on-site assistant. |
| `/api/assist` | POST draft helpers. |
| `/api/draft` | POST draft storage. |
| `/api/places` | GET place lookup. |
| `/api/preview` | GET and POST preview session, still not the live database. |

### Supabase tables and storage

Do not add columns and do not run migrations in this workstream. These tables stay the system of record:

`profiles`, `properties`, `saved_homes`, `recently_viewed`, `saved_searches`, `enquiries`, `enquiry_events`, `requests`, `review_requests`, `admin_events`, `alerts`, `notices`, `agencies`, `audit_events`, `listing_stats`, `buyer_needs`, `outbox`, `agent_applications`, `message_drafts`, `lead_activity`, `follow_up_tasks`, `event_outbox`, `agent_licences`, `agent_identity_checks`, `id_documents`, `id_deletion_requests`, `partners`, `mortgage_rates`, `keys_checks`, `keys_check_flags`.

`mortgage_rates` stays in the database and stays off public pages. Storage bucket `identity-documents` is unchanged. Auth cookies `gk_session` and `gk_refresh`, and the middleware matcher for `/agent`, `/account`, `/admin`, and their APIs, stay as they are.

### Form writes that must survive the restyle

- Alert forms (`/alerts` and the listings and agents prelaunch states) → `POST /api/alerts`.
- Apply form → `POST /api/agent-applications`, with the ID-image warning still on the page.
- Listing, landlord, developer, and feature enquiries → `POST /api/enquiries`.
- Magic link → `POST /api/auth` `start`.
- Listing editor, profile, leads, licences, and checks → the `/api/agent` actions above.
- Buyer saves and enquiries → `/api/buyer`.
- Admin review controls → `/api/admin`.

### Copy that must stay byte-for-byte

- `Do not send an ID image` on `/agents/apply`.
- `Payment is arranged with Guyana Keys before anything is featured or advertised.` on `/advertise/listing`.
- `A listing is not proof of title.` wherever it is a disclosure. It leaves the homepage hero. On the homepage it remains once, under the guides heading. The footer keeps the sentence on other pages. `/guides/spotting-scams` keeps the full deposit paragraph, which includes the sentence. Listing pages keep their own copies.
- `Free to list, no limits` on the homepage, the apply page, and the list offer.
- The About page story from `cursor/about-story-6636`, including headings and both CTAs.
