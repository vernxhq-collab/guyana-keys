import Link from "next/link";
import { areas, regionSlug } from "../lib/areas";
import { SAMPLE_LABEL } from "../lib/sample-label";
import { HomeSearch } from "./HomeSearch";
import { MarketCard, type MarketCardData } from "./MarketCard";

const regions = ["Georgetown", "East Coast Demerara", "East Bank Demerara", "West Coast Demerara", "Essequibo", "Berbice"];

const categories = [
  { href: "/listings?purpose=Sale", title: "Buy", line: "Houses and apartments for sale." },
  { href: "/listings?purpose=Rent", title: "Rent", line: "Rentals across Guyana." },
  { href: "/listings?type=Land", title: "Land", line: "House lots and other land." },
  { href: "/listings?type=Commercial", title: "Commercial", line: "Offices, shops, and commercial property." },
];

function Credit({ author, file, licence, licenceHref }: { author: string; file: string; licence: string; licenceHref: string }) {
  return (
    <figcaption>
      Illustrative. Not a listing. Photo: <a href={file}>{author}</a>, <a href={licenceHref}>{licence}</a>.
    </figcaption>
  );
}

export function MarketHome({ cards, sample = false, liveByRegion = {} }: { cards: MarketCardData[]; sample?: boolean; liveByRegion?: Record<string, number> }) {
  const shown = regions.filter((name) => areas.some((area) => area.region === name));
  return (
    <main className="market home">
      {sample ? <p className="market-banner">{SAMPLE_LABEL}. These cards are not on the public site and are not saved.</p> : null}
      <section className="home-hero">
        <figure className="home-hero-media" data-illustrative="true">
          <img src="/brand/cathedral-georgetown.jpg" alt="St George's Cathedral in Georgetown, an illustrative photograph, not a listing." />
          <div className="home-hero-shade" aria-hidden="true" />
          <div className="home-hero-copy">
            <h1>Your next key is in Guyana.</h1>
          </div>
          <Credit
            author="Ian Mackenzie"
            file="https://commons.wikimedia.org/wiki/File:St._Georges_Cathedral_Georgetown,_Guyana.jpg"
            licence="CC BY 2.0"
            licenceHref="https://creativecommons.org/licenses/by/2.0/"
          />
        </figure>
        <div className="home-search-wrap">
          <div className="home-search-unit">
            <HomeSearch areas={areas.map((area) => ({ slug: area.slug, name: area.name }))} />
            <div className="home-list-band">
              <p>Free to list, no limits.</p>
              <Link className="btn" href="/advertise">List your property free</Link>
            </div>
          </div>
        </div>
      </section>
      <section className="wrap home-section">
        <h2>Explore Guyana by area</h2>
        <div className="area-grid">
          {shown.map((name) => {
            const label = name.replace(" Demerara", "");
            const comingSoon = (liveByRegion[name] || 0) === 0;
            return (
              <Link className="area-card graphic" key={name} href={`/areas/region/${regionSlug(name)}`}>
                {comingSoon ? <span className="area-soon">Coming soon</span> : null}
                <span className="area-mark" aria-hidden="true" />
                <span className="area-name">{label}</span>
              </Link>
            );
          })}
        </div>
      </section>
      <section className="wrap home-section">
        <h2>Property categories</h2>
        <div className="category-grid">
          {categories.map((item) => (
            <Link className="category-card" key={item.href} href={item.href}>
              <span className="area-mark" aria-hidden="true" />
              <strong>{item.title}</strong>
              <span>{item.line}</span>
            </Link>
          ))}
        </div>
      </section>
      {cards.length ? (
        <section className="wrap home-section">
          <div className="section-head">
            <h2>Listed now</h2>
            <Link href="/listings">All listings</Link>
          </div>
          <div className="market-grid">{cards.map((card) => <MarketCard key={card.id} card={card} />)}</div>
        </section>
      ) : null}
      <section className="wrap home-section home-trust">
        <h2>Buying with care</h2>
        <p>Prices show GYD and a USD guide. A listing is not proof of title. Have an attorney search the registry before any deposit. A viewing from abroad is a request the agent confirms. This is not a valuation and not a promised return.</p>
        <Link className="btn ghost" href="/guides">Read the buying guide</Link>
      </section>
    </main>
  );
}
