import type { Metadata } from "next";
import Link from "next/link";
import { deskEmail, facebookPage } from "../../lib/contact";
import { withCanonical } from "../../lib/seo";

export const metadata: Metadata = withCanonical("/contact", {
  title: "Contact | Guyana Keys",
  description: "Write to the Guyana Keys team by email, or visit the Guyana Keys Facebook Page.",
});

export default function ContactPage() {
  return (
    <main className="wrap section">
      <p className="eyebrow">The Guyana Keys team</p>
      <h1>Contact</h1>
      <p>Write to the Guyana Keys team at <a href={`mailto:${deskEmail}`}>{deskEmail}</a>.</p>
      <p><a href={facebookPage} target="_blank" rel="noreferrer">Guyana Keys on Facebook</a></p>
      <h2>List a property</h2>
      <p>Agents apply, then an admin reviews the account before a listing is public. Free to list, no limits.</p>
      <p><Link href="/agents/apply">Apply to list</Link></p>
      <p><Link href="/advertise">List your property</Link></p>
    </main>
  );
}
