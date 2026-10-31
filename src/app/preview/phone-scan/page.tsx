import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PhoneScan } from "../../../components/PhoneScan";
import { ID_CONSENT_VERSION } from "../../../lib/compliance/retention";
import { previewEnabled } from "../../../lib/preview/http";
import { privateMeta } from "../../../lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = privateMeta("/preview/phone-scan", "Phone scan preview | Guyana Keys", "Private sample of the phone scan. Not a public page.");

export default async function PreviewPhoneScanPage({ searchParams }: { searchParams: Promise<{ step?: string }> }) {
  if (!previewEnabled()) notFound();
  const step = (await searchParams).step;
  const initialStep = step === "id" || step === "photo" || step === "review" ? step : "details";
  return (
    <main className="wrap section desk">
      <PhoneScan sample initialStep={initialStep} consentVersion={ID_CONSENT_VERSION} />
    </main>
  );
}
