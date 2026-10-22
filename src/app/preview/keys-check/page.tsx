import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KeysCapture } from "../../../components/KeysCapture";
import { ID_CONSENT_VERSION } from "../../../lib/compliance/retention";
import { previewEnabled } from "../../../lib/preview/http";
import { SAMPLE_LABEL } from "../../../lib/sample-label";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Keys Check preview", robots: { index: false, follow: false } };

export default function PreviewKeysCheckPage() {
  if (!previewEnabled()) notFound();
  return (
    <main className="wrap section">
      <p className="chip">{SAMPLE_LABEL}</p>
      <h1>Keys Check preview</h1>
      <p className="sub">This form does not store a file, a code, or a decision. There is no sample ID image.</p>
      <KeysCapture sample consentVersion={ID_CONSENT_VERSION} documents={[]} keysCheck={null} flags={[]} />
      <section className="stack">
        <h2>Reviewer layout</h2>
        <p className="quiet">Empty boxes only. A real review opens private files for 60 seconds after an audit row. This preview does not.</p>
        <div className="keys-grid">
          {["ID photo", "Selfie with ID", "Code photo", "Licence"].map((label) => (
            <figure className="panel" key={label}>
              <figcaption>{label}</figcaption>
              <p>{SAMPLE_LABEL}</p>
            </figure>
          ))}
        </div>
        <p>Saving notes does not approve the check. No software compares the faces.</p>
      </section>
    </main>
  );
}
