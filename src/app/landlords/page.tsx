import type { Metadata } from "next";
import Link from "next/link";
import { withCanonical } from "../../lib/seo";

export const metadata: Metadata = withCanonical("/landlords", {
  title: "Landlords | Guyana Keys",
  description: "Have a home, apartment or room to rent? List it on Guyana Keys. Free to list, no limits.",
});

export default function LandlordsPage() {
  return (
    <main className="wrap section">
      <h1>Landlords</h1>
      <p>Have a home, apartment or room to rent? List it on Guyana Keys and reach renters here and abroad. Free to list, no limits.</p>
      <p className="prelaunch-actions">
        <Link className="btn" href="/advertise">List a property</Link>
        <Link className="btn ghost" href="/contact">Contact</Link>
      </p>
    </main>
  );
}
