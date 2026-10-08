import { NextResponse } from "next/server";
import { agentHome, agentLead, agentLeadList, agentListing, agentListings, agentPlan, createRequest, deleteListing, duplicateListing, hideListing, saveAgentProfile, saveListing, updateLead } from "../../../lib/agent-data";
import { readSession } from "../../../lib/session";

async function agent() {
  const session = await readSession();
  if (!session) return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  if (!session.profile || session.profile.role !== "agent") return { error: NextResponse.json({ error: "This desk is for agents." }, { status: 403 }) };
  if (session.profile.suspended) return { error: NextResponse.json({ error: "This account is suspended." }, { status: 403 }) };
  return { profile: session.profile };
}

export async function GET(request: Request) {
  const gate = await agent();
  if ("error" in gate) return gate.error;
  const part = new URL(request.url).searchParams.get("part") || "home";
  const id = new URL(request.url).searchParams.get("id") || "";
  if (part === "home") return NextResponse.json(await agentHome(gate.profile));
  if (part === "listings") return NextResponse.json(await agentListings(gate.profile));
  if (part === "listing") return NextResponse.json(await agentListing(gate.profile, id || "new"));
  if (part === "leads") return NextResponse.json(await agentLeadList(gate.profile));
  if (part === "lead") return NextResponse.json(await agentLead(gate.profile, id));
  if (part === "plan") return NextResponse.json(await agentPlan(gate.profile));
  if (part === "profile") {
    return NextResponse.json({
      profile: { name: gate.profile.name, email: gate.profile.email, phone: gate.profile.phone, company: gate.profile.company, areas: gate.profile.areas, photoUrl: gate.profile.photoUrl },
    });
  }
  return NextResponse.json({ error: "Unknown view." }, { status: 400 });
}

export async function POST(request: Request) {
  const gate = await agent();
  if ("error" in gate) return gate.error;
  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "");
  let result: { error?: string; id?: string; ok?: boolean; live?: number; cap?: number } = { error: "Unknown action." };
  if (action === "saveListing") result = await saveListing(gate.profile, body);
  else if (action === "duplicate") result = await duplicateListing(gate.profile, String(body.id || ""));
  else if (action === "hide") result = await hideListing(gate.profile, String(body.id || ""));
  else if (action === "delete") result = await deleteListing(gate.profile, String(body.id || ""));
  else if (action === "lead") result = await updateLead(gate.profile, body);
  else if (action === "request") result = await createRequest(gate.profile, body);
  else if (action === "profile") result = await saveAgentProfile(gate.profile, body);
  if (result.error === "cap") return NextResponse.json({ error: "Publishing another live listing is blocked.", live: result.live, cap: result.cap }, { status: 403 });
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
