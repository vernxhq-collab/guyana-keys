import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { privateMeta } from "../../../lib/seo";

export const metadata: Metadata = privateMeta("/admin/login", "Admin sign in | Guyana Keys", "Email a sign-in link for the admin desk.");
import { MagicLinkForm } from "../../../components/MagicLinkForm";
import { SignOut } from "../../../components/SignOut";
import { grantAdmin, isAdminEmail, readSession } from "../../../lib/session";

export default async function AdminLoginPage() {
  const session = await readSession();
  if (session && isAdminEmail(session.user.email)) {
    await grantAdmin(session.user);
    redirect("/admin");
  }
  return (
    <main className="wrap section desk">
      {session?.user.email ? (
        <div className="stack" style={{ width: "min(440px, 100%)", margin: "0 auto 16px" }}>
          <p>You are signed in as {session.user.email}. That account cannot open the admin desk. Sign out, then use the admin address.</p>
          <SignOut next="/admin/login" label="Log out" />
        </div>
      ) : null}
      <MagicLinkForm desk="admin" title="Admin sign in" blurb="We email a sign-in link. Nothing is printed here." />
    </main>
  );
}
