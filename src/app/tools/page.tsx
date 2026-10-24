import type { Metadata } from "next";
import Link from "next/link";
import { CurrencyConverter } from "../../components/CurrencyConverter";
import { MortgageCalculator } from "../../components/MortgageCalculator";
import { withCanonical } from "../../lib/seo";

export const metadata: Metadata = withCanonical("/tools", {
  title: "Mortgage calculator | Guyana Keys",
  description: "Estimate a payment from a rate you type. This is an estimate, not financial advice.",
});

export default function ToolsPage() {
  return (
    <main className="wrap section tools-page">
      <h1>Mortgage and purchase costs</h1>
      <p className="sub">Stamp duty and legal fees stay blank until you type a figure. This is an estimate, not financial advice.</p>
      <MortgageCalculator />
      <h2>Currency guide</h2>
      <CurrencyConverter />
      <div className="tool-cards">
        <Link href="/partners"><strong>Partner with us</strong><span>List a property or work with the Guyana Keys desk.</span></Link>
        <Link href="/guides"><strong>Safety guide</strong><span>Read what to check before you pay a deposit.</span></Link>
      </div>
    </main>
  );
}
