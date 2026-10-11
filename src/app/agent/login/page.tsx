import { redirect } from "next/navigation";
import { MagicLinkForm } from "../../../components/MagicLinkForm";
import { SignOut } from "../../../components/SignOut";
import { isAdminEmail, readSession } from "../../../lib/session";

export default async function AgentLoginPage() {
  const session = await readSession();
  if (session?.profile?.role === "agent" && !session.profile.suspended) redirect("/agent");
  const email = session?.user.email || "";
  const blocked = Boolean(email && session?.profile?.role !== "agent");
  return (
    <main className="wrap section desk agent-desk">
      {session?.profile?.suspended ? <p>This account is suspended.</p> : null}
      {blocked ? (
        <div className="stack" style={{ width: "min(440px, 100%)", margin: "0 auto 16px" }}>
          <p>You are signed in as {email}. {isAdminEmail(email) ? "That address opens the admin desk. The agent desk needs a different email." : "That account cannot open the agent desk. Sign out, then use the agent email."}</p>
          <SignOut next="/agent/login" />
        </div>
      ) : null}
      <MagicLinkForm desk="agent" title="Agent sign in" blurb="We email a sign-in link. Nothing is printed here." />
    </main>
  );
}
