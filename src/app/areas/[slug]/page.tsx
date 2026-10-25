import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingCard } from "../../../components/ListingCard";
import { areaDetail, areas, regionSlug } from "../../../lib/areas";
import { loadCatalog } from "../../../lib/catalog";
import { withCanonical } from "../../../lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const area = areas.find((item) => item.slug === slug);
  if (!area) return withCanonical(`/areas/${slug}`, { title: "Neighbourhood | Guyana Keys", description: "That neighbourhood is not listed on Guyana Keys." });
  return withCanonical(`/areas/${area.slug}`, {
    title: `${area.name} property | Guyana Keys`,
    description: `${area.note} Homes for sale and rent in ${area.name}, ${area.region}.`,
  });
}

export default async function AreaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = areas.find((item) => item.slug === slug);
  if (!found) notFound();
  const area = areaDetail(found);
  const { listings } = await loadCatalog();
  const matched = listings.filter((item) => item.area === area.name);
  return (
    <main className="wrap section">
      <p className="chip">Listed on Guyana Keys</p>
      <p className="meta"><Link href={`/areas/region/${regionSlug(area.region)}`}>{area.region}</Link></p>
      <h1>{area.name}</h1>
      <p>{area.note}</p>
      <div className="split">
        <section className="panel">
          <h2>Worth knowing</h2>
          <ul className="pros">{area.pros.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
        <section className="panel">
          <h2>Watch for</h2>
          <ul className="pros">{area.cons.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
      </div>
      <p className="meta">Average price: {area.averagePrice}</p>
      <p className="meta">Rental yield: {area.rentalYield}</p>
      <h2>Current listings</h2>
      {matched.length === 0 ? <p>No live listing in {area.name} yet. <Link href="/alerts">Be first to hear about one</Link>, or <Link href="/advertise">list your property</Link>.</p> : <div className="grid">{matched.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>}
    </main>
  );
}
