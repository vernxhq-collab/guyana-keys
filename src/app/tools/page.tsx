import type { Metadata } from "next";

export const dynamic = "force-dynamic";
import Link from "next/link";
import { CurrencyConverter } from "../../components/CurrencyConverter";
import { MortgageCalculator } from "../../components/MortgageCalculator";
import { loadMortgageRates } from "../../lib/phase1-desk";
import { ratesStillNeeded } from "../../lib/rates";

export const metadata: Metadata = {
  title: "Mortgage calculator | Guyana Keys",
  description: "Estimate a payment from a rate checked on a bank page, or from a rate you type. This is an estimate, not financial advice.",
};

export default async function ToolsPage() {
  const rates = await loadMortgageRates();
  return (
    <main className="wrap section">
      <h1>Mortgage and purchase costs</h1>
      <p className="sub">Checked rates are copied from the bank's own page, with the date they were read. A blank stamp or legal field stays blank until you type a figure. This is an estimate, not financial advice.</p>
      <MortgageCalculator rates={rates} />
      <h2>Still needing a published figure</h2>
      <ul className="pros">
        {ratesStillNeeded.map((line) => <li key={line}>{line}</li>)}
      </ul>
      <h2>Currency guide</h2>
      <CurrencyConverter />
      <p className="disclaimer">This is an estimate, not financial advice.</p>
      <p className="meta"><Link href="/partners">Partners</Link> · <Link href="/guides">Safety guide</Link></p>
    </main>
  );
}
