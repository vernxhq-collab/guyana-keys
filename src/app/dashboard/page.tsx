"use client";
import { useState } from "react";
const stages = ["new", "contacted", "viewing", "offer", "closed"] as const;
export default function DashboardPage() {
  const [leads, setLeads] = useState([{ id: "1", name: "Sample buyer", stage: "new", note: "Asked about Bel Air" }]);
  return (
    <main className="wrap">
      <h1>Agent dashboard</h1>
      <p>Free tier is 3 live listings. Featured is the paid placement.</p>
      {stages.map((stage) => (
        <section key={stage}>
          <h2>{stage}</h2>
          {leads.filter((lead) => lead.stage === stage).map((lead) => (
            <p key={lead.id}>{lead.name} · {lead.note}
              <select value={lead.stage} onChange={(e) => setLeads(leads.map((item) => item.id === lead.id ? { ...item, stage: e.target.value } : item))}>
                {stages.map((item) => <option key={item}>{item}</option>)}
              </select>
            </p>
          ))}
        </section>
      ))}
    </main>
  );
}
