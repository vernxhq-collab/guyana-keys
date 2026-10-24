import type { Metadata } from "next";
import Link from "next/link";
import { ListingCard } from "../../../components/ListingCard";
import { loadCatalog, publicAgent } from "../../../lib/catalog";
import { withCanonical } from "../../../lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const agent = await publicAgent(id);
  return withCanonical(`/agents/${id}`, {
    title: agent ? `${agent.name} | Guyana Keys` : "Agent | Guyana Keys",
    description: agent ? `${agent.name} lists property on Guyana Keys.` : "This person is not listed on Guyana Keys.",
  });
}

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = await publicAgent(id);
  if (!agent) return <main className="wrap section"><h1>Agent not found</h1><p>This person is not listed on Guyana Keys.</p><p><Link href="/agents">All agents</Link> · <Link href="/advertise">List your property</Link></p></main>;
  const { listings } = await loadCatalog();
  const own = listings.filter((item) => item.agentId === agent.id);
  return (
    <main className="wrap section">
      <p className="chip">Listed on Guyana Keys</p>
      {agent.checkBadge ? <p>{agent.checkBadge}</p> : null}
      <h1>{agent.name}</h1>
      <p>{[agent.company, agent.address, agent.areas.join(", ")].filter(Boolean).join(" · ")}</p>
      {agent.checkBadge ? null : <p className="meta">Guyana Keys has not published a check for this agent yet.</p>}
      {own.length === 0 ? <p>No live listing yet.</p> : <div className="grid">{own.map((item) => <ListingCard key={item.id} listing={item} />)}</div>}
      <p className="meta"><Link href="/agents">All agents</Link></p>
    </main>
  );
}
