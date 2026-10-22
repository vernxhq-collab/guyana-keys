import Link from "next/link";
import { loadPublicAgents } from "../../lib/catalog";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const people = await loadPublicAgents();
  return (
    <main className="wrap section">
      <h1>Agents</h1>
      <p><Link href="/agents/apply">Apply to list a property</Link>. Free to list, no limits.</p>
      {people.length === 0 ? (
        <div className="empty-board solo">
          <div className="empty-copy">
            <h2>No agents listed yet</h2>
            <p>Are you an agent? Join Guyana Keys.</p>
            <Link className="btn" href="/advertise">For agents</Link>
          </div>
        </div>
      ) : (
        <div className="grid">
          {people.map((agent) => (
            <Link className="card" key={agent.id} href={`/agents/${agent.id}`}>
              <div className="card-body">
                <strong>{agent.name}</strong>
                {agent.founding ? <p className="chip">Founding agent</p> : null}
                {agent.checkBadge ? <p className="meta">{agent.checkBadge}</p> : null}
                <p className="meta">{[agent.company, agent.areas.join(", ")].filter(Boolean).join(" · ")}</p>
                <span className="btn ghost">View agent</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
