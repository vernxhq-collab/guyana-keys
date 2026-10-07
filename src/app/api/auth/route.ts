import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authClient } from "../../../lib/supabase";

const COOKIE = "gk_session";
const RETURN_TO = "https://guyana-keys.vercel.app/account";

function plainError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("rate limit")) {
    return "Too many emails were sent in the last hour. Use the link already in your inbox, or wait before asking again.";
  }
  return message;
}

async function userFromToken(token: string) {
  const client = authClient();
  if (!client) return null;
  const { data } = await client.auth.getUser(token);
  const user = data.user;
  if (!user?.email) return null;
  const name = typeof user.user_metadata?.name === "string" && user.user_metadata.name ? user.user_metadata.name : user.email.split("@")[0];
  return { id: user.id, name, email: user.email };
}

function signedIn(user: { id: string; name: string; email: string }, token: string) {
  const response = NextResponse.json({ user });
  response.cookies.set(COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30, secure: true });
  return response;
}

export async function GET() {
  const token = (await cookies()).get(COOKIE)?.value;
  return NextResponse.json({ user: token ? await userFromToken(token) : null });
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
  if (body.action === "session") {
    const token = String(body.accessToken || "");
    const user = token ? await userFromToken(token) : null;
    if (!user) return NextResponse.json({ error: "That sign-in link was not accepted." }, { status: 400 });
    return signedIn(user, token);
  }
  const email = String(body.email || "").trim().toLowerCase();
  if (body.action === "start") {
    if (!email.includes("@")) return NextResponse.json({ error: "Enter a real email address." }, { status: 400 });
    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: RETURN_TO,
        data: body.name ? { name: String(body.name).trim() } : undefined,
      },
    });
    if (error) return NextResponse.json({ error: plainError(error.message) }, { status: 400 });
    return NextResponse.json({ step: "link", email });
  }
  if (body.action === "verify") {
    const { data, error } = await client.auth.verifyOtp({ email, token: String(body.code || "").trim(), type: "email" });
    if (error || !data.session || !data.user?.email) {
      return NextResponse.json({ error: plainError(error?.message || "That code was not accepted.") }, { status: 400 });
    }
    const name = typeof data.user.user_metadata?.name === "string" && data.user.user_metadata.name ? data.user.user_metadata.name : data.user.email.split("@")[0];
    return signedIn({ id: data.user.id, name, email: data.user.email }, data.session.access_token);
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
