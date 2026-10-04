import Link from "next/link";
import { notFound } from "next/navigation";
import { areas } from "../../../lib/areas";
import { listings } from "../../../lib/data";
import { ListingCard } from "../../../components/ListingCard";

export default async function AreaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const area = areas.find((item) => item.slug === slug);
  if (!area) notFound();
  const matched = listings.filter((item) => item.area === area.name && item.status === "live");
  return (
    <main className="wrap section">
      <p className="kicker">{area.region}</p>
      <h1>{area.name}</h1>
      <p className="lede">{area.note}</p>
      <p><Link href={`/listings?q=${encodeURIComponent(area.name)}`}>Open on the map</Link></p>
      {matched.length === 0 ? <p>No live listing in this neighbourhood yet.</p> : (
        <div className="grid">{matched.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>
      )}
    </main>
  );
}
