import Link from "next/link";
import { areas } from "../lib/areas";

export default function HomePage() {
  return (
    <main className="wrap">
      <h1>Find a home in Guyana.</h1>
      <p>Search listings, neighbourhoods, and verified agents. WhatsApp opens with the property named.</p>
      <p><Link href="/listings">Listings</Link> · <Link href="/agents">Agents</Link> · <Link href="/guides">Diaspora guide</Link></p>
      <ul>{areas.slice(0, 8).map((area) => <li key={area.slug}><Link href={`/areas/${area.slug}`}>{area.name}</Link></li>)}</ul>
    </main>
  );
}
