import { NextResponse } from "next/server";
import { adminAgent, adminApplications, adminFeature, adminHide, adminHome, adminInbox, adminLead, adminListings, adminPeople, adminPublish, adminRequest, adminRequests, markPaid, reviewApplication, saveInstructions, setApproved, setPlan, setVerified, suspendAgent, unsuspendAgent } from "../../../lib/admin-data";
import { adminCheckQueue, declineDeletion, openIdentityFile, purgeIdentityFile, reviewIdentity, reviewLicence } from "../../../lib/phase1-desk";
import { adminKeysQueue, decideKeysCheck, openKeysFiles, saveKeysNotes } from "../../../lib/keys-check-data";
import { twoStepDone } from "../../../lib/mfa";
import { isAdminEmail, readSession } from "../../../lib/session";

async function admin() {
  const session = await readSession();
  if (!session) return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  if (!session.profile || session.profile.role !== "admin" || !isAdminEmail(session.user.email)) {
    return { error: NextResponse.json({ error: "This desk is for the Guyana Keys admin." }, { status: 403 }) };
  }
  if (!twoStepDone(session.token)) {
    return { error: NextResponse.json({ error: "Finish two-step sign-in to use the admin desk." }, { status: 403 }) };
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
  if (part === "agent") return NextResponse.json(await adminAgent(id));
  if (part === "listings") return NextResponse.json(await adminListings(q));
  if (part === "requests") return NextResponse.json(await adminRequests());
  if (part === "request") return NextResponse.json(await adminRequest(id));
  if (part === "inbox") return NextResponse.json(await adminInbox(q));
  if (part === "lead") return NextResponse.json(await adminLead(id));
  if (part === "applications") return NextResponse.json(await adminApplications());
  if (part === "licences") return NextResponse.json(await adminCheckQueue());
  if (part === "keys") return NextResponse.json(await adminKeysQueue());
  if (part === "keysFiles") {
    const opened = await openKeysFiles(gate.profile.id, id);
    if ("error" in opened && opened.error) return NextResponse.json(opened, { status: 400 });
    return NextResponse.json(opened);
  }
  if (part === "document") {
    const opened = await openIdentityFile(gate.profile.id, id, url.searchParams.get("intent") === "download");
    if ("error" in opened && opened.error) return NextResponse.json(opened, { status: 400 });
    return NextResponse.json(opened);
  }
  return NextResponse.json({ error: "Unknown view." }, { status: 400 });
}

export async function POST(request: Request) {
  const gate = await admin();
  if ("error" in gate) return gate.error;
  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "");
  let result: { error?: string; ok?: boolean } = { error: "Unknown action." };
  if (action === "instructions") result = await saveInstructions(String(body.id || ""), String(body.instructions || ""));
  else if (action === "paid") result = await markPaid(String(body.id || ""), { amountGyd: Number(body.amountGyd), paidBy: gate.profile.name || gate.profile.email || "Admin" });
  else if (action === "plan") result = await setPlan(String(body.agentId || ""), String(body.plan || ""));
  else if (action === "verified") result = await setVerified(String(body.agentId || ""), Boolean(body.verified));
  else if (action === "suspend") result = await suspendAgent(String(body.agentId || ""));
  else if (action === "unsuspend") result = await unsuspendAgent(String(body.agentId || ""));
  else if (action === "approve") result = await setApproved(String(body.agentId || ""), body.approved !== false);
  else if (action === "reviewApplication") result = await reviewApplication(String(body.id || ""), body);
  else if (action === "publish") result = await adminPublish(String(body.propertyId || ""));
  else if (action === "hide") result = await adminHide(String(body.propertyId || ""));
  else if (action === "reviewLicence") result = await reviewLicence(gate.profile.name || gate.profile.email || "Admin", body);
  else if (action === "reviewIdentity") result = await reviewIdentity(gate.profile.name || gate.profile.email || "Admin", body);
  else if (action === "purgeDocument") result = await purgeIdentityFile(gate.profile.id, String(body.documentId || ""));
  else if (action === "declineDeletion") result = await declineDeletion(gate.profile.id, String(body.requestId || ""));
  else if (action === "keysNotes") result = await saveKeysNotes(gate.profile.name || gate.profile.email || "Admin", { ...body, actorId: gate.profile.id });
  else if (action === "keysDecision") result = await decideKeysCheck(gate.profile.name || gate.profile.email || "Admin", gate.profile.id, body);
  else if (action === "feature") result = await adminFeature(String(body.propertyId || ""), true);
  else if (action === "unfeature") result = await adminFeature(String(body.propertyId || ""), false);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
