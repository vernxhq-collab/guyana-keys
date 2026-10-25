import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { privateMeta } from "../../lib/seo";

export const metadata: Metadata = privateMeta("/pro", "Continue to agent sign in | Guyana Keys", "This address continues to agent sign in.");

export default function ProPage() {
  redirect("/agent/login");
}
