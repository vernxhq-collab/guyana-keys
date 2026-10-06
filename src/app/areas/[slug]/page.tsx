import { notFound } from "next/navigation";
import { ListingCard } from "../../../components/ListingCard";
import { areas } from "../../../lib/areas";
import { listings } from "../../../lib/data";
export default async function AreaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const area = areas.find((item) => item.slug === slug);
  if (!area) notFound();
  const matched = listings.filter((item) => item.area === area.name);
  return (
    <main className="wrap section">
      <p className="meta">{area.region}</p>
      <h1>{area.name}</h1>
      <p>{area.note}</p>
      {matched.length === 0 ? <p>No live listing in {area.name} yet.</p> : <div className="grid">{matched.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>}
    </main>
  );
}
