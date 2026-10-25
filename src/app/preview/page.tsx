import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { privateMeta } from "../../lib/seo";

export const metadata: Metadata = privateMeta("/preview", "Preview | Guyana Keys", "Private preview entry. Not a public page.");
import { PreviewDesk } from "../../components/PreviewDesk";
import { previewEnabled } from "../../lib/preview/http";

export const dynamic = "force-dynamic";

export default function PreviewPage() {
  if (!previewEnabled()) notFound();
  return <PreviewDesk />;
}
