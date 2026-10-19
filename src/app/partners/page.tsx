import type { Metadata } from "next";
import { LeadForm } from "../../components/LeadForm";

export const metadata: Metadata = {
  title: "Partner with us | Guyana Keys",
  description: "An invitation for lenders, insurers, attorneys, and surveyors who want to talk with Guyana Keys.",
};

export default function PartnersPage() {
  return (
    <main className="wrap section">
      <h1>Partner with us</h1>
      <p className="sub">Guyana Keys does not list lenders, insurers, or rates, and it does not claim a partnership with any firm. If you arrange mortgages, insurance, conveyancing, or surveys in Guyana and want to talk about working together, send a note.</p>
      <div className="panel" style={{ maxWidth: 560 }}>
        <LeadForm preset="Partner with Guyana Keys" button="Send a note" />
      </div>
    </main>
  );
}
