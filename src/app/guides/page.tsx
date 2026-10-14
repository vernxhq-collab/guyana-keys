import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Buying safely | Guyana Keys",
  description: "Title checks, deposits, and buying a Guyana home from abroad.",
};

export default function GuidesPage() {
  return (
    <main className="wrap section">
      <p className="chip">Listed on Guyana Keys</p>
      <h1>Buying safely</h1>
      <p>A listing is not proof of ownership. Ask for the transport or certificate of title, then have a Georgetown attorney search the Deeds Registry before any deposit.</p>
      <h2>Before you send money</h2>
      <ul className="pros">
        <li>Do not pay a deposit to a stranger, a relative of the seller, or an account you have not checked.</li>
        <li>Keep the enquiry on Guyana Keys so the lead stays with the listing.</li>
        <li>Meet the attorney, or sign a power of attorney if you are abroad and cannot be in Georgetown.</li>
        <li>Ask whether the land is transport, certificate of title, or lease. A lease is not the same as owning the land.</li>
        <li>A survey matters when the plan and the ground do not match.</li>
      </ul>
      <h2>From abroad</h2>
      <p>Prices on Guyana Keys show GYD and an approximate USD figure. The guide rate is not the bank’s rate on the day. Use the <Link href="/tools">mortgage calculator</Link> as an estimate, then confirm the loan, stamp duty, and legal fees with the bank and your attorney.</p>
      <p className="meta"><Link href="/partners">Trusted partners</Link> · <Link href="/tools">Tools</Link></p>
    </main>
  );
}
