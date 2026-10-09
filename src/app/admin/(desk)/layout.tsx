import { DeskNav } from "../../../components/DeskNav";
import { SessionCatcher } from "../../../components/SessionCatcher";
import { isAdminEmail, readSession } from "../../../lib/session";

const items: [string, string][] = [["Home", "/admin"], ["People", "/admin/people"], ["Listings", "/admin/listings"], ["Requests", "/admin/requests"], ["Inbox", "/admin/inbox"]];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await readSession();
  const allowed = session?.profile?.role === "admin" && isAdminEmail(session.user.email);
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
        <p>This desk is for the Guyana Keys admin.</p>
      ) : (
        <>
          <DeskNav label="Admin desk" name="Admin" items={items} />
          {children}
        </>
      )}
    </main>
  );
}
