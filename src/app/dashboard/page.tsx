import type { Metadata } from "next";
import { privateMeta } from "../../lib/seo";

export const metadata: Metadata = privateMeta("/dashboard", "Your desk | Guyana Keys", "Sign in from your homes to see the places you saved.");

export default function DashboardPage() {
  return (
    <main className="wrap section">
      <h1>Desk</h1>
      <p>Sign in from your homes to see the places you saved.</p>
    </main>
  );
}
