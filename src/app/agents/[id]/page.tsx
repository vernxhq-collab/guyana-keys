import Link from "next/link";
import { ListingCard } from "../../../components/ListingCard";
import { loadCatalog, publicAgent } from "../../../lib/catalog";

export const dynamic = "force-dynamic";

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = await publicAgent(id);
  if (!agent) return <main className="wrap"><h1>Agent not found</h1></main>;
  const { listings } = await loadCatalog();
  const own = listings.filter((item) => item.agentId === agent.id);
  return (
    <main className="wrap section">
      <p className="chip">Listed on Guyana Keys</p>
      {agent.verified ? <p className="chip">Verified on Guyana Keys</p> : null}
      <h1>{agent.name}</h1>
      <p>{[agent.company, agent.address, agent.areas.join(", ")].filter(Boolean).join(" · ")}</p>
      {agent.graLicence ? <p>GRA licence {agent.graLicence}</p> : null}
      {agent.verified ? <p className="meta">The admin confirmed this agent on Guyana Keys. A badge is not proof of a GRA licence.</p> : <p className="meta">Ask this agent for a GRA licence if you need one. The verified badge appears only after the admin confirms it.</p>}
      {own.length === 0 ? <p>No live listing yet.</p> : <div className="grid">{own.map((item) => <ListingCard key={item.id} listing={item} />)}</div>}
      <p className="meta"><Link href="/agents">All agents</Link></p>
    </main>
  );
}
