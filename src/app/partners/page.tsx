import type { Metadata } from "next";
import { LeadForm } from "../../components/LeadForm";
import { partnerGroups, partners } from "../../lib/partners";

export const metadata: Metadata = {
  title: "Trusted partners | Guyana Keys",
  description: "Banks, insurers, attorneys, and surveyors. Request an intro and Guyana Keys saves the lead.",
};

export default function PartnersPage() {
  return (
    <main className="wrap section">
      <p className="chip">Trusted partners on Guyana Keys</p>
      <h1>Services</h1>
      <p className="sub">A starting directory. Guyana Keys does not arrange the loan, the policy, or the legal search. Request an intro and it is saved as a Guyana Keys lead.</p>
      {partnerGroups.map((group) => (
        <section key={group} id={group.toLowerCase()}>
          <h2>{group === "Bank" ? "Mortgage banks" : group === "Broker" ? "Mortgage brokers" : group === "Insurance" ? "Insurance" : group === "Lawyer" ? "Lawyers" : "Surveyors"}</h2>
          <div className="grid">
            {partners.filter((item) => item.group === group).map((partner) => (
              <article className="card" key={partner.id} id={partner.id}>
                <div className="card-body" style={{ display: "grid", gap: 8 }}>
                  <p className="chip">{partner.group}</p>
                  <strong>{partner.name}</strong>
                  <p>{partner.description}</p>
                  <p className="meta">{partner.offer}</p>
                  <p className="meta">{partner.contact}</p>
                  <LeadForm preset={group === "Insurance" ? `Get quote: ${partner.name}` : `Request intro: ${partner.name}`} button={group === "Insurance" ? "Get quote" : "Request intro"} />
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
