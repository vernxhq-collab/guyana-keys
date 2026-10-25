import type { Metadata } from "next";
import { OutboxDesk } from "../../../../components/OutboxDesk";
import { PreviewOnly } from "../../../../components/PreviewOnly";
import { privateMeta } from "../../../../lib/seo";

export const metadata: Metadata = privateMeta("/agent/outbox", "Outbox | Guyana Keys", "Private outbox on the agent desk. Sign in required.");

export default function OutboxPage() {
  return <PreviewOnly><OutboxDesk /></PreviewOnly>;
}
