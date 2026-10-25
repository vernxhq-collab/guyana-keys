import type { Metadata } from "next";
import { privateMeta } from "../../lib/seo";

export const metadata: Metadata = privateMeta("/preview", "Preview | Guyana Keys", "Private preview. Not a public page.");

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
