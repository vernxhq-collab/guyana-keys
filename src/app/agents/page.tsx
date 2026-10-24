import type { Metadata } from "next";
import Link from "next/link";
import { PrelaunchBoard } from "../../components/PrelaunchBoard";
import { loadPublicAgents } from "../../lib/catalog";
import { withCanonical } from "../../lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = withCanonical("/agents", {
  title: "Agents | Guyana Keys",
  description: "Apply to list property in Guyana. Free to list, no limits.",
});

export default async function AgentsPage() {
  const people = await loadPublicAgents();
  return (
    <main className="wrap section">
      <h1>Agents</h1>
      <p><Link href="/agents/apply">Apply to list a property</Link>. Free to list, no limits.</p>
      {people.length === 0 ? <PrelaunchBoard kind="agents" /> : (
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
