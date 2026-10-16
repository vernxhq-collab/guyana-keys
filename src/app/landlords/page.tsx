import Link from "next/link";
import { deskEmail } from "../../lib/contact";

export default function LandlordsPage() {
  return (
    <main className="wrap section">
      <h1>Landlords</h1>
      <p>A landlord desk is not open yet. Sign in on Your homes to save a place, or write to {deskEmail} about a rental.</p>
      <p><Link className="btn" href="/account">Sign in</Link></p>
    </main>
  );
}
