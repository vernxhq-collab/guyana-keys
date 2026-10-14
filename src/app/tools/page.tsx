import type { Metadata } from "next";
import Link from "next/link";
import { CurrencyConverter } from "../../components/CurrencyConverter";
import { MortgageCalculator } from "../../components/MortgageCalculator";

export const metadata: Metadata = {
  title: "Mortgage calculator | Guyana Keys",
  description: "Estimate a Guyana mortgage payment, stamp duty, and legal fees in GYD and USD. Estimates only.",
};

export default function ToolsPage() {
  return (
    <main className="wrap section">
      <p className="chip">Listed on Guyana Keys</p>
      <h1>Mortgage and purchase costs</h1>
      <p className="sub">Pick a bank for an approximate public rate, or type your own. Figures are estimates. Confirm them with the bank and your attorney.</p>
      <MortgageCalculator />
      <h2>Currency guide</h2>
      <CurrencyConverter />
      <p className="meta"><Link href="/partners">Trusted partners</Link> · <Link href="/guides">Safety guide</Link></p>
    </main>
  );
}
