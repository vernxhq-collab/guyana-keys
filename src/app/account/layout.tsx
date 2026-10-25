import type { Metadata } from "next";
import { privateMeta } from "../../lib/seo";

export const metadata: Metadata = privateMeta("/account", "Sign in | Guyana Keys", "Sign in to Guyana Keys, or open the homes you saved.");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
