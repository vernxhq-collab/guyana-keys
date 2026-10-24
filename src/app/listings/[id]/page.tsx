import Link from "next/link";
import { EnquiryPanel } from "../../../components/EnquiryPanel";
import { TitleRequest } from "../../../components/TitleRequest";
import { ListingCard } from "../../../components/ListingCard";
import { KeyFacts } from "../../../components/KeyFacts";
import { SiteDetails } from "../../../components/SiteDetails";
import { LocationSection } from "../../../components/LocationSection";
import { MortgageCalculator } from "../../../components/MortgageCalculator";
import { areaByName } from "../../../lib/areas";
import { loadCatalog, publicAgent } from "../../../lib/catalog";
import { money, usd } from "../../../lib/data";
import { withCanonical } from "../../../lib/seo";
import { readSession } from "../../../lib/session";
import { serviceDb } from "../../../lib/supabase";
import { peekNearby } from "../../../lib/places";
import { publicPartners } from "../../../lib/phase1-desk";
import { titleCopy, titleStatement } from "../../../lib/trust";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const catalog = await loadCatalog();
  const listing = catalog.listings.find((item) => item.id === id);
  const title = listing ? `${listing.title} | Guyana Keys` : "Listing | Guyana Keys";
  const description = listing ? `${listing.area}, ${listing.region}. A listing is not proof of title.` : "This home is not listed on Guyana Keys.";
  return withCanonical(`/listings/${id}`, { title, description });
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const catalog = await loadCatalog();
  const listing = catalog.listings.find((item) => item.id === id);
  if (!listing) return <main className="wrap section"><h1>Listing not found</h1><p>This home is not listed on Guyana Keys.</p><p><Link href="/listings">Back to search</Link> · <Link href="/advertise">List your property</Link></p></main>;
  const agent = await publicAgent(listing.agentId);
  const session = await readSession();
  const viewer = session?.profile?.role === "buyer" ? { name: session.profile.name, abroad: session.profile.abroad } : null;
  let saved = false;
  if (viewer && session) {
    const db = serviceDb();
    if (db) {
      const { data } = await db.from("saved_homes").select("property_id").eq("user_id", session.user.id).eq("property_id", listing.id).maybeSingle();
      saved = Boolean(data);
    }
  }
  const photos = listing.photos?.length ? listing.photos : [listing.image];
  const similar = catalog.listings.filter((item) => item.id !== listing.id && item.area === listing.area);
  const title = titleCopy(listing.titleStatus);
  const partners = await publicPartners();
  const lawyers = partners.filter((partner) => partner.category === "lawyer").map((partner) => ({ id: partner.id, name: partner.name }));
  const nearby = peekNearby(listing.lat, listing.lng);
  return (
    <main className="wrap section">
      <div className="gallery">{photos.map((src) => <img key={src} src={src} alt={listing.title} />)}</div>
      <div className="split">
        <div>
          <p className="chip">Listed on Guyana Keys</p>
          <p className="chip">{listing.purpose === "Sale" ? "For sale" : "To rent"}</p>
          {listing.featured ? <p className="chip">Featured</p> : null}
          <h1>{listing.title}</h1>
          {listing.priceGyd > 0 ? <p className="price">{money(listing.priceGyd, listing.purpose)}</p> : <p className="price">Price not listed</p>}
          <p className="meta">{listing.priceGyd > 0 ? `Guide USD ${usd(listing.priceGyd).toLocaleString()} · ` : ""}{listing.area}, {listing.region}</p>
          <KeyFacts listing={listing} />
          <SiteDetails listing={listing} />
          <p>{listing.description}</p>
          <section className="panel">
            <p className="chip">{title.label}</p>
            <h2>Title status</h2>
            <p>{titleStatement(Boolean(listing.titleCheckedByLawyer))}</p>
            {listing.titleCheckedByLawyer ? <p>Lawyer partner {listing.titleLawyerPartnerId || "not named"}{listing.titleCheckedOn ? ` · ${listing.titleCheckedOn}` : ""}</p> : null}
            <p>{title.plain}</p>
            {listing.titleRef ? <p>Title reference on file: {listing.titleRef}</p> : null}
            <TitleRequest propertyId={listing.id} lawyers={lawyers} />
            <p className="disclaimer">A listing is not proof of title. The button saves a Guyana Keys lead.</p>
          </section>
          <LocationSection area={listing.area} region={listing.region} lat={listing.lat} lng={listing.lng} report={nearby} approximate={listing.pinned === false} />
          {listing.purpose === "Sale" && listing.priceGyd > 0 ? (
            <section>
              <h2>Mortgage and purchase costs</h2>
              <p className="sub">Estimates for this asking price. Change the rate, or open the full <Link href="/tools">tools page</Link>.</p>
              <MortgageCalculator priceGyd={listing.priceGyd} />
            </section>
          ) : <p className="meta"><Link href="/tools">Open the mortgage calculator</Link> for a home you want to buy.</p>}
        </div>
        <EnquiryPanel listing={listing} agent={agent} viewer={viewer} initialSaved={saved} />
      </div>
      {similar.length > 0 && <section><h2>More in {listing.area}</h2><div className="grid">{similar.map((item) => <ListingCard key={item.id} listing={item} />)}</div></section>}
      <p className="meta">{areaByName(listing.area) ? <Link href={`/areas/${areaByName(listing.area)?.slug}`}>{listing.area}</Link> : listing.area} · <Link href="/listings">Back to search</Link></p>
    </main>
  );
}
