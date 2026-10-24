import Link from "next/link";
import { areas, regionGuide, regionSlug } from "../../lib/areas";
import { withCanonical } from "../../lib/seo";

export const metadata = withCanonical("/areas", {
  title: "Neighbourhoods | Guyana Keys",
  description: "Georgetown, the East Bank, the East Coast, Berbice, Linden, and the other places people search.",
});

export default function AreasPage() {
  const regions = Array.from(new Set(areas.map((area) => area.region)));
  return (
    <main className="wrap section">
      <p className="chip">Listed on Guyana Keys</p>
      <h1>Neighbourhoods</h1>
      <p className="sub">Georgetown, the coast, Berbice, and the towns people search. Average prices stay blank until more sales are on Guyana Keys.</p>
      <div className="grid">
        {regions.map((region) => {
          const guide = regionGuide(region);
          return <Link className="card" key={region} href={`/areas/region/${regionSlug(region)}`}><div className="card-body"><strong>{guide.name}</strong><p className="meta">{guide.about}</p></div></Link>;
        })}
      </div>
      {regions.map((region) => (
        <section key={region}><h2><Link href={`/areas/region/${regionSlug(region)}`}>{region}</Link></h2><div className="grid">{areas.filter((area) => area.region === region).map((area) => (
          <Link className="card" key={area.slug} href={`/areas/${area.slug}`}><div className="card-body"><strong>{area.name}</strong><p className="meta">{area.note}</p></div></Link>
        ))}</div></section>
      ))}
    </main>
  );
}
