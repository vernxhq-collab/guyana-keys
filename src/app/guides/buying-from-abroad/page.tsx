import type { Metadata } from "next";
import Link from "next/link";
import { GuideArticle } from "../../../components/GuideArticle";
import { usdGuideNote } from "../../../lib/usd-guide";
import { withCanonical } from "../../../lib/seo";

export const metadata: Metadata = withCanonical("/guides/buying-from-abroad", {
  title: "Buying from abroad | Guyana Keys",
  description: "Buying from overseas with confidence, from reading prices in GYD to working with an attorney in Guyana.",
});

export default function BuyingFromAbroadPage() {
  return (
    <GuideArticle title="Buying from abroad">
      <p>Buying from overseas with confidence starts with a clear search, a clear price, and an attorney in Guyana who can act for you.</p>
      <h2>Reading the price</h2>
      <p>Prices on Guyana Keys show GYD and a USD guide. {usdGuideNote()}</p>
      <h2>Working with an attorney</h2>
      <p>Meet the attorney, or sign a power of attorney if you are abroad and cannot be in Georgetown. A listing is not proof of title. Ask for the transport or certificate of title, and have the attorney search the registry before any deposit.</p>
      <h2>Keeping a record</h2>
      <p>Send your enquiry from the listing page, so you keep a record of what was said and who said it.</p>
      <h2>Costs</h2>
      <p>Use the <Link href="/tools">mortgage calculator</Link> as an estimate, then confirm the loan, stamp duty, and legal fees with the bank and your attorney. The calculator does not name a bank and it is not an offer of a loan.</p>
      <h2>A viewing from abroad</h2>
      <p>A viewing from abroad is a request the agent confirms. It is not a valuation and not a promised return.</p>
    </GuideArticle>
  );
}
