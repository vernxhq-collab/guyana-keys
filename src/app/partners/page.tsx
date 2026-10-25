import type { Metadata } from "next";

export const dynamic = "force-dynamic";
import { LeadForm } from "../../components/LeadForm";
import { publicPartners, type PublicPartner } from "../../lib/phase1-desk";
import { withCanonical } from "../../lib/seo";

export const metadata: Metadata = withCanonical("/partners", {
  title: "Partners | Guyana Keys",
  description: "Mortgage, insurance, legal, survey and valuation professionals in Guyana appear here only after they agree to be listed.",
});

const labels: Record<string, string> = {
  bank: "Banks",
  insurance_broker: "Insurance brokers",
  lawyer: "Lawyers",
  surveyor: "Surveyors",
  valuer: "Valuers",
};

export default async function PartnersPage() {
  const partners = await publicPartners();
  const groups = Object.entries(labels).map(([id, label]) => ({
    id,
    label,
    rows: partners.filter((partner) => partner.category === id),
  })).filter((group) => group.rows.length > 0);
  return (
    <main className="wrap section">
      <h1>Partners</h1>
      <p className="sub">We&apos;re bringing together mortgage, insurance, legal, survey and valuation professionals in Guyana. A firm appears here only once it has agreed to be listed.</p>
      {groups.map((group) => (
        <section key={group.id}>
          <h2>{group.label}</h2>
          <div className="grid">{group.rows.map((partner) => <PartnerCard key={partner.id} partner={partner} />)}</div>
        </section>
      ))}
      <h2>Partner with us</h2>
      <p>If you arrange mortgages, insurance, conveyancing, surveys, or valuations in Guyana and want to talk about working together, send a note. Sending a note does not list you.</p>
      <div className="panel" style={{ maxWidth: 560 }}>
        <LeadForm preset="Partner with Guyana Keys" button="Send a note" />
      </div>
    </main>
  );
}

function PartnerCard({ partner }: { partner: PublicPartner }) {
  return (
    <article className="card">
      <div className="card-body">
        <strong>{partner.name}</strong>
        <p className="meta">{[partner.area, partner.phone, partner.email].filter(Boolean).join(" · ")}</p>
        {partner.note ? <p>{partner.note}</p> : null}
        <LeadForm preset={`Request an introduction to ${partner.name}`} button="Request intro" leadKind="intro" partnerId={partner.id} />
      </div>
    </article>
  );
}
