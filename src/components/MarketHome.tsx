import Link from "next/link";
import { areas, regionSlug } from "../lib/areas";
import { SAMPLE_LABEL } from "../lib/sample-label";
import { GuideCards } from "./GuideCards";
import { HomeSearch } from "./HomeSearch";
import { MarketCard, type MarketCardData } from "./MarketCard";

const regions = ["Georgetown", "East Coast Demerara", "East Bank Demerara", "West Coast Demerara", "Essequibo", "Berbice"];

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
          <HomeSearch areas={areas.map((area) => ({ slug: area.slug, name: area.name }))} />
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
      <section className="wrap home-section home-guides">
        <h2>Guides for buying and renting in Guyana</h2>
        <p className="home-note">A listing is not proof of title.</p>
        <GuideCards />
      </section>
      <section className="wrap home-section">
        <div className="home-list-band">
          <p>Free to list, no limits.</p>
          <Link className="btn" href="/advertise">List your property free</Link>
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
    </main>
  );
}
