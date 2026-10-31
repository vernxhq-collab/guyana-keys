import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckOutcome } from "../../../components/CheckOutcome";
import { ReviewDesk } from "../../../components/ReviewDesk";
import { checkBadge } from "../../../lib/licences";
import { sampleDesk, sampleOutcomes } from "../../../lib/level-sample";
import { previewEnabled } from "../../../lib/preview/http";
import { SAMPLE_LABEL } from "../../../lib/sample-label";
import { privateMeta } from "../../../lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = privateMeta("/preview/levels", "Level review preview | Guyana Keys", "Private sample of the review desk. Not a public page.");

const views = ["queue", "detail", "licence", "more-info", "id-reviewed", "licence-check", "paused", "support", "badge"] as const;

export default async function PreviewLevelsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  if (!previewEnabled()) notFound();
  const view = (await searchParams).view || "";
  const known = (views as readonly string[]).includes(view);
  return (
    <main className={view === "badge" ? "wrap section" : "wrap section desk"}>
      <p className="chip">{SAMPLE_LABEL}</p>
      {!known ? (
        <div className="stack">
          <h1>Level review preview</h1>
          <p>Sample names only. Nothing here is a real person, and nothing is saved.</p>
          <ul>
            {views.map((item) => <li key={item}><a href={`/preview/levels?view=${item}`}>{item}</a></li>)}
          </ul>
        </div>
      ) : null}
      {view === "queue" ? <ReviewDesk initial={sampleDesk} sample focus="queue" /> : null}
      {view === "detail" ? <ReviewDesk initial={sampleDesk} sample focus="detail" /> : null}
      {view === "licence" ? <ReviewDesk initial={sampleDesk} sample focus="licence" /> : null}
      {view === "more-info" || view === "id-reviewed" || view === "licence-check" || view === "paused" || view === "support" ? (
        <CheckOutcome outcome={sampleOutcomes[view]} solo />
      ) : null}
      {view === "badge" ? (
        <section className="stack">
          <p className="chip">Listed on Guyana Keys</p>
          <p>{checkBadge({ level: "licensed_agent", state: "active", badgeMonth: "Oct 2026", licences: [], today: "2026-10-31" })}</p>
          <h1>Sample Agent</h1>
          <p>Sample office · Georgetown</p>
        </section>
      ) : null}
    </main>
  );
}
