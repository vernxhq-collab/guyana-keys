import type { Metadata } from "next";
import { GuideCards } from "../../components/GuideCards";
import { withCanonical } from "../../lib/seo";

export const metadata: Metadata = withCanonical("/guides", {
  title: "Guides | Guyana Keys",
  description: "Clear, practical guides for renting, buying, and investing in Guyana, at home or from abroad.",
});

export default function GuidesPage() {
  return (
    <main className="guide-page">
      <p className="guide-kicker">Guides</p>
      <h1>Guides for buying and renting</h1>
      <p>Clear, practical guides for every step, whether you&apos;re renting in Georgetown, buying your first home or investing from abroad.</p>
      <GuideCards />
    </main>
  );
}
