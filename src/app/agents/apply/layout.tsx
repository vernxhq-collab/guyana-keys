import type { Metadata } from "next";
import { withCanonical } from "../../../lib/seo";

export const metadata: Metadata = withCanonical("/agents/apply", {
  title: "Apply to list | Guyana Keys",
  description: "Apply to list property on Guyana Keys. Free to list, no limits.",
});

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
