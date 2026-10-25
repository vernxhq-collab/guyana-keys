# Benchmark review

Internal only. Do not name these sites, link to them, or reuse their words, logos, icons, photographs, colours, or trade dress on any public page.

Reviewed 25 October 2026 from the live homepages.

- OnTheMarket: full-page captures at 1280 and 390, plus the rendered text.
- Zoopla: the public homepage document, a full-page capture at 390, and a desktop fetch. A desktop screenshot on the first pass was stopped by a bot check, so the desktop reading uses the fetched document and the mobile capture, not a guessed layout.

## Section order

OnTheMarket, top to bottom:

1. Thin header.
2. Hero: one headline, then the search (Buy, Rent, Instant valuation, Rent checker, Sold prices) over photography.
3. A short product line under the search.
4. Instant valuation promo.
5. Property alert promo.
6. Browse locations.
7. A competitive stock claim, then four feature promos (chooser, keywords, travel time, valuation again) and a commercial-partner tile.
8. A large directory footer.

Zoopla, from the desktop document and the mobile capture:

1. Thin header. On a phone this collapses to a menu, a valuation shortcut, an account shortcut, and sign in.
2. Hero: one headline and a search card (Buy, Rent, House prices, Instant valuation, one location field, one search button).
3. Location discovery (towns and cities, grouped, with a sale/rent switch) on the desktop document. On the captured phone the valuation band came before that discovery block.
4. Valuation band.
5. Three tool cards.
6. A text list of extra categories.
7. A second tools row (calculators, travel time, guides, news).
8. A news grid.
9. A business pitch.
10. Directory footer.

The useful order is: header, one search, one way to explore place, one editorial or tools block, one commercial pitch, then the footer. Both sites still repeat valuation. That repetition is not a pattern to copy.

## Header and navigation

Both headers are one bar. The logo is left. The primary intents are text links, not a second row. One account action and, on OnTheMarket, a separate “find an agent” entry. Extra destinations (blog, overseas, new homes, sold prices) live in menus or the footer, not as more buttons in the bar.

On a phone the link row disappears. A menu button opens it. The bar does not wrap into two lines.

Guyana Keys already follows this: Buy, Rent, Land, Commercial, Explore Guyana, Agents, More, Sign in, and one List a property button. About stays in More and the footer.

## Hero and search card

The hero has one job. A large headline, then a white search card that overlaps or sits on the photograph. The card has intent tabs, one location field, and one search button. There is no paragraph of advice in the card, and no second headline.

OnTheMarket’s card includes valuation and price tools we do not have. Zoopla’s card includes house prices and an instant valuation. The transferable part is the single card: tabs for the intents we actually search, one area field, one button, fully rounded, with its own shadow.

## How they avoid repetition, and where they fail

What works:

- The header names the intents. The search card is the tool for those intents. The page does not then paint the same four choices again as a set of big tiles.
- Location discovery is a different question (“where”) from the search card (“what and which area”).
- Editorial content is a different question again (“what should I know”).
- The seller or business pitch is one band, after the visitor has seen the product, not glued to the search.
- The footer is a directory. It repeats links. It does not repeat the hero headline.

What they still repeat, which we will not:

- Zoopla states valuation in the header, the search card, a band, a tool card, and the tools row.
- OnTheMarket states valuation in the search card and in two later promos, and states alerts as their own section.
- Zoopla’s “explore property categories” restates sale, rent, and commercial after the header and the search. We are not adding that back.

## Density and whitespace

Sections are separated by a clear vertical gap, larger than the gap inside a card. The search card is the densest object. Later cards hold one title and one sentence, not a paragraph. Location tiles are equal height. The page is long because each block has one idea, not because the same idea is stacked.

Our scale stays the one in the spec: 16px gutter under 768px, section gaps of 56px on small screens and 80px from 768px, card radius 16px, search radius 22px.

## Typography

The hero title is the largest type on the page. Section titles are a step down. Card titles are a smaller, heavier sans. Descriptions are body size in a quieter colour. Legal and credits are the smallest. We keep Playfair Display for the hero and section titles, and Manrope for everything else, in Forest, Gold, Ivory, and Charcoal.

## Cards

White surface, hairline border, modest radius, light shadow, the same height in a row, one text link as the action. Hover lifts slightly when motion is allowed. Icons are small and sit above the title. They are not illustrations of homes.

## Guides and tools

Zoopla presents tools as three equal cards, then a quieter row of links, then a news grid with dates. OnTheMarket puts guides in the footer and uses the homepage for product features.

We can honestly offer three short guides and the existing calculator, which stays an estimate the visitor types a rate into. We cannot offer a valuation, an affordability result, sold prices, travel-time search, a newsroom, or a count of listings.

## Footer

Several columns of plain links, a logo and a one-line description, then a legal line. No app badges were required for the pattern. Our footer stays three columns: brand and email, List, Company. The homepage hides the closing lines that would repeat “Free to list, no limits.” and the title sentence.

## Trust cues

Both sites lean on numbers, valuations, member claims, and press-style headlines. None of that is available to us without inventing it. The honest cue is one sentence on the homepage, with the longer deposit note on the scams guide.

## Mobile

At 390 the header is one row. The search card uses the page margins. Tabs can scroll inside the card rather than widening the page. Cards stack, or sit two-up when the tile is only a name. The list pitch stacks the button full width. There is no horizontal page scroll.

## Patterns adopted

- Search card stands alone, fully rounded, one field, one button. The list pitch is no longer attached to it.
- Order: header, hero and search, places, guides, one list band, listings only when they exist, footer.
- Place tiles stay one visual treatment. They are not also a second set of Buy / Rent / Land / Commercial cards.
- Guides are three equal cards: icon, title, one line, “Read guide”, each linking to a real page.
- One list sentence and one list button on the homepage, besides the header button. The footer keeps directory links and drops the repeated sentences on this page.
- Spacing and type follow one scale. Mobile stacks the guide cards and the list button.

## Patterns deliberately not adopted

- Instant valuation, house-price estimates, “track your home”, and equity tools. We do not have them, and we must not imply a valuation.
- Mortgage affordability that picks homes, bank names, and rate tables. The calculator remains an estimate from a rate the visitor types.
- Listing counts, visitor counts, “new this month”, and speed-of-sale claims.
- Testimonials, agent quotes, and app-store badges.
- A news or blog grid. There are no posts.
- Alerts as a homepage section. Alerts stay on `/alerts` and in the footer.
- Travel-time search, keyword ranking, and a “help me choose” wizard.
- A category grid that restates the header. Zoopla has one. It fights the “say it once” rule on our page.
- Lifestyle photography for places we do not have a licensed picture for. Empty regions stay a Forest tile with a Coming soon pill.
- Competitor names and “before the other portals” claims.
