import type { Metadata } from "next";
import Link from "next/link";
import { CurrencyConverter } from "../../components/CurrencyConverter";
import { MortgageCalculator } from "../../components/MortgageCalculator";

export const metadata: Metadata = {
  title: "Mortgage calculator | Guyana Keys",
  description: "Estimate a payment from a rate you enter, plus stamp duty and legal fees. Estimates only.",
};

export default function ToolsPage() {
  return (
    <main className="wrap section">
      <h1>Mortgage and purchase costs</h1>
      <p className="sub">Type the rate you were quoted. Figures are estimates. Confirm them with the lender and your attorney.</p>
      <MortgageCalculator />
      <h2>Currency guide</h2>
      <CurrencyConverter />
      <p className="meta"><Link href="/partners">Partner with us</Link> · <Link href="/guides">Safety guide</Link></p>
    </main>
  );
}
