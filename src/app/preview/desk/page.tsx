import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PreviewMarketDesk } from "../../../components/PreviewMarketDesk";
import { previewEnabled } from "../../../lib/preview/http";
import { privateMeta } from "../../../lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = privateMeta("/preview/desk", "Desk preview | Guyana Keys", "Private sample of the agent desk. Not a public page.");

export default function PreviewDeskPage() {
  if (!previewEnabled()) notFound();
  return <PreviewMarketDesk />;
}
