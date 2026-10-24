import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingCard } from "../../../../components/ListingCard";
import { areas, regionGuide, regionSlug } from "../../../../lib/areas";
import { loadCatalog } from "../../../../lib/catalog";
import { withCanonical } from "../../../../lib/seo";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return [...new Set(areas.map((item) => item.region))].map((name) => ({ slug: regionSlug(name) }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const name = areas.find((item) => regionSlug(item.region) === slug)?.region;
  if (!name) return { title: "Region | Guyana Keys" };
  const guide = regionGuide(name);
  return withCanonical(`/areas/region/${slug}`, { title: `${guide.name} property | Guyana Keys`, description: guide.about });
}

export default async function RegionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const name = areas.find((item) => regionSlug(item.region) === slug)?.region;
  if (!name) notFound();
  const guide = regionGuide(name);
  const { listings } = await loadCatalog();
  const matched = listings.filter((item) => item.region === name);
  return (
    <main className="wrap section">
      <p className="chip">Listed on Guyana Keys</p>
      <p className="meta"><Link href="/areas">Neighbourhoods</Link></p>
      <h1>{guide.name}</h1>
      <p>{guide.about}</p>
      <div className="split">
        <section className="panel">
          <h2>Worth knowing</h2>
          <ul className="pros">{guide.pros.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
        <section className="panel">
          <h2>Watch for</h2>
          <ul className="pros">{guide.cons.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
      </div>
      <p className="meta">Average price: {guide.averagePrice}</p>
      <p className="meta">Rental yield: {guide.rentalYield}</p>
      <h2>Neighbourhoods</h2>
      <div className="grid">{guide.areas.map((area) => (
        <Link className="card" key={area.slug} href={`/areas/${area.slug}`}><div className="card-body"><strong>{area.name}</strong><p className="meta">{area.note}</p></div></Link>
      ))}</div>
      <h2>Current listings</h2>
      {matched.length === 0 ? <p>No live listing in {guide.name} yet. <Link href="/alerts">Be first to hear about one</Link>, or <Link href="/advertise">list your property</Link>.</p> : <div className="grid">{matched.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>}
    </main>
  );
}
