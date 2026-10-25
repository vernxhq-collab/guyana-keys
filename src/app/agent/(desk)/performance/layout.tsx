import type { Metadata } from "next";
import { privateMeta } from "../../../../lib/seo";

export const metadata: Metadata = privateMeta("/agent/performance", "Performance | Guyana Keys", "Private performance on the agent desk. Sign in required.");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
