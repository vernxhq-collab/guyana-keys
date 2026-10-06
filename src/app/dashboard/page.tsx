import { deskRows } from "../../lib/desk";
export default async function DashboardPage() {
  const [enquiries, properties] = await Promise.all([deskRows("enquiries"), deskRows("properties")]);
  const applications = enquiries.filter((row) => String(row.listing_id || row.note || "").includes("application") || String(row.listing_id || "") === "rental-application");
  return (
    <main className="wrap section">
      <h1>Desk</h1>
      <div className="grid">
        <article className="card"><div className="card-body"><h2>Leads</h2><p className="price">{enquiries.length}</p><p className="meta">Enquiries saved in Supabase.</p></div></article>
        <article className="card"><div className="card-body"><h2>Listings</h2><p className="price">{properties.length}</p><p className="meta">Rows in properties. The sample homes are still in the site data.</p></div></article>
        <article className="card"><div className="card-body"><h2>Applications</h2><p className="price">{applications.length}</p><p className="meta">Rental applications waiting for review.</p></div></article>
      </div>
      <h2>Latest leads</h2>
      {enquiries.length === 0 ? <p>No lead yet. An enquiry from a listing will show here.</p> : <div className="grid">{enquiries.slice(0, 6).map((row) => <article className="card" key={row.id}><div className="card-body"><strong>{row.name || "Lead"}</strong><p className="meta">{row.phone}</p><p className="meta">{row.note || row.listing_id}</p></div></article>)}</div>}
    </main>
  );
}
