import type { Metadata } from "next";
import { privateMeta } from "../../../../lib/seo";

export const metadata: Metadata = privateMeta("/admin/licences", "Licences | Guyana Keys", "Private licence review on the admin desk. Sign in required.");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
