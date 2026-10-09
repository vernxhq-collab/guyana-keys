import { NextResponse } from "next/server";
import { runAssist } from "../../../lib/assist";
import { isAdminEmail, readSession } from "../../../lib/session";

const tasks = ["buyer-search", "listing-draft", "price-hint", "reply-draft", "lead-score", "admin-summary"] as const;

export async function POST(request: Request) {
  const session = await readSession();
  if (!session?.profile) return NextResponse.json({ error: "AI is not available, continue manually." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "AI is not available, continue manually." }, { status: 400 });
  const task = String((body as { task?: string }).task || "");
  if (!tasks.includes(task as (typeof tasks)[number])) return NextResponse.json({ error: "AI is not available, continue manually." }, { status: 400 });
  const role = session.profile.role;
  const allowed =
    (task === "buyer-search" && role === "buyer") ||
    ((task === "listing-draft" || task === "price-hint" || task === "reply-draft" || task === "lead-score") && role === "agent" && !session.profile.suspended) ||
    (task === "admin-summary" && role === "admin" && isAdminEmail(session.user.email));
  if (!allowed) return NextResponse.json({ error: "AI is not available, continue manually." }, { status: 403 });
  try {
    return NextResponse.json(runAssist(task, body as Record<string, unknown>));
  } catch {
    return NextResponse.json({ error: "AI is not available, continue manually." }, { status: 503 });
  }
}
