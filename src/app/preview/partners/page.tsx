import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SampleIntro } from "../../../components/SampleIntro";
import { partnerSample } from "../../../lib/partner-sample";
import { previewEnabled } from "../../../lib/preview/http";
import { SAMPLE_LABEL } from "../../../lib/sample-label";
import { privateMeta } from "../../../lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = privateMeta("/preview/partners", "Partners preview | Guyana Keys", "Private sample of the partners page. Not a public page.");

export default function PreviewPartnersPage() {
  if (!previewEnabled()) notFound();
  return (
    <main className="wrap section">
      <p className="chip">{SAMPLE_LABEL}</p>
      <h1>Partners preview</h1>
      <p className="sub">These rows are samples. A real firm is listed only after it agrees, and none are seeded here.</p>
      <div className="grid">
        {partnerSample.map((partner) => (
          <article className="card" key={partner.id}>
            <div className="card-body">
              <p className="chip">{SAMPLE_LABEL}</p>
              <strong>{partner.name}</strong>
              <p className="meta">{partner.category} · {partner.area}</p>
              <p>{partner.note}</p>
              <SampleIntro />
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
