import { redirect } from "next/navigation";
import { MagicLinkForm } from "../../../components/MagicLinkForm";
import { readSession } from "../../../lib/session";

export default async function AgentLoginPage() {
  const session = await readSession();
  if (session?.profile?.suspended) return <main className="wrap section desk"><p>This account is suspended.</p></main>;
  if (session?.profile && session.profile.role !== "agent") return <main className="wrap section desk"><p>This desk is for agents.</p></main>;
  if (session?.profile?.role === "agent") redirect("/agent");
  return (
    <main className="wrap section desk">
      <MagicLinkForm desk="agent" title="Agent sign in" blurb="We email a sign-in link. Nothing is printed here." />
    </main>
  );
}
