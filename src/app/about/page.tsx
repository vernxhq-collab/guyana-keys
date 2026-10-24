import type { Metadata } from "next";
import Link from "next/link";
import { withCanonical } from "../../lib/seo";

export const metadata: Metadata = withCanonical("/about", {
  title: "About | Guyana Keys",
  description: "Guyana Keys is one place to find, rent, and list property in Guyana, at home or from abroad. Free to list, no limits.",
});

export default function AboutPage() {
  return (
    <main className="wrap section">
      <p className="eyebrow">The Guyana Keys team</p>
      <h1>About Guyana Keys</h1>
      <p>Guyana Keys is one place to find, rent, and list property in Guyana, at home or from abroad. Free to list, no limits.</p>
      <p>An approved agent publishes a home after the owner has allowed it. A listing is not proof of title. Ask for the transport or certificate of title, and have an attorney search the registry before any deposit.</p>
      <p>People outside Guyana can search in GYD, with a USD guide, and ask an agent for a viewing. A viewing is a request. The agent confirms the time.</p>
      <p>Featuring a listing, a boost, and other extras are optional. They do not change how many homes can be listed.</p>
      <p><Link className="btn" href="/listings">Search property</Link> <Link className="btn ghost" href="/agents/apply">Apply to list</Link></p>
    </main>
  );
}
