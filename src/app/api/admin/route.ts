import { NextResponse } from "next/server";
import { adminFeature, adminHide, adminHome, adminInbox, adminLead, adminListings, adminPeople, adminRequest, adminRequests, markPaid, saveInstructions, setCap, setPlan, suspendAgent, unsuspendAgent } from "../../../lib/admin-data";
import { isAdminEmail, readSession } from "../../../lib/session";

async function admin() {
  const session = await readSession();
  if (!session) return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  if (!session.profile || session.profile.role !== "admin" || !isAdminEmail(session.user.email)) {
    return { error: NextResponse.json({ error: "This desk is for the Guyana Keys admin." }, { status: 403 }) };
  }
  return { profile: session.profile };
}

export async function GET(request: Request) {
  const gate = await admin();
  if ("error" in gate) return gate.error;
  const url = new URL(request.url);
  const part = url.searchParams.get("part") || "home";
  const id = url.searchParams.get("id") || "";
  if (part === "home") return NextResponse.json(await adminHome());
  const q = url.searchParams.get("q") || "";
  if (part === "people") return NextResponse.json(await adminPeople(q));
  if (part === "listings") return NextResponse.json(await adminListings(q));
  if (part === "requests") return NextResponse.json(await adminRequests());
  if (part === "request") return NextResponse.json(await adminRequest(id));
  if (part === "inbox") return NextResponse.json(await adminInbox(q));
  if (part === "lead") return NextResponse.json(await adminLead(id));
  return NextResponse.json({ error: "Unknown view." }, { status: 400 });
}

export async function POST(request: Request) {
  const gate = await admin();
  if ("error" in gate) return gate.error;
  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "");
  let result: { error?: string; ok?: boolean } = { error: "Unknown action." };
  if (action === "instructions") result = await saveInstructions(String(body.id || ""), String(body.instructions || ""));
  else if (action === "paid") result = await markPaid(String(body.id || ""));
  else if (action === "cap") result = await setCap(String(body.agentId || ""), Number(body.cap));
  else if (action === "plan") result = await setPlan(String(body.agentId || ""), String(body.plan || ""));
  else if (action === "suspend") result = await suspendAgent(String(body.agentId || ""));
  else if (action === "unsuspend") result = await unsuspendAgent(String(body.agentId || ""));
  else if (action === "hide") result = await adminHide(String(body.propertyId || ""));
  else if (action === "feature") result = await adminFeature(String(body.propertyId || ""), true);
  else if (action === "unfeature") result = await adminFeature(String(body.propertyId || ""), false);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
