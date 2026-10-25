import type { Metadata } from "next";
import { privateMeta } from "../../../../../lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return privateMeta(`/admin/requests/${id}`, `Request ${id} | Guyana Keys`, `Private request ${id}. Sign in required.`);
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
