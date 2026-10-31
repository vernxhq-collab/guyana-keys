import Image from "next/image";
import Link from "next/link";
import { areas, regionSlug } from "../lib/areas";
import { SAMPLE_LABEL } from "../lib/sample-label";
import { GuideCards } from "./GuideCards";
import { HomeSearch } from "./HomeSearch";
import { MarketCard, type MarketCardData } from "./MarketCard";

const regions = ["Georgetown", "East Coast Demerara", "East Bank Demerara", "West Coast Demerara", "Essequibo", "Berbice"];

const areaLines: Record<string, string> = {
  Georgetown: "City wards, the seawall and the capital's busiest streets.",
  "East Coast": "Villages and schemes from Ogle to Mahaica.",
  "East Bank": "Family neighbourhoods along the East Bank public road.",
  "West Coast": "From Vreed-en-Hoop westward along the coast.",
  Essequibo: "River towns and the Essequibo coast.",
  Berbice: "New Amsterdam and the Corentyne.",
};

export function MarketHome({ cards, sample = false, liveByRegion = {} }: { cards: MarketCardData[]; sample?: boolean; liveByRegion?: Record<string, number> }) {
  const shown = regions.filter((name) => areas.some((area) => area.region === name));
  return (
    <main className="market home">
      {sample ? <p className="market-banner">{SAMPLE_LABEL}. These cards are not on the public site and are not saved.</p> : null}
      <section className="home-hero">
        <figure className="home-hero-media" data-illustrative="true">
          <Image src="/brand/home-hero-living-room.jpg" alt="Bright living room with louvred windows and keys on the table, an illustrative image, not a listing." fill priority sizes="100vw" />
          <div className="home-hero-shade" aria-hidden="true" />
          <div className="home-hero-copy">
            <h1>Your next key is in Guyana.</h1>
          </div>
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
                <span className="area-copy">
                  <span className="area-name">{label}</span>
                  {areaLines[label] ? <span className="area-line">{areaLines[label]}</span> : null}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
      <section className="wrap home-section home-guides">
        <h2>Guides for buying and renting in Guyana</h2>
        <p className="home-note">Practical help for buying, renting and investing in Guyana, wherever you&apos;re starting from. A listing is not proof of title.</p>
        <GuideCards />
      </section>
      <section className="wrap home-section">
        <div className="home-list-band">
          <div>
            <p>Free to list, no limits.</p>
            <p className="home-list-sub">Show your home, rental, land or commercial space to people searching in Guyana and abroad.</p>
          </div>
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
