import Link from "next/link";
import { loadCatalog, publicAgent } from "../../lib/catalog";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const catalog = await loadCatalog();
  const ids = [...new Set(catalog.listings.map((item) => item.agentId).filter(Boolean))];
  const people = (await Promise.all(ids.map((id) => publicAgent(id)))).filter((agent) => agent !== null);
  return (
    <main className="wrap section">
      <h1>Agents</h1>
      {people.length === 0 ? <p>No agent with a live listing yet.</p> : (
        <div className="grid">
          {people.map((agent) => (
            <Link className="card" key={agent.id} href={`/agents/${agent.id}`}>
              <div className="card-body">
                <strong>{agent.name}</strong>
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
