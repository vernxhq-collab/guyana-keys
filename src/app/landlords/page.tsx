import type { Metadata } from "next";
import Link from "next/link";
import { publicEmail } from "../../lib/contact";
import { withCanonical } from "../../lib/seo";

export const metadata: Metadata = withCanonical("/landlords", {
  title: "Landlords | Guyana Keys",
  description: "A landlord desk is not open yet. Write to the Guyana Keys team about a rental.",
});

export default function LandlordsPage() {
  return (
    <main className="wrap section">
      <h1>Landlords</h1>
      <p>A landlord desk is not open yet. Sign in on Your homes to save a place, or write to {publicEmail} about a rental.</p>
      <p><Link className="btn" href="/account">Sign in</Link></p>
    </main>
  );
}
