import type { Metadata } from "next";
import { GuideArticle } from "../../../components/GuideArticle";
import { usdGuideNote } from "../../../lib/usd-guide";
import { withCanonical } from "../../../lib/seo";

export const metadata: Metadata = withCanonical("/guides/spotting-scams", {
  title: "Spotting property scams | Guyana Keys",
  description: "The warning signs to know, and the papers to see before any money changes hands.",
});

export default function SpottingScamsPage() {
  return (
    <GuideArticle title="Spotting property scams">
      <p>A listing shows what an owner or agent has told us. A listing is not proof of title. Before paying any deposit, ask for the transport or certificate of title and have an attorney in Guyana search the registry.</p>
      <p>{usdGuideNote()} A viewing from abroad is a request the agent confirms. This is not a valuation and not a promised return.</p>
      <h2>Before you send money</h2>
      <ul className="pros">
        <li>Do not pay a deposit to a stranger, a relative of the seller, or an account you have not checked.</li>
        <li>Meet the attorney, or sign a power of attorney if you are abroad and cannot be in Georgetown.</li>
        <li>Ask whether the land is transport, certificate of title, or lease. A lease is not the same as owning the land.</li>
        <li>A survey matters when the plan and the ground do not match.</li>
      </ul>
    </GuideArticle>
  );
}
