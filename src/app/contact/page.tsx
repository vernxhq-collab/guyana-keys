import type { Metadata } from "next";
import Link from "next/link";
import { facebookPage, publicEmail } from "../../lib/contact";
import { withCanonical } from "../../lib/seo";

export const metadata: Metadata = withCanonical("/contact", {
  title: "Contact | Guyana Keys",
  description: "Write to info@gykeys.com. The Guyana Keys team will get back to you.",
});

export default function ContactPage() {
  return (
    <main className="wrap section">
      <p className="eyebrow">The Guyana Keys team</p>
      <h1>Contact</h1>
      <p>We&apos;d love to hear from you, whether you&apos;re searching, listing or just have a question. Write to <a href={`mailto:${publicEmail}`}>{publicEmail}</a> and the Guyana Keys team will get back to you.</p>
      <p><a href={facebookPage} target="_blank" rel="noreferrer">Guyana Keys on Facebook</a></p>
      <h2>List a property</h2>
      <p>Owners and agents are welcome. Our team reviews each new account before its first listing goes live. Free to list, no limits.</p>
      <p><Link className="btn" href="/advertise">List a property</Link></p>
    </main>
  );
}
