import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PreviewMarketDesk } from "../../../components/PreviewMarketDesk";
import { previewEnabled } from "../../../lib/preview/http";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Desk preview", robots: { index: false, follow: false } };

export default function PreviewDeskPage() {
  if (!previewEnabled()) notFound();
  return <PreviewMarketDesk />;
}
