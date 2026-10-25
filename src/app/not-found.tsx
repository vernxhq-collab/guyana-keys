import type { Metadata } from "next";
import Link from "next/link";
import { privateMeta } from "../lib/seo";

export const metadata: Metadata = privateMeta("/404", "Page not found | Guyana Keys", "That page is not on Guyana Keys.");

export default function NotFound() {
  return (
    <main className="wrap section">
      <h1>Page not found</h1>
      <p>That page is not on Guyana Keys.</p>
      <p><Link href="/">Back to the homepage</Link> · <Link href="/listings">Browse listings</Link></p>
    </main>
  );
}
