import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

function expOf(token: string) {
  const part = token.split(".")[1];
  if (!part) return 0;
  try {
    const json = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    return Number(json.exp) || 0;
  } catch {
    return 0;
  }
}

export async function middleware(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-gk-path", request.nextUrl.pathname);
  const pass = () => NextResponse.next({ request: { headers } });
  if (process.env.VERCEL_ENV === "preview") return pass();
  const refresh = request.cookies.get("gk_refresh")?.value || "";
  const access = request.cookies.get("gk_session")?.value || "";
  if (!refresh) return pass();
  if (access && expOf(access) * 1000 > Date.now() + 60_000) return pass();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return pass();
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data } = await client.auth.refreshSession({ refresh_token: refresh });
  const session = data.session;
  if (!session?.access_token || !session.refresh_token) {
    const response = pass();
    response.cookies.set("gk_session", "", { path: "/", maxAge: 0 });
    response.cookies.set("gk_refresh", "", { path: "/", maxAge: 0 });
    return response;
  }
  const cookie = request.cookies.getAll()
    .filter((item) => item.name !== "gk_session" && item.name !== "gk_refresh")
    .map((item) => `${item.name}=${item.value}`)
    .concat([`gk_session=${session.access_token}`, `gk_refresh=${session.refresh_token}`])
    .join("; ");
  headers.set("cookie", cookie);
  const response = NextResponse.next({ request: { headers } });
  const options = { httpOnly: true, sameSite: "lax" as const, path: "/", secure: true, maxAge: 60 * 60 * 24 * 30 };
  response.cookies.set("gk_session", session.access_token, options);
  response.cookies.set("gk_refresh", session.refresh_token, options);
  return response;
}

export const config = {
  matcher: [
    "/agent",
    "/agent/:path*",
    "/account",
    "/account/:path*",
    "/admin",
    "/admin/:path*",
    "/api/agent",
    "/api/agent/:path*",
    "/api/buyer",
    "/api/buyer/:path*",
    "/api/admin",
    "/api/admin/:path*",
  ],
};
