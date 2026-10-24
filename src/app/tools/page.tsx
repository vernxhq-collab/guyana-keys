import type { Metadata } from "next";
import Link from "next/link";
import { CurrencyConverter } from "../../components/CurrencyConverter";
import { MortgageCalculator } from "../../components/MortgageCalculator";
import { loadMortgageRates } from "../../lib/phase1-desk";
import { rateLine } from "../../lib/rates";
import { withCanonical } from "../../lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = withCanonical("/tools", {
  title: "Mortgage calculator | Guyana Keys",
  description: "Estimate a payment from a rate checked on a bank page, or from a rate you type. This is an estimate, not financial advice.",
});

export default async function ToolsPage() {
  const rates = await loadMortgageRates();
  return (
    <main className="wrap section tools-page">
      <h1>Mortgage and purchase costs</h1>
      <p className="sub">Checked rates are copied from the bank's own page, with the date they were read. The band follows the loan amount. Stamp duty and legal fees stay blank until you type a figure. This is an estimate, not financial advice.</p>
      <MortgageCalculator rates={rates} />
      <h2>Checked rates</h2>
      <ul className="pros">
        {rates.map((rate) => (
          <li key={rate.id}>
            {rate.bank} · {rate.product} · {rate.rate}% · {rateLine(rate)} · <a href={rate.sourceUrl}>Source</a>
          </li>
        ))}
      </ul>
      <h2>Currency guide</h2>
      <CurrencyConverter />
      <div className="tool-cards">
        <Link href="/partners"><strong>Partner with us</strong><span>List a property or work with the Guyana Keys desk.</span></Link>
        <Link href="/guides"><strong>Safety guide</strong><span>Read what to check before you pay a deposit.</span></Link>
      </div>
    </main>
  );
}
