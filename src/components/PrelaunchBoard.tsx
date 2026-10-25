import Link from "next/link";
import { AlertForm } from "./AlertForm";

const copy = {
  buy: {
    heading: "Homes for sale are on their way",
    line: "We're welcoming owners and agents now, and our team reviews every new account before a home goes live. Tell us the area you have in mind and we'll email you when something is listed.",
  },
  rent: {
    heading: "Rentals are on their way",
    line: "We're welcoming owners and agents now, and our team reviews every new account before a rental goes live. Tell us the area you have in mind and we'll email you when something is listed.",
  },
  land: {
    heading: "Land is on its way",
    line: "We're welcoming owners and agents now, and our team reviews every new account before land goes live. Tell us the area you have in mind and we'll email you when something is listed.",
  },
  commercial: {
    heading: "Commercial property is on its way",
    line: "We're welcoming owners and agents now, and our team reviews every new account before a commercial listing goes live. Tell us the area you have in mind and we'll email you when something is listed.",
  },
  search: {
    heading: "Listings are on their way",
    line: "We're welcoming owners and agents now, and our team reviews every new account before a home goes live. Tell us the area you have in mind and we'll email you when something is listed.",
  },
  agents: {
    heading: "Agents are welcome",
    line: "Apply to list on Guyana Keys. Our team reviews each new account before a profile or a home goes live. Free to list, no limits.",
  },
} as const;

export function PrelaunchBoard({ kind }: { kind: keyof typeof copy }) {
  const item = copy[kind];
  return (
    <section className="prelaunch">
      <div className="prelaunch-copy">
        <h2>{item.heading}</h2>
        <p>{item.line}</p>
        <div className="prelaunch-actions">
          {kind === "agents" ? <Link className="btn" href="/agents/apply">Apply to list</Link> : <Link className="btn" href="/advertise">List a property</Link>}
        </div>
      </div>
      <div>
        <h3>Hear when an area is listed</h3>
        <AlertForm />
      </div>
    </section>
  );
}
