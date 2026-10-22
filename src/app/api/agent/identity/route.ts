import { NextResponse } from "next/server";
import { ID_CONSENT_VERSION, RETENTION_MONTHS } from "../../../../lib/compliance/retention";
import { newId } from "../../../../lib/labels";
import { IDENTITY_BUCKET } from "../../../../lib/phase1-desk";
import { canUseAgentDesk, readSession } from "../../../../lib/session";
import { serviceDb } from "../../../../lib/supabase";

const types: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
};

export async function POST(request: Request) {
  const session = await readSession();
  if (!session?.profile || !canUseAgentDesk(session.profile, session.user.email)) {
    return NextResponse.json({ error: "This desk is for agents." }, { status: 403 });
  }
  const db = serviceDb();
  if (!db) return NextResponse.json({ error: "The file could not be saved." }, { status: 503 });
  const form = await request.formData().catch(() => null);
  if (form?.get("consent") !== "yes" || form.get("consentVersion") !== ID_CONSENT_VERSION) {
    return NextResponse.json({ error: "Read the consent and confirm it before a file can be stored." }, { status: 400 });
  }
  const kind = form.get("kind") === "selfie" ? "selfie" : form.get("kind") === "id_scan" ? "id_scan" : "";
  if (!kind) return NextResponse.json({ error: "Choose an ID scan or a selfie." }, { status: 400 });
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file." }, { status: 400 });
  const ext = types[file.type];
  if (!ext) return NextResponse.json({ error: "Use a JPEG, PNG, or PDF." }, { status: 400 });
  if (file.size > 8_000_000) return NextResponse.json({ error: "That file is larger than 8 MB." }, { status: 400 });
  const path = `${session.profile.id}/${kind}-${newId("file")}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const uploaded = await db.storage.from(IDENTITY_BUCKET).upload(path, bytes, { contentType: file.type, upsert: false });
  if (uploaded.error) {
    const message = String(uploaded.error.message || "").toLowerCase();
    if (message.includes("bucket") || message.includes("not found")) {
      return NextResponse.json({ error: "The private identity bucket is not set up yet." }, { status: 503 });
    }
    return NextResponse.json({ error: "The file could not be saved." }, { status: 500 });
  }
  const { error } = await db.from("id_documents").insert({
    id: newId("idd"),
    agent_id: session.profile.id,
    kind,
    storage_path: path,
    consent_version: ID_CONSENT_VERSION,
    consent_at: new Date().toISOString(),
    retention_months: RETENTION_MONTHS,
  });
  if (error) {
    await db.storage.from(IDENTITY_BUCKET).remove([path]);
    const message = String(error.message || "").toLowerCase();
    if (message.includes("does not exist") || message.includes("schema cache") || message.includes("could not find")) {
      return NextResponse.json({ error: "Identity files are not ready on this desk yet." }, { status: 503 });
    }
    return NextResponse.json({ error: "The file could not be saved." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
