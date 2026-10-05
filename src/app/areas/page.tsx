import Link from "next/link";
import { areas } from "../../lib/areas";
export default function AreasPage() {
  const regions = Array.from(new Set(areas.map((area) => area.region)));
  return (
    <main className="wrap section">
      <h1>Neighbourhoods</h1>
      <p className="sub">Georgetown, the coast, Berbice, and the towns people search. Not every village.</p>
      {regions.map((region) => (
        <section key={region}><h2>{region}</h2><div className="grid">{areas.filter((area) => area.region === region).map((area) => (
          <Link className="card" key={area.slug} href={`/areas/${area.slug}`}><div className="card-body"><strong>{area.name}</strong><p className="meta">{area.note}</p></div></Link>
        ))}</div></section>
      ))}
    </main>
  );
}
