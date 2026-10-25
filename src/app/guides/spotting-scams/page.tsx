import type { Metadata } from "next";
import { GuideArticle } from "../../../components/GuideArticle";
import { depositParagraph } from "../../../lib/guides";
import { withCanonical } from "../../../lib/seo";

export const metadata: Metadata = withCanonical("/guides/spotting-scams", {
  title: "Spotting property scams | Guyana Keys",
  description: "Deposits, title documents, and what to check before you pay.",
});

export default function SpottingScamsPage() {
  return (
    <GuideArticle title="Spotting property scams">
      <p>A listing is not proof of ownership. Ask for the transport or certificate of title, then have a Georgetown attorney search the Deeds Registry before any deposit.</p>
      <p>{depositParagraph}</p>
      <h2>Before you send money</h2>
      <ul className="pros">
        <li>Do not pay a deposit to a stranger, a relative of the seller, or an account you have not checked.</li>
        <li>Keep the enquiry on Guyana Keys so the lead stays with the listing.</li>
        <li>Meet the attorney, or sign a power of attorney if you are abroad and cannot be in Georgetown.</li>
        <li>Ask whether the land is transport, certificate of title, or lease. A lease is not the same as owning the land.</li>
        <li>A survey matters when the plan and the ground do not match.</li>
      </ul>
    </GuideArticle>
  );
}
