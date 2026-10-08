import Link from "next/link";
import { loadCatalog, publicAgent } from "../../../lib/catalog";
import { digits } from "../../../lib/labels";

export const dynamic = "force-dynamic";

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = await publicAgent(id);
  if (!agent) return <main className="wrap"><h1>Agent not found</h1></main>;
  const { listings } = await loadCatalog();
  const own = listings.filter((item) => item.agentId === agent.id);
  const wa = agent.phone ? `https://wa.me/${digits(agent.phone)}?text=${encodeURIComponent("Hello " + agent.name + ", I found you on Guyana Keys.")}` : "";
  return (
    <main className="wrap">
      <h1>{agent.name}</h1>
      <p>{agent.company}{agent.areas.length ? ` · ${agent.areas.join(", ")}` : ""}</p>
      {wa ? <a href={wa}>WhatsApp {agent.name}</a> : null}
      {own.map((item) => <p key={item.id}><Link href={`/listings/${item.id}`}>{item.title}</Link></p>)}
    </main>
  );
}
