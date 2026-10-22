import Link from "next/link";
import { SAMPLE_LABEL } from "../lib/sample-label";

const stages = ["Lead", "Contacted", "Viewing", "Offer", "Closed"];

export function PreviewMarketDesk() {
  return (
    <main className="market desk-preview">
      <p className="market-banner">{SAMPLE_LABEL}. Nothing here is saved, and nothing is sent.</p>
      <div className="wrap market-section">
        <p className="market-kicker">Agent desk preview</p>
        <div className="desk-preview-head">
          <h1>Today</h1>
          <Link className="btn" href="/agent/listings/new">Add a listing</Link>
        </div>
        <div className="desk-preview-stats">
          <article><span>New enquiries</span><strong>—</strong><p>From your inbox, after sign-in.</p></article>
          <article><span>Follow-ups due</span><strong>—</strong><p>Tasks you have not closed.</p></article>
          <article><span>Viewings</span><strong>—</strong><p>Times the agent has set.</p></article>
        </div>
        <h2>Pipeline</h2>
        <ol className="desk-pipeline">
          {stages.map((stage, index) => <li key={stage} className={index === 0 ? "on" : ""}>{stage}</li>)}
        </ol>
        <div className="desk-preview-grid">
          <section className="market-panel">
            <h2>My listings</h2>
            <p className="market-sample">{SAMPLE_LABEL}</p>
            <p><strong>Sample house</strong></p>
            <p className="meta">Hidden · photos missing</p>
            <p className="market-warn">Add at least 3 landscape photos before this can go live. No watermarks and no other agency logo.</p>
          </section>
          <section className="market-panel">
            <h2>Enquiry inbox</h2>
            <p className="market-sample">{SAMPLE_LABEL}</p>
            <p><strong>Sample buyer</strong> asked about the sample house.</p>
            <label className="desk-draft">AI reply draft
              <textarea readOnly value="Draft only. A person must send this. Nothing is sent from this preview." />
            </label>
            <p className="meta">Status: draft. Approve, then send. The preview cannot send.</p>
          </section>
          <section className="market-panel">
            <h2>Performance</h2>
            <p>Sample figures are not shown. This card is not a report. Live counts appear on the signed-in desk from your own listings and enquiries.</p>
            <p className="meta">Enquiries per live listing · not tracked in this preview</p>
          </section>
        </div>
      </div>
    </main>
  );
}
