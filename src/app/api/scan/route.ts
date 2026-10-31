import { NextResponse } from "next/server";
import { tooMany, clientKey } from "../../../lib/abuse";
import { issueKeysCode, submitKeysCheck } from "../../../lib/keys-check-data";
import { claimPhoneToken, issuePhoneToken, loadPhoneScan, savePhoneDraft } from "../../../lib/phone-scan-data";
import { PHONE_SCAN_COOKIE } from "../../../lib/phone-token";
import { readCheckAgent } from "../../../lib/scan-access";
import { canUseAgentDesk, readSession } from "../../../lib/session";

function cookieOptions(maxAge: number) {
  return { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge, secure: process.env.NODE_ENV === "production" };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET() {
  const actor = await readCheckAgent();
  if (!actor) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  return NextResponse.json(await loadPhoneScan(actor.agentId));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "");

  if (action === "claim") {
    if (tooMany(`phonescan-claim:${clientKey(request)}`, 30, 10 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many tries. Wait a few minutes." }, { status: 429 });
    }
    const claimed = await claimPhoneToken(String(body.token || ""));
    if (!("session" in claimed) || !claimed.session || claimed.maxAge === undefined) {
      return NextResponse.json({ error: "error" in claimed ? claimed.error : "This phone link is not valid." }, { status: 400 });
    }
    const response = NextResponse.json({ ok: true });
    response.cookies.set(PHONE_SCAN_COOKIE, claimed.session, cookieOptions(claimed.maxAge));
    return response;
  }

  if (action === "issue") {
    const session = await readSession();
    if (!session?.profile || !canUseAgentDesk(session.profile, session.user.email)) {
      return NextResponse.json({ error: "Sign in on this desk before you make a phone link." }, { status: 403 });
    }
    if (tooMany(`phonescan:${session.profile.id}`, 5, 10 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many phone links. Wait 10 minutes." }, { status: 429 });
    }
    const origin = new URL(request.url).origin;
    const issued = await issuePhoneToken(session.profile.id, origin);
    if ("error" in issued && issued.error) return NextResponse.json({ error: issued.error }, { status: 400 });
    return NextResponse.json(issued);
  }

  const actor = await readCheckAgent();
  if (!actor) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (action === "draft") {
    const saved = await savePhoneDraft(actor.agentId, body, today());
    if ("error" in saved && saved.error) return NextResponse.json({ error: saved.error }, { status: 400 });
    return NextResponse.json(saved);
  }
  if (action === "code") {
    const issued = await issueKeysCode(actor.agentId);
    if (issued.error) return NextResponse.json({ error: issued.error }, { status: 400 });
    return NextResponse.json(issued);
  }
  if (action === "submit") {
    const saved = await savePhoneDraft(actor.agentId, body, today());
    if ("error" in saved && saved.error) return NextResponse.json({ error: saved.error }, { status: 400 });
    const sent = await submitKeysCheck(actor.agentId, body);
    if (sent.error) return NextResponse.json({ error: sent.error }, { status: 400 });
    return NextResponse.json({ ok: true, flagSentences: "flagSentences" in saved ? saved.flagSentences : [] });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
