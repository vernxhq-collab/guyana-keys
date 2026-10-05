import Link from "next/link";
import { areas } from "../lib/areas";
export default function HomePage() {
  return (
    <main className="wrap">
      <h1>Guyana Keys</h1>
      <p>Homes, land, and rentals in Guyana.</p>
      <ul>{areas.slice(0, 6).map((area) => <li key={area.slug}><Link href={`/areas/${area.slug}`}>{area.name}</Link></li>)}</ul>
    </main>
  );
}
