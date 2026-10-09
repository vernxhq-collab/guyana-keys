import Link from "next/link";
import { EnquiryPanel } from "../../../components/EnquiryPanel";
import { ListingCard } from "../../../components/ListingCard";
import { MapView } from "../../../components/MapView";
import { loadCatalog, publicAgent } from "../../../lib/catalog";
import { money, usd } from "../../../lib/data";
import { readSession } from "../../../lib/session";
import { serviceDb } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const catalog = await loadCatalog();
  const listing = catalog.listings.find((item) => item.id === id);
  if (!listing) return <main className="wrap section"><h1>Listing not found</h1></main>;
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
  return (
    <main className="wrap section">
      <div className="gallery">{photos.map((src) => <img key={src} src={src} alt={listing.title} />)}</div>
      <div className="split">
        <div>
          <p className="chip">{listing.purpose === "Sale" ? "For sale" : "To rent"}</p>
          {listing.featured ? <p className="chip">Featured</p> : null}
          <h1>{listing.title}</h1>
          <p className="price">{money(listing.priceGyd, listing.purpose)}</p>
          <p className="meta">Guide USD {usd(listing.priceGyd).toLocaleString()} · {listing.area}, {listing.region}</p>
          <p className="facts"><span>{listing.beds || "-"} bed</span><span>{listing.baths || "-"} bath</span><span>{listing.sqft.toLocaleString()} sqft</span></p>
          <p>{listing.description}</p>
          <p className="meta">A listing is not proof of title. Ask for the transport or certificate of title before any deposit.</p>
          <MapView listings={[listing]} height={280} />
        </div>
        <EnquiryPanel listing={listing} agent={agent} viewer={viewer} initialSaved={saved} />
      </div>
      {similar.length > 0 && <section><h2>More in {listing.area}</h2><div className="grid">{similar.map((item) => <ListingCard key={item.id} listing={item} />)}</div></section>}
      <p className="meta"><Link href="/listings">Back to search</Link></p>
    </main>
  );
}
