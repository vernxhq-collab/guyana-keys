import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authClient } from "../../../lib/supabase";

const COOKIE = "gk_session";

async function currentUser(token: string | undefined) {
  if (!token) return null;
  const client = authClient();
  if (!client) return null;
  const { data } = await client.auth.getUser(token);
  const user = data.user;
  if (!user?.email) return null;
  const name = typeof user.user_metadata?.name === "string" && user.user_metadata.name ? user.user_metadata.name : user.email.split("@")[0];
  return { id: user.id, name, email: user.email };
}

export async function GET() {
  const token = (await cookies()).get(COOKIE)?.value;
  return NextResponse.json({ user: await currentUser(token) });
}

export async function POST(request: Request) {
  const body = await request.json();
  if (body.action === "logout") {
    const response = NextResponse.json({ user: null });
    response.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  }
  const client = authClient();
  if (!client) return NextResponse.json({ error: "Sign-in email is not connected on the server." }, { status: 503 });
  const email = String(body.email || "").trim().toLowerCase();
  if (body.action === "start") {
    if (!email.includes("@")) return NextResponse.json({ error: "Enter a real email address." }, { status: 400 });
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, data: body.name ? { name: String(body.name).trim() } : undefined },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ step: "code", email });
  }
  if (body.action === "verify") {
    const { data, error } = await client.auth.verifyOtp({ email, token: String(body.code || "").trim(), type: "email" });
    if (error || !data.session || !data.user?.email) {
      return NextResponse.json({ error: error?.message || "That code was not accepted." }, { status: 400 });
    }
    const name = typeof data.user.user_metadata?.name === "string" && data.user.user_metadata.name ? data.user.user_metadata.name : data.user.email.split("@")[0];
    const response = NextResponse.json({ user: { id: data.user.id, name, email: data.user.email } });
    response.cookies.set(COOKIE, data.session.access_token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30, secure: true });
    return response;
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
