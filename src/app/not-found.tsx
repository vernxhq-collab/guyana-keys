import type { Metadata } from "next";
import Link from "next/link";
import { privateMeta } from "../lib/seo";

export const metadata: Metadata = privateMeta("/404", "Page not found | Guyana Keys", "Sorry, we couldn't find that page.");

export default function NotFound() {
  return (
    <main className="wrap section">
      <h1>Page not found</h1>
      <p>Sorry, we couldn&apos;t find that page. It may have moved, or the link may have a typo.</p>
      <p><Link href="/listings">Search listings</Link> · <Link href="/guides">Guides</Link> · <Link href="/">Homepage</Link></p>
    </main>
  );
}
