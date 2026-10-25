import type { Metadata } from "next";
import { ComposeDesk } from "../../../../components/ComposeDesk";
import { PreviewOnly } from "../../../../components/PreviewOnly";
import { privateMeta } from "../../../../lib/seo";

export const metadata: Metadata = privateMeta("/agent/compose", "Compose | Guyana Keys", "Private compose page on the agent desk. Sign in required.");

export default function ComposePage() {
  return <PreviewOnly><ComposeDesk /></PreviewOnly>;
}
