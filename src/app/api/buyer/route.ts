import { NextResponse } from "next/server";
import { buyerDesk, deleteSearch, migrateMine, rememberView, saveBuyerProfile, saveHome, saveSearch, sendEnquiry, unsaveHome } from "../../../lib/buyer-data";
import { readSession } from "../../../lib/session";

async function buyer() {
  const session = await readSession();
  if (!session) return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  if (!session.profile) return { error: NextResponse.json({ error: "The desk is not connected." }, { status: 503 }) };
  if (session.profile.role !== "buyer") return { error: NextResponse.json({ error: "Your homes is for buyers." }, { status: 403 }) };
  return { profile: session.profile };
}

export async function GET() {
  const gate = await buyer();
  if ("error" in gate) return gate.error;
  const data = await buyerDesk(gate.profile);
  if ("error" in data) return NextResponse.json(data, { status: 503 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const gate = await buyer();
  if ("error" in gate) return gate.error;
  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "");
  const propertyId = String(body.propertyId || "");
  let result: { error?: string; ok?: boolean; viewing?: boolean } = { error: "Unknown action." };
  if (action === "save") result = await saveHome(gate.profile, propertyId);
  else if (action === "unsave") result = await unsaveHome(gate.profile, propertyId);
  else if (action === "enquiry" || action === "viewing") {
    result = await sendEnquiry(gate.profile, {
      propertyId,
      name: String(body.name || gate.profile.name),
      phone: String(body.phone || ""),
      note: String(body.note || ""),
      abroad: Boolean(body.abroad),
      moveIn: String(body.moveIn || ""),
      occupants: body.occupants ? Number(body.occupants) : null,
      viewingRequest: action === "viewing" ? `${String(body.day || "").trim()} ${String(body.timeOfDay || "").trim()}`.trim() : undefined,
    });
  } else if (action === "search") {
    result = await saveSearch(gate.profile, {
      label: String(body.label || "Saved search"),
      purpose: String(body.purpose || ""),
      area: String(body.area || ""),
      beds: Number(body.beds || 0),
      maxPrice: Number(body.maxPrice || 0),
    });
  } else if (action === "deleteSearch") result = await deleteSearch(gate.profile, String(body.id || ""));
  else if (action === "profile") result = await saveBuyerProfile(gate.profile, { name: String(body.name || ""), phone: String(body.phone || ""), abroad: Boolean(body.abroad) });
  else if (action === "view") result = await rememberView(gate.profile, propertyId);
  else if (action === "migrate") result = await migrateMine(gate.profile, Array.isArray(body.saved) ? body.saved : [], Array.isArray(body.enquired) ? body.enquired : []);
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.error === "cap" ? 403 : 400 });
  return NextResponse.json(result);
}
