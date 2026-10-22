import Link from "next/link";
import { areas, regionSlug } from "../lib/areas";
import { SAMPLE_LABEL } from "../lib/sample-label";
import { MarketCard, type MarketCardData } from "./MarketCard";

const strips = ["Georgetown", "East Bank Demerara", "East Coast Demerara", "Berbice", "Essequibo", "West Coast Demerara"];

export function MarketHome({ cards, sample = false }: { cards: MarketCardData[]; sample?: boolean }) {
  const regions = strips.filter((name) => areas.some((area) => area.region === name));
  return (
    <main className="market">
      {sample ? <p className="market-banner">{SAMPLE_LABEL}. These cards are not on the public site and are not saved.</p> : null}
      <section className="market-hero">
        <div className="wrap">
          <p className="market-kicker">Guyana Keys</p>
          <h1>Find a home in Guyana.</h1>
          <p className="market-lead">Search by area, type, and budget. Prices are in GYD, with a USD guide. A listing is not proof of title.</p>
          <form className="market-search" action="/listings">
            <label>Area
              <input name="q" list="market-areas" placeholder="Neighbourhood, such as Bel Air Park" />
            </label>
            <datalist id="market-areas">{areas.map((area) => <option key={area.slug} value={area.name} />)}</datalist>
            <label>Buy, rent, or land
              <select name="purpose" defaultValue="Sale" aria-label="Buy, rent, or land">
                <option value="Sale">Buy</option>
                <option value="Rent">Rent</option>
                <option value="Land">Land</option>
              </select>
            </label>
            <label>Type
              <select name="type" defaultValue="" aria-label="Type">
                <option value="">Any</option>
                <option>House</option>
                <option>Apartment</option>
                <option>Land</option>
                <option>Commercial</option>
              </select>
            </label>
            <label>Budget
              <select name="budget" defaultValue="" aria-label="Budget">
                <option value="">Any budget</option>
                <option value="20000000">Up to 20 million GYD</option>
                <option value="50000000">Up to 50 million GYD</option>
                <option value="100000000">Up to 100 million GYD</option>
              </select>
            </label>
            <button className="btn" type="submit">Search</button>
          </form>
        </div>
      </section>
      <section className="wrap market-section">
        <h2>Areas</h2>
        <div className="market-strips">
          {regions.map((name) => <Link key={name} href={`/areas/region/${regionSlug(name)}`}>{name.replace(" Demerara", "")}</Link>)}
        </div>
      </section>
      <section className="wrap market-section">
        <div className="section-head">
          <h2>{cards.length ? "Listed now" : "No homes listed yet"}</h2>
          {cards.length ? <Link href="/listings">All listings</Link> : null}
        </div>
        {cards.length ? (
          <div className="market-grid">{cards.map((card) => <MarketCard key={card.id} card={card} />)}</div>
        ) : (
          <div className="market-empty">
            <p>Homes, rentals, and land will show here after an approved agent publishes them. Nothing on this page is a sample.</p>
            <div className="market-actions">
              <Link className="btn" href="/alerts">Create alert</Link>
              <Link className="btn ghost" href="/agents/apply">List your property free</Link>
            </div>
          </div>
        )}
      </section>
      <section className="wrap market-section market-split">
        <div className="market-panel">
          <h2>Buying from outside Guyana</h2>
          <p>Prices show GYD and a USD guide. A listing is not proof of title. Have an attorney search the registry before any deposit. A viewing from abroad is a request the agent confirms. This is not a valuation and not a promised return.</p>
          <Link className="btn ghost" href="/guides">Read the buying guide</Link>
        </div>
        <div className="market-panel accent">
          <h2>List your property free</h2>
          <p>The free plan is up to 3 live listings. Apply, then an admin reviews the account before anything is public.</p>
          <Link className="btn" href="/agents/apply">Apply to list</Link>
        </div>
      </section>
    </main>
  );
}
