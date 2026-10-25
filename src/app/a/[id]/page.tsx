import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { privateMeta } from "../../../lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return privateMeta(`/a/${id}`, `Agent ${id} | Guyana Keys`, `This address continues to the public agent page for ${id}.`);
}

export default async function AgentTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/agents/${id}`);
}
