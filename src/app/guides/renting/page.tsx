import type { Metadata } from "next";
import { GuideArticle } from "../../../components/GuideArticle";
import { usdGuideNote } from "../../../lib/usd-guide";
import { withCanonical } from "../../../lib/seo";

export const metadata: Metadata = withCanonical("/guides/renting", {
  title: "Renting in Guyana | Guyana Keys",
  description: "Finding the right place to rent, what to ask before you sign, and how to read the price.",
});

export default function RentingGuidePage() {
  return (
    <GuideArticle title="Renting in Guyana">
      <p>Renting in Guyana should be simple and fair. Every listing here is open to every renter, and you can search rentals the same way you search homes for sale.</p>
      <h2>Finding a place</h2>
      <p>Search by area, then read the listing for what is included. Photos and details come from the person who listed the home. If something is missing, ask before you treat the listing as complete.</p>
      <h2>Before you sign</h2>
      <p>Ask how long the rental runs, what the price covers, and who you pay. See the place, or ask for a viewing the agent confirms, before you send a deposit. A listing is not proof of title. A lease is not the same as owning the land.</p>
      <h2>How to read the price</h2>
      <p>Rental prices show GYD and a USD guide. {usdGuideNote()}</p>
      <h2>Paying a deposit</h2>
      <p>Do not pay a deposit to a stranger, a relative of the owner, or an account you have not checked. Know the name on the agreement and keep a copy of what you signed.</p>
    </GuideArticle>
  );
}
