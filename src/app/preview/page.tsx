import { notFound } from "next/navigation";
import { PreviewDesk } from "../../components/PreviewDesk";
import { previewEnabled } from "../../lib/preview/http";

export const dynamic = "force-dynamic";

export default function PreviewPage() {
  if (!previewEnabled()) notFound();
  return <PreviewDesk />;
}
