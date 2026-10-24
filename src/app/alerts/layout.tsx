import type { Metadata } from "next";
import { withCanonical } from "../../lib/seo";

export const metadata: Metadata = withCanonical("/alerts", {
  title: "Create alert | Guyana Keys",
  description: "Ask Guyana Keys to email you when a matching home is listed.",
});

export default function AlertsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
