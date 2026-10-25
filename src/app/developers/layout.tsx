import type { Metadata } from "next";
import { withCanonical } from "../../lib/seo";

export const metadata: Metadata = withCanonical("/developers", {
  title: "Developers | Guyana Keys",
  description: "Tell us about your development and we'll be in touch about showing it to buyers here and abroad.",
});

export default function DevelopersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
