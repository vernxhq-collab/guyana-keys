import type { Metadata } from "next";
import { privateMeta } from "../../lib/seo";

export const metadata: Metadata = privateMeta("/scan", "Keys Check on your phone | Guyana Keys", "A short-lived link for a Keys Check photo. Not a public page.");

export default function ScanLayout({ children }: { children: React.ReactNode }) {
  return <main className="wrap section desk">{children}</main>;
}
