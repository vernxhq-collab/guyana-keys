import Link from "next/link";
import { ComingSoon } from "../../components/ComingSoon";
import { loadPublicAgents } from "../../lib/catalog";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const people = await loadPublicAgents();
  return (
    <main className="wrap section">
      <h1>Agents</h1>
      <p><Link href="/agents/apply">Apply to list a property</Link>. The free plan is up to 3 live listings.</p>
      {people.length === 0 ? (
        <ComingSoon heading="Agents coming soon" line="No agents are listed yet. New listings coming soon. Be first to see them." />
      ) : (
        <div className="grid">
          {people.map((agent) => (
            <Link className="card" key={agent.id} href={`/agents/${agent.id}`}>
              <div className="card-body">
                <strong>{agent.name}</strong>
                {agent.founding ? <p className="chip">Founding agent</p> : null}
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
