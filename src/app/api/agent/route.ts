import { NextResponse } from "next/server";
import { agentCalendar, agentHome, agentLead, agentLeadList, agentListing, agentListings, agentPlan, createRequest, deleteListing, duplicateListing, hideListing, saveAgentProfile, saveListing, updateLead } from "../../../lib/agent-data";
import { agentChecks, requestIdDeletion, saveAgentLicence } from "../../../lib/phase1-desk";
import { encodeWorld, fitWorld, readPreview, WORLD_COOKIE } from "../../../lib/preview/http";
import { previewGet, previewPost } from "../../../lib/preview/handle";
import type { World } from "../../../lib/preview/world";
import { canUseAgentDesk, readSession } from "../../../lib/session";

function withWorld(body: unknown, status: number, world?: World) {
  const response = NextResponse.json(body, { status });
  if (world) {
    response.cookies.set(WORLD_COOKIE, encodeWorld(fitWorld(world)), { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.VERCEL_ENV === "preview", maxAge: 60 * 60 * 24 * 7 });
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
  if (part === "lead") {
    const result = await agentLead(gate.profile, id);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 404 });
    return NextResponse.json(result);
  }
  if (part === "calendar") return NextResponse.json(await agentCalendar(gate.profile));
  if (part === "performance") {
    const data = await agentListings(gate.profile);
    const rows = data.listings || [];
    return NextResponse.json({
      live: rows.filter((listing) => listing.status === "live").length,
      hidden: rows.filter((listing) => listing.status !== "live").length,
      tracked: false,
      rows: rows.map((listing) => ({ id: listing.id, title: listing.title, status: listing.status || "hidden", enquiries: listing.enquiries })),
    });
  }
  if (part === "agency") {
    const data = await agentListings(gate.profile);
    return NextResponse.json({ agency: gate.profile.company || "Your agency", people: [{ id: gate.profile.id, name: gate.profile.name || "Agent", live: data.live, open: 0 }], held: 0 });
  }
  if (part === "outbox") return NextResponse.json({ messages: [] });
  if (part === "plan") return NextResponse.json(await agentPlan(gate.profile));
  if (part === "checks") return NextResponse.json(await agentChecks(gate.profile.id));
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
  let result: { error?: string; id?: string; ok?: boolean; pending?: boolean } = { error: "Unknown action." };
  if (action === "saveListing") result = await saveListing(gate.profile, body);
  else if (action === "duplicate") result = await duplicateListing(gate.profile, String(body.id || ""));
  else if (action === "hide") result = await hideListing(gate.profile, String(body.id || ""));
  else if (action === "delete") result = await deleteListing(gate.profile, String(body.id || ""));
  else if (action === "lead") result = await updateLead(gate.profile, body);
  else if (action === "request") result = await createRequest(gate.profile, body);
  else if (action === "profile") result = await saveAgentProfile(gate.profile, body);
  else if (action === "saveLicence") result = await saveAgentLicence(gate.profile.id, body);
  else if (action === "requestDeletion") result = await requestIdDeletion(gate.profile.id, String(body.documentId || ""), String(body.note || ""));
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
