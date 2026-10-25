import type { Metadata } from "next";
import { privateMeta } from "../../../../lib/seo";

export const metadata: Metadata = privateMeta("/agent/checks", "Checks | Guyana Keys", "Private checks on the agent desk. Sign in required.");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
