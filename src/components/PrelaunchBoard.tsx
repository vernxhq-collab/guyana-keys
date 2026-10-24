import Link from "next/link";
import { AlertForm } from "./AlertForm";

const copy = {
  buy: {
    heading: "Homes for sale will be published here",
    line: "Guyana Keys is welcoming owners and agents. A person reviews the account before a home is public. Search this page again once listings are live, or ask to hear when an area is listed.",
  },
  rent: {
    heading: "Rentals will be published here",
    line: "Owners and agents can list a rental now. It appears in this search after the account is reviewed. Ask to hear when a neighbourhood you care about is listed.",
  },
  land: {
    heading: "Land will be published here",
    line: "House lots and other land can be listed now. They show in this search after the account is reviewed. Nothing on this page is a sample listing.",
  },
  commercial: {
    heading: "Commercial property will be published here",
    line: "Offices, shops, and other commercial property can be listed now. They show here after the account is reviewed.",
  },
  search: {
    heading: "Property will be published here",
    line: "Homes, rentals, land, and commercial property show here after an approved account publishes them. Nothing on this page is a sample listing.",
  },
  agents: {
    heading: "Profiles are published after review",
    line: "Guyana Keys is welcoming agents. Apply, and a person reviews the account before a profile or a listing is public. Free to list, no limits.",
  },
} as const;

export function PrelaunchBoard({ kind }: { kind: keyof typeof copy }) {
  const item = copy[kind];
  return (
    <section className="prelaunch">
      <div className="prelaunch-copy">
        <h2>{item.heading}</h2>
        <p>{item.line}</p>
        <p>More to come.</p>
        <div className="prelaunch-actions">
          <Link className="btn" href="/advertise">List a property</Link>
          <Link className="btn ghost" href="/agents/apply">Become a founding agent</Link>
          <Link className="btn ghost" href="/areas">Explore Guyana</Link>
          <Link className="btn ghost" href="/guides">Buying guide</Link>
        </div>
      </div>
      <div>
        <h3>Hear when an area is listed</h3>
        <AlertForm />
      </div>
    </section>
  );
}
