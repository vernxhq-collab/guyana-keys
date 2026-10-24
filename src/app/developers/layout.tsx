import type { Metadata } from "next";
import { withCanonical } from "../../lib/seo";

export const metadata: Metadata = withCanonical("/developers", {
  title: "Developers | Guyana Keys",
  description: "Tell the Guyana Keys team about a scheme before it is listed.",
});

export default function DevelopersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
