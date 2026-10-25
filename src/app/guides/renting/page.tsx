import type { Metadata } from "next";
import { GuideArticle } from "../../../components/GuideArticle";
import { withCanonical } from "../../../lib/seo";

export const metadata: Metadata = withCanonical("/guides/renting", {
  title: "Renting in Guyana | Guyana Keys",
  description: "How rentals are searched, and what the GYD and USD figures mean.",
});

export default function RentingGuidePage() {
  return (
    <GuideArticle title="Renting in Guyana">
      <p>The same listings and the same respect for every buyer and renter.</p>
      <p>Prices on Guyana Keys show GYD and an approximate USD figure. The guide rate is not the bank’s rate on the day.</p>
      <p>Keep the enquiry on Guyana Keys so the lead stays with the listing.</p>
    </GuideArticle>
  );
}
