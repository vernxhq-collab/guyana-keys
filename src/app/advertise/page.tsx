import type { Metadata } from "next";
import Link from "next/link";
import { withCanonical } from "../../lib/seo";

export const metadata: Metadata = withCanonical("/advertise", {
  title: "List your property | Guyana Keys",
  description: "List a property on Guyana Keys, or ask about featuring and advertising. Free to list, no limits.",
});

const services = [
  { title: "I'm an agent", href: "/agents/apply", line: "Apply to list homes for the people you work with." },
  { title: "I'm a landlord", href: "/landlords", line: "List a home, apartment, or room to rent." },
  { title: "I'm a developer", href: "/developers", line: "Tell us about a new scheme." },
  { title: "Advertise a listing", href: "/advertise/listing", line: "Ask about featuring a listing that is already on Guyana Keys." },
];

export default function AdvertisePage() {
  return (
    <main className="wrap section">
      <h1>List your property on Guyana Keys. Free to list, no limits. Choose the option that fits you.</h1>
      <div className="choice-grid">
        {services.map((item) => (
          <Link className="choice-card" key={item.title} href={item.href}>
            <span className="area-mark" aria-hidden="true" />
            <h2>{item.title}</h2>
            <p>{item.line}</p>
            <span className="btn">Continue</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
