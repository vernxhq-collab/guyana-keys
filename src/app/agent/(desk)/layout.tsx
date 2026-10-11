import { DeskNav } from "../../../components/DeskNav";
import { SessionCatcher } from "../../../components/SessionCatcher";
import { SignOut } from "../../../components/SignOut";
import { isAdminEmail, readSession } from "../../../lib/session";

const items: [string, string][] = [["Home", "/agent"], ["Listings", "/agent/listings"], ["Leads", "/agent/leads"], ["Plan", "/agent/plan"], ["Help", "/agent/help"], ["Profile", "/agent/profile"]];

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const session = await readSession();
  return (
    <main className="wrap section desk agent-desk">
      <SessionCatcher desk="agent" />
      {!session ? (
        <>
          <h1>Agent desk</h1>
          <p>Sign in to open this desk.</p>
          <a className="btn" href="/agent/login">Sign in</a>
        </>
      ) : session.profile?.suspended ? (
        <div className="stack">
          <p>This account is suspended.</p>
          <SignOut next="/agent/login" />
        </div>
      ) : session.profile?.role !== "agent" ? (
        <div className="stack">
          <p>This desk is for agents.</p>
          <p className="quiet">Signed in as {session.user.email}. {isAdminEmail(session.user.email) ? "That address opens the admin desk. Use a different email for this desk." : "Sign out, then use the agent email."}</p>
          <a className="btn" href="/agent/login">Agent sign in</a>
          <SignOut next="/agent/login" />
        </div>
      ) : (
        <>
          <DeskNav label="Agent desk" name="Agent" items={items} />
          {children}
        </>
      )}
    </main>
  );
}
