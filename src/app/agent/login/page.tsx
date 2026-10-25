import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { privateMeta } from "../../../lib/seo";

export const metadata: Metadata = privateMeta("/agent/login", "Agent sign in | Guyana Keys", "Email a sign-in link for the agent desk.");
import { MagicLinkForm } from "../../../components/MagicLinkForm";
import { SignOut } from "../../../components/SignOut";
import { canUseAgentDesk, readSession } from "../../../lib/session";

export default async function AgentLoginPage() {
  const session = await readSession();
  if (canUseAgentDesk(session?.profile, session?.user.email)) redirect("/agent");
  const email = session?.user.email || "";
  const blocked = Boolean(email && session?.profile && !canUseAgentDesk(session.profile, session.user.email));
  return (
    <main className="wrap section desk agent-desk">
      {session?.profile?.suspended ? <p>This account is suspended.</p> : null}
      {blocked && !session?.profile?.suspended ? (
        <div className="stack" style={{ width: "min(440px, 100%)", margin: "0 auto 16px" }}>
          <p>You are signed in as {email}. That account cannot open the agent desk. Log out, then use the agent email.</p>
          <SignOut next="/agent/login" label="Log out" />
        </div>
      ) : null}
      <MagicLinkForm desk="agent" title="Agent sign in" blurb="We email a sign-in link. Nothing is printed here." />
    </main>
  );
}
