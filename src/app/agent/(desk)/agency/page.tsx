import type { Metadata } from "next";
import { AgencyDesk } from "../../../../components/AgencyDesk";
import { PreviewOnly } from "../../../../components/PreviewOnly";
import { privateMeta } from "../../../../lib/seo";

export const metadata: Metadata = privateMeta("/agent/agency", "Agency | Guyana Keys", "Private agency page on the agent desk. Sign in required.");

export default function AgencyPage() {
  return <PreviewOnly><AgencyDesk /></PreviewOnly>;
}
