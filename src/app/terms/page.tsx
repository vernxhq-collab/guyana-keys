import type { Metadata } from "next";
import { publicEmail } from "../../lib/contact";
import { withCanonical } from "../../lib/seo";

export const metadata: Metadata = withCanonical("/terms", {
  title: "Terms of use | Guyana Keys",
  description: "How Guyana Keys works, what a listing is, and the law that governs these terms.",
});

export default function TermsPage() {
  return (
    <main className="guide-page">
      <p className="guide-kicker">Terms</p>
      <h1>Terms of use</h1>
      <p>Last updated: 25 October 2026</p>
      <p>These terms cover your use of the Guyana Keys website. Write to <a href={`mailto:${publicEmail}`}>{publicEmail}</a> if you have a question.</p>

      <h2>What Guyana Keys is</h2>
      <p>Guyana Keys is a place to search for property and to list it. We are not a party to a sale, a rental, or any other deal between you and an owner or agent.</p>

      <h2>Listings</h2>
      <p>Listings are supplied by the owners and agents who advertise them. A listing is not proof of title. Take independent professional advice before you pay a deposit. That includes a title search and an inspection where one is appropriate. A listing is not a valuation and not a promised return.</p>

      <h2>Acceptable use</h2>
      <p>Do not post a listing that is false. Do not post a listing that discriminates. Every home on Guyana Keys is open to every buyer and renter. We may remove a listing.</p>

      <h2>The website</h2>
      <p>The design and the text of this website belong to Guyana Keys. Photos and descriptions on a listing come from the person who advertised it. They must have the right to use them.</p>

      <h2>Liability</h2>
      <p>As far as the law allows, Guyana Keys is not liable for a loss that comes from using this website or from relying on a listing.</p>

      <h2>Law</h2>
      <p>These terms are governed by the laws of Guyana.</p>

      <h2>Contact</h2>
      <p><a href={`mailto:${publicEmail}`}>{publicEmail}</a></p>
    </main>
  );
}
