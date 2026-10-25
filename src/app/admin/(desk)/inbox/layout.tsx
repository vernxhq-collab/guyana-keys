import type { Metadata } from "next";
import { privateMeta } from "../../../../lib/seo";

export const metadata: Metadata = privateMeta("/admin/inbox", "Inbox | Guyana Keys", "Private inbox on the admin desk. Sign in required.");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
