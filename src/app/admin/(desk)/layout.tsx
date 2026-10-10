import { DeskNav } from "../../../components/DeskNav";
import { SessionCatcher } from "../../../components/SessionCatcher";
import { SignOut } from "../../../components/SignOut";
import { grantAdmin, isAdminEmail, readSession } from "../../../lib/session";

const items: [string, string][] = [["Home", "/admin"], ["People", "/admin/people"], ["Listings", "/admin/listings"], ["Requests", "/admin/requests"], ["Inbox", "/admin/inbox"]];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await readSession();
  const profile = session && isAdminEmail(session.user.email) && session.profile?.role !== "admin"
    ? await grantAdmin(session.user)
    : session?.profile;
  const allowed = profile?.role === "admin" && Boolean(session && isAdminEmail(session.user.email));
  return (
    <main className="wrap section desk">
      <SessionCatcher desk="admin" />
      {!session ? (
        <>
          <h1>Admin desk</h1>
          <p>Sign in to open this desk.</p>
          <a className="btn" href="/admin/login">Sign in</a>
        </>
      ) : !allowed ? (
        <div className="stack">
          <p>This desk is for the Guyana Keys admin.</p>
          {session?.user.email ? <p className="quiet">Signed in as {session.user.email}.</p> : null}
          <a className="btn" href="/admin/login">Admin sign in</a>
          {session ? <SignOut next="/admin/login" /> : null}
        </div>
      ) : (
        <>
          <DeskNav label="Admin desk" name="Admin" items={items} />
          {children}
        </>
      )}
    </main>
  );
}
