import Link from "next/link";
import { agents } from "../../lib/data";

export default function AgentsPage() {
  return (
    <main className="wrap">
      <h1>Verified agents</h1>
      {agents.map((agent) => (
        <p key={agent.id}>
          <Link href={`/agents/${agent.id}`}>{agent.name}</Link>
          {" · "}{agent.company}{" · "}{agent.areas.join(", ")}
        </p>
      ))}
    </main>
  );
}
