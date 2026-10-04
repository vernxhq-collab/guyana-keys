import Link from "next/link";
import { areas } from "../../lib/areas";

export default function AreasPage() {
  return (
    <main className="wrap section">
      <h1>Neighbourhoods</h1>
      <p className="lede">Start with a place, not a blank search. Georgetown first, then the coast and Berbice.</p>
      <div className="grid">
        {areas.map((area) => (
          <article className="panel" key={area.slug}>
            <p className="chip">{area.region}</p>
            <h2><Link href={`/areas/${area.slug}`}>{area.name}</Link></h2>
            <p>{area.note}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
