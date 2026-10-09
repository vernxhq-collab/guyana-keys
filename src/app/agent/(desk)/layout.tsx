import { DeskNav } from "../../../components/DeskNav";
import { SessionCatcher } from "../../../components/SessionCatcher";
import { readSession } from "../../../lib/session";

const items: [string, string][] = [["Home", "/agent"], ["Listings", "/agent/listings"], ["Leads", "/agent/leads"], ["Plan", "/agent/plan"], ["Help", "/agent/help"], ["Profile", "/agent/profile"]];

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const session = await readSession();
  return (
    <main className="wrap section desk">
      <SessionCatcher desk="agent" />
      {!session ? (
        <>
          <h1>Agent desk</h1>
          <p>Sign in to open this desk.</p>
          <a className="btn" href="/agent/login">Sign in</a>
        </>
      ) : session.profile?.suspended ? (
        <p>This account is suspended.</p>
      ) : session.profile?.role !== "agent" ? (
        <p>This desk is for agents.</p>
      ) : (
        <>
          <DeskNav label="Agent desk" name="Agent" items={items} />
          {children}
        </>
      )}
    </main>
  );
}
