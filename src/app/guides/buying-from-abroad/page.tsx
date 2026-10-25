import type { Metadata } from "next";
import Link from "next/link";
import { GuideArticle } from "../../../components/GuideArticle";
import { withCanonical } from "../../../lib/seo";

export const metadata: Metadata = withCanonical("/guides/buying-from-abroad", {
  title: "Buying from abroad | Guyana Keys",
  description: "How prices, attorneys, and a power of attorney work when you buy in Guyana from overseas.",
});

export default function BuyingFromAbroadPage() {
  return (
    <GuideArticle title="Buying from abroad">
      <p>Prices on Guyana Keys show GYD and an approximate USD figure. The guide rate is not the bank’s rate on the day.</p>
      <p>Meet the attorney, or sign a power of attorney if you are abroad and cannot be in Georgetown.</p>
      <p>Keep the enquiry on Guyana Keys so the lead stays with the listing.</p>
      <p>Use the <Link href="/tools">mortgage calculator</Link> as an estimate, then confirm the loan, stamp duty, and legal fees with the bank and your attorney.</p>
    </GuideArticle>
  );
}
