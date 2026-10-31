import { NextResponse } from "next/server";
import { tooMany } from "../../../../../lib/abuse";
import { issueUploadUrl, readUploadRequest } from "../../../../../lib/identity-upload";
import { readCheckAgent } from "../../../../../lib/scan-access";

// Step 1 of an upload: the server checks who is asking and what they plan to send,
// then returns a one-use signed URL. The file itself never passes through this function.
export async function POST(request: Request) {
  const actor = await readCheckAgent();
  if (!actor) return NextResponse.json({ error: "This desk is for agents." }, { status: 403 });
  if (tooMany(`idupload:${actor.agentId}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many uploads in the last hour. Try again later." }, { status: 429 });
  }
  const body = await request.json().catch(() => ({}));
  const checked = readUploadRequest(body);
  if ("error" in checked) return NextResponse.json({ error: checked.error }, { status: 400 });
  const issued = await issueUploadUrl(actor.agentId, checked.kind, checked.contentType);
  if ("error" in issued) return NextResponse.json({ error: issued.error }, { status: 400 });
  return NextResponse.json(issued);
}
