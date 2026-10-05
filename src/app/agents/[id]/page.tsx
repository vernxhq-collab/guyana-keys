import { agents, listings } from "../../../lib/data";
import Link from "next/link";

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = agents.find((item) => item.id === id);
  if (!agent) return <main className="wrap"><h1>Agent not found</h1></main>;
  const own = listings.filter((item) => item.agentId === agent.id);
  const wa = `https://wa.me/${agent.phone}?text=${encodeURIComponent("Hello " + agent.name + ", I found you on Guyana Keys.")}`;
  return (
    <main className="wrap">
      <h1>{agent.name}</h1>
      <p>{agent.company} · {agent.areas.join(", ")}</p>
      <a href={wa}>WhatsApp {agent.name}</a>
      {own.map((item) => <p key={item.id}><Link href={`/listings/${item.id}`}>{item.title}</Link></p>)}
    </main>
  );
}
