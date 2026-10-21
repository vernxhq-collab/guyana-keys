import { NextResponse } from "next/server";
import { agentCalendar, agentHome, agentLead, agentLeadList, agentListing, agentListings, agentPlan, createRequest, deleteListing, duplicateListing, hideListing, saveAgentProfile, saveListing, updateLead } from "../../../lib/agent-data";
import { encodeWorld, readPreview, WORLD_COOKIE } from "../../../lib/preview/http";
import { previewGet, previewPost } from "../../../lib/preview/handle";
import type { World } from "../../../lib/preview/world";
import { canUseAgentDesk, readSession } from "../../../lib/session";

function withWorld(body: unknown, status: number, world?: World) {
  const response = NextResponse.json(body, { status });
  if (world) {
    response.cookies.set(WORLD_COOKIE, encodeWorld(world), { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.VERCEL_ENV === "preview", maxAge: 60 * 60 * 24 * 7 });
  }
  return response;
}

async function agent() {
  const session = await readSession();
  if (!session) return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  if (!session.profile || !canUseAgentDesk(session.profile, session.user.email)) {
    return { error: NextResponse.json({ error: session?.profile?.suspended ? "This account is suspended." : "This desk is for agents." }, { status: 403 }) };
  }
  return { profile: session.profile };
}

export async function GET(request: Request) {
  const preview = await readPreview();
  if (preview) {
    const url = new URL(request.url);
    const result = previewGet(preview.world, preview.actor, url.searchParams.get("part") || "home", url.searchParams.get("id") || "");
    return NextResponse.json(result.body, { status: result.status });
  }
  const gate = await agent();
  if ("error" in gate) return gate.error;
  const part = new URL(request.url).searchParams.get("part") || "home";
  const id = new URL(request.url).searchParams.get("id") || "";
  if (part === "home") return NextResponse.json(await agentHome(gate.profile));
  if (part === "listings") return NextResponse.json(await agentListings(gate.profile));
  if (part === "listing") return NextResponse.json(await agentListing(gate.profile, id || "new"));
  if (part === "leads") return NextResponse.json(await agentLeadList(gate.profile));
  if (part === "lead") return NextResponse.json(await agentLead(gate.profile, id));
  if (part === "calendar") return NextResponse.json(await agentCalendar(gate.profile));
  if (part === "performance") {
    const data = await agentListings(gate.profile);
    return NextResponse.json({ rows: data.listings.map((listing) => ({ id: listing.id, title: listing.title, status: listing.status || "hidden", views: 0, saves: 0, enquiries: listing.enquiries })) });
  }
  if (part === "agency") {
    const data = await agentListings(gate.profile);
    return NextResponse.json({ agency: gate.profile.company || "Your agency", people: [{ id: gate.profile.id, name: gate.profile.name || "Agent", live: data.live, open: 0 }], held: 0 });
  }
  if (part === "outbox") return NextResponse.json({ messages: [] });
  if (part === "plan") return NextResponse.json(await agentPlan(gate.profile));
  if (part === "profile") {
    return NextResponse.json({
      profile: { id: gate.profile.id, name: gate.profile.name, email: gate.profile.email, phone: gate.profile.phone, company: gate.profile.company, address: gate.profile.address, areas: gate.profile.areas, photoUrl: gate.profile.photoUrl, graLicence: gate.profile.graLicence, verified: gate.profile.verified },
    });
  }
  return NextResponse.json({ error: "Unknown view." }, { status: 400 });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const preview = await readPreview();
  if (preview) {
    const result = previewPost(preview.world, preview.actor, body);
    return withWorld(result.body, result.status, result.world);
  }
  const gate = await agent();
  if ("error" in gate) return gate.error;
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
