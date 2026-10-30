import { NextResponse } from "next/server";
import { tooMany } from "../../../../lib/abuse";
import { cleanCode, qrImageSrc, REFRESH_COOKIE, reviewerClient, tokenAal } from "../../../../lib/mfa";
import { isAdminEmail, readSession, SESSION_COOKIE } from "../../../../lib/session";

function cookieOptions(maxAge: number) {
  return { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge, secure: true };
}

async function reviewer() {
  const session = await readSession();
  if (!session) return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  if (!session.profile || session.profile.role !== "admin" || !isAdminEmail(session.user.email)) {
    return { error: NextResponse.json({ error: "Two-step sign-in is for Guyana Keys reviewers." }, { status: 403 }) };
  }
  const client = await reviewerClient(session.token);
  if (!client) return { error: NextResponse.json({ error: "Sign in again, then set up two-step sign-in." }, { status: 401 }) };
  return { session, client };
}

// GET: is a code app set up, and is this session already at the second step?
export async function GET() {
  const gate = await reviewer();
  if ("error" in gate) return gate.error;
  const factors = await gate.client.auth.mfa.listFactors();
  const ready = (factors.data?.totp || []).some((factor) => factor.status === "verified");
  return NextResponse.json({ enrolled: ready, aal: tokenAal(gate.session.token) });
}

// POST { action: "start" }: first-time set-up. Returns a QR code for an authenticator app.
// POST { action: "verify", factorId?, code }: checks the 6-digit code and upgrades the session to aal2.
export async function POST(request: Request) {
  const gate = await reviewer();
  if ("error" in gate) return gate.error;
  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "");
  const mfa = gate.client.auth.mfa;
  const listed = await mfa.listFactors();
  if (listed.error) return NextResponse.json({ error: "Two-step sign-in could not be checked. Try again." }, { status: 400 });
  const verified = (listed.data.totp || []).find((factor) => factor.status === "verified");

  if (action === "start") {
    if (verified) return NextResponse.json({ enrolled: true });
    // Clear any half-finished set-up before making a new one.
    for (const factor of listed.data.all || []) {
      if (factor.factor_type === "totp" && factor.status !== "verified") await mfa.unenroll({ factorId: factor.id });
    }
    const enrolled = await mfa.enroll({ factorType: "totp", issuer: "Guyana Keys", friendlyName: "Reviewer code app" });
    if (enrolled.error || !enrolled.data) return NextResponse.json({ error: "Two-step sign-in could not be set up. Try again." }, { status: 400 });
    return NextResponse.json({ factorId: enrolled.data.id, qr: qrImageSrc(enrolled.data.totp.qr_code), secret: enrolled.data.totp.secret });
  }

  if (action === "verify") {
    if (tooMany(`mfa:${gate.session.user.id}`, 8, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many tries. Wait 15 minutes." }, { status: 429 });
    }
    const code = cleanCode(body.code);
    if (!code) return NextResponse.json({ error: "Enter the 6-digit code from the app." }, { status: 400 });
    const pending = (listed.data.all || []).find((factor) => factor.factor_type === "totp" && factor.id === String(body.factorId || ""));
    const factorId = verified?.id || pending?.id || "";
    if (!factorId) return NextResponse.json({ error: "Set up two-step sign-in first." }, { status: 400 });
    const result = await mfa.challengeAndVerify({ factorId, code });
    if (result.error || !result.data?.access_token) return NextResponse.json({ error: "That code did not work. Check the time on your phone and try again." }, { status: 400 });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, result.data.access_token, cookieOptions(60 * 60 * 24 * 30));
    if (result.data.refresh_token) response.cookies.set(REFRESH_COOKIE, result.data.refresh_token, cookieOptions(60 * 60 * 24 * 30));
    return response;
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
