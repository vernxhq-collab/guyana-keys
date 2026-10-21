import { headers } from "next/headers";
import { DeskNav } from "../../../components/DeskNav";
import { SignOut } from "../../../components/SignOut";
import { readPreview } from "../../../lib/preview/http";
import { canUseAgentDesk, readSession } from "../../../lib/session";

const simulated = new Set(["/agent/compose", "/agent/outbox", "/agent/agency"]);

const items: [string, string][] = [["Today", "/agent"], ["Listings", "/agent/listings"], ["Leads", "/agent/leads"], ["Calendar", "/agent/calendar"], ["Plan", "/agent/plan"]];

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const preview = await readPreview();
  if (preview?.actor.kind === "agent") {
    return (
      <main className="wrap section desk agent-desk">
        <DeskNav label="Agent desk" name={`${preview.actor.name} · ${preview.actor.agency}`} items={items} signOut="/preview" />
        <p className="quiet desk-links"><a href="/agent/performance">Performance</a> · <a href="/agent/agency">Agency</a> · <a href="/agent/outbox">Outbox</a> · <a href="/agent/profile">Profile</a> · <a href="/agent/help">Help</a> · <a href="/preview">Test buyer</a></p>
        {children}
      </main>
    );
  }
  const path = (await headers()).get("x-gk-path") || "";
  if (simulated.has(path)) {
    return <main className="wrap section desk agent-desk">{children}</main>;
  }
  const session = await readSession();
  return (
    <main className="wrap section desk agent-desk">
      {!session ? (
        <>
          <h1>Agent desk</h1>
          <p>Sign in to open this desk.</p>
          <a className="btn" href="/agent/login">Sign in</a>
        </>
      ) : session.profile?.suspended ? (
        <div className="stack">
          <p>This account is suspended.</p>
          <SignOut next="/agent/login" label="Log out" />
        </div>
      ) : !canUseAgentDesk(session.profile, session.user.email) ? (
        <div className="stack">
          <p>This desk is for agents.</p>
          <p className="quiet">Signed in as {session.user.email}. Sign out, then use the agent email.</p>
          <a className="btn" href="/agent/login">Agent sign in</a>
          <SignOut next="/agent/login" label="Log out" />
        </div>
      ) : (
        <>
          <DeskNav label="Agent desk" name={session.profile?.name || "Agent"} items={items} signOut="/agent/login" />
          <p className="quiet desk-links"><a href="/agent/profile">Profile</a> · <a href="/agent/help">Help</a></p>
          {children}
        </>
      )}
    </main>
  );
}
