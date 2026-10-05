import { listingById, money, usd, agentById } from "../../../lib/data";

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = listingById(id);
  if (!listing) return <main className="wrap section"><h1>Listing not found</h1></main>;
  const agent = agentById(listing.agentId);
  const wa = `https://wa.me/${agent.phone}?text=${encodeURIComponent("Hello " + agent.name + ", I saw " + listing.title + " on Guyana Keys.")}`;
  return (
    <main className="wrap section">
      <img src={listing.image} alt={listing.title} style={{width:"100%", maxHeight:460, objectFit:"cover", borderRadius:16}} />
      <h1>{listing.title}</h1>
      <p className="price">{money(listing.priceGyd, listing.purpose)}</p>
      <p className="meta">About USD {usd(listing.priceGyd).toLocaleString()} · {listing.area} · {listing.region}</p>
      <p>{listing.beds ? listing.beds + " bed · " + listing.baths + " bath · " : ""}{listing.type} · {listing.purpose}</p>
      <p>{listing.description}</p>
      <a className="btn" href={wa}>WhatsApp {agent.name}</a>
    </main>
  );
}
