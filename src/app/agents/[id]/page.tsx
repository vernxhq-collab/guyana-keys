import Link from "next/link";
import { loadCatalog, publicAgent } from "../../../lib/catalog";

export const dynamic = "force-dynamic";

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = await publicAgent(id);
  if (!agent) return <main className="wrap"><h1>Agent not found</h1></main>;
  const { listings } = await loadCatalog();
  const own = listings.filter((item) => item.agentId === agent.id);
  return (
    <main className="wrap">
      <p className="chip">Listed on Guyana Keys</p>
      <h1>{agent.name}</h1>
      <p>{[agent.company, agent.address, agent.areas.join(", ")].filter(Boolean).join(" · ")}</p>
      {own.map((item) => <p key={item.id}><Link href={`/listings/${item.id}`}>{item.title}</Link></p>)}
    </main>
  );
}
