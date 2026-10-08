import { NextResponse } from "next/server";
import { authClient } from "../../../lib/supabase";
import { ensureProfile, isAdminEmail, loadProfile, readToken, redirectFor, SESSION_COOKIE, userFromToken, type Desk } from "../../../lib/session";

function plainError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("rate limit")) return "Too many emails were sent in the last hour. Use the link already in your inbox, or wait before asking again.";
  if (lower.includes("redirect")) return "The sign-in email could not be sent. Try again.";
  return "The sign-in email could not be sent. Try again.";
}

function deskOf(value: unknown): Desk {
  if (value === "agent" || value === "admin") return value;
  return "buyer";
}

function signedIn(user: { id: string; name: string; email: string }, profile: unknown, token: string) {
  const response = NextResponse.json({ user, profile });
  response.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30, secure: true });
  return response;
}

export async function GET() {
  const token = await readToken();
  const user = token ? await userFromToken(token) : null;
  if (!user) return NextResponse.json({ user: null, profile: null });
  const profile = await loadProfile(user.id);
  const safe = profile
    ? { id: profile.id, name: profile.name, email: profile.email, role: profile.role, phone: profile.phone, abroad: profile.abroad, suspended: profile.suspended, plan: profile.plan, listingCap: profile.listingCap, company: profile.company, areas: profile.areas, photoUrl: profile.photoUrl }
    : null;
  return NextResponse.json({ user, profile: safe });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (body.action === "logout") {
    const response = NextResponse.json({ user: null });
    response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0, secure: true });
    return response;
  }
  const client = authClient();
  if (!client) return NextResponse.json({ error: "Sign-in email is not connected." }, { status: 503 });
  const desk = deskOf(body.desk);
  if (body.action === "session") {
    const token = String(body.accessToken || "");
    const user = token ? await userFromToken(token) : null;
    if (!user) return NextResponse.json({ error: "That sign-in link was not accepted." }, { status: 400 });
    if (desk === "admin" && !isAdminEmail(user.email)) {
      return NextResponse.json({ error: "This desk is for the Guyana Keys admin." }, { status: 403 });
    }
    const profile = await ensureProfile(user, desk);
    if (desk === "admin" && profile?.role !== "admin") {
      return NextResponse.json({ error: "This desk is for the Guyana Keys admin." }, { status: 403 });
    }
    if (desk === "agent" && profile?.suspended) {
      const response = NextResponse.json({ error: "This account is suspended." }, { status: 403 });
      response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0, secure: true });
      return response;
    }
    const safe = profile ? { role: profile.role, name: profile.name, suspended: profile.suspended } : null;
    return signedIn(user, safe, token);
  }
  const email = String(body.email || "").trim().toLowerCase();
  if (body.action === "start") {
    if (!email.includes("@")) return NextResponse.json({ error: "Enter a real email address." }, { status: 400 });
    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: redirectFor(desk),
        data: body.name ? { name: String(body.name).trim() } : undefined,
      },
    });
    if (error) return NextResponse.json({ error: plainError(error.message) }, { status: 400 });
    return NextResponse.json({ step: "link", email });
  }
  if (body.action === "verify") {
    const { data, error } = await client.auth.verifyOtp({ email, token: String(body.code || "").trim(), type: "email" });
    if (error || !data.session || !data.user?.email) return NextResponse.json({ error: "That sign-in link was not accepted." }, { status: 400 });
    const meta = data.user.user_metadata?.name;
    const name = typeof meta === "string" && meta ? meta : data.user.email.split("@")[0];
    const user = { id: data.user.id, name, email: data.user.email };
    if (desk === "admin" && !isAdminEmail(user.email)) return NextResponse.json({ error: "This desk is for the Guyana Keys admin." }, { status: 403 });
    const profile = await ensureProfile(user, desk);
    if (desk === "agent" && profile?.suspended) return NextResponse.json({ error: "This account is suspended." }, { status: 403 });
    return signedIn(user, profile ? { role: profile.role, name: profile.name } : null, data.session.access_token);
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
