import { NextResponse } from "next/server";
import { ID_CONSENT_VERSION } from "../../../../lib/compliance/retention";
import { cleanQualityNote, KEYS_DOCUMENT_KINDS, type KeysDocumentKind } from "../../../../lib/keys-check";
import { saveKeysFile } from "../../../../lib/keys-check-data";
import { canUseAgentDesk, readSession } from "../../../../lib/session";

const types: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
  "video/webm": "webm",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
};

export async function POST(request: Request) {
  const session = await readSession();
  if (!session?.profile || !canUseAgentDesk(session.profile, session.user.email)) {
    return NextResponse.json({ error: "This desk is for agents." }, { status: 403 });
  }
  const form = await request.formData().catch(() => null);
  if (form?.get("consent") !== "yes" || form.get("consentVersion") !== ID_CONSENT_VERSION) {
    return NextResponse.json({ error: "Read the consent and confirm it before a file can be stored." }, { status: 400 });
  }
  const kind = String(form?.get("kind") || "");
  if (!KEYS_DOCUMENT_KINDS.includes(kind as KeysDocumentKind)) {
    return NextResponse.json({ error: "Choose a Keys Check file." }, { status: 400 });
  }
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file." }, { status: 400 });
  const extension = types[file.type];
  if (!extension) return NextResponse.json({ error: "Use a JPEG, PNG, PDF, or a short WebM, MP4, or MOV clip." }, { status: 400 });
  const video = extension === "webm" || extension === "mp4";
  if (!video && kind === "code_video") return NextResponse.json({ error: "The code clip needs to be a video." }, { status: 400 });
  if (video && kind !== "code_video") return NextResponse.json({ error: "A video is only used for the code clip." }, { status: 400 });
  const limit = video ? 12_000_000 : 8_000_000;
  if (file.size > limit) return NextResponse.json({ error: video ? "That clip is larger than 12 MB." : "That file is larger than 8 MB." }, { status: 400 });
  const bytes = Buffer.from(await file.arrayBuffer());
  const saved = await saveKeysFile({
    agentId: session.profile.id,
    kind,
    bytes,
    contentType: file.type,
    extension,
    qualityNote: cleanQualityNote(String(form?.get("qualityNote") || "")),
  });
  if ("error" in saved && saved.error) return NextResponse.json({ error: saved.error }, { status: 400 });
  return NextResponse.json(saved);
}
