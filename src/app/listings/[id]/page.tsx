import { listingById, money, usd, agentById } from "../../../lib/data";

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = listingById(id);
  if (!listing) return <main className="wrap"><h1>Listing not found</h1></main>;
  const agent = agentById(listing.agentId);
  const wa = `https://wa.me/${agent.phone}?text=${encodeURIComponent(`Hello ${agent.name}, I saw ${listing.title} on Guyana Keys.`)}`;
  return (
    <main className="wrap">
      <h1>{listing.title}</h1>
      <p>{money(listing.priceGyd, listing.purpose)} · about USD {usd(listing.priceGyd).toLocaleString()}</p>
      <p>{listing.area} · {listing.region} · {listing.purpose} · {listing.type}</p>
      <p>{listing.description}</p>
      <a href={wa}>WhatsApp {agent.name}</a>
    </main>
  );
}
