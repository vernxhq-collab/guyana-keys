import type { Metadata } from "next";
import { privateMeta } from "../../../../lib/seo";

export const metadata: Metadata = privateMeta("/admin/keys-check", "Keys Check review | Guyana Keys", "Private Keys Check review on the admin desk. Sign in required.");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
