import type { Metadata } from "next";
import { GuideCards } from "../../components/GuideCards";
import { withCanonical } from "../../lib/seo";

export const metadata: Metadata = withCanonical("/guides", {
  title: "Guides | Guyana Keys",
  description: "Short guides on buying from abroad, checking a deposit, and renting in Guyana.",
});

export default function GuidesPage() {
  return (
    <main className="guide-page">
      <p className="guide-kicker">Guides</p>
      <h1>Guides for buying and renting</h1>
      <p>Short guides on buying from abroad, checking a deposit, and renting.</p>
      <GuideCards />
    </main>
  );
}
