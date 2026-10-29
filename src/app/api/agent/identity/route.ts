import { NextResponse } from "next/server";
import { finishUpload } from "../../../../lib/identity-upload";
import { canUseAgentDesk, readSession } from "../../../../lib/session";

// Step 2 of an upload: the file is already in the private quarantine folder.
// The server checks its real type, re-encodes images, then keeps it or deletes it.
// The request body is small JSON, so the 4.5 MB function limit does not apply to files.
export const maxDuration = 30;

export async function POST(request: Request) {
  const session = await readSession();
  if (!session?.profile || !canUseAgentDesk(session.profile, session.user.email)) {
    return NextResponse.json({ error: "This desk is for agents." }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Choose a file." }, { status: 400 });
  const saved = await finishUpload(session.profile.id, body as Record<string, unknown>);
  if ("error" in saved && saved.error) return NextResponse.json({ error: saved.error }, { status: 400 });
  return NextResponse.json(saved);
}
