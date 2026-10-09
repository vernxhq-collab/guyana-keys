import { redirect } from "next/navigation";
import { MagicLinkForm } from "../../../components/MagicLinkForm";
import { isAdminEmail, readSession } from "../../../lib/session";

export default async function AdminLoginPage() {
  const session = await readSession();
  if (session?.profile?.role === "admin" && isAdminEmail(session.user.email)) redirect("/admin");
  if (session?.profile && (session.profile.role !== "admin" || !isAdminEmail(session.user.email))) {
    return <main className="wrap section desk"><p>This desk is for the Guyana Keys admin.</p></main>;
  }
  return (
    <main className="wrap section desk">
      <MagicLinkForm desk="admin" title="Admin sign in" blurb="We email a sign-in link. Nothing is printed here." />
    </main>
  );
}
