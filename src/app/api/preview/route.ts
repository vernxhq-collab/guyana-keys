import { NextResponse } from "next/server";
import { ACTOR_COOKIE, actorById, decodeWorld, encodeWorld, fitWorld, previewEnabled, WORLD_COOKIE } from "../../../lib/preview/http";
import { buyerView, seedWorld, updateLead } from "../../../lib/preview/world";
import { presentHome } from "../../../lib/preview/present";

function locked() {
  return NextResponse.json({ error: "This preview is not available on production." }, { status: 404 });
}

function cookiesOf(request: Request) {
  const header = request.headers.get("cookie") || "";
  const worldRaw = header.split(";").map((part) => part.trim()).find((part) => part.startsWith(WORLD_COOKIE + "="));
  const actorRaw = header.split(";").map((part) => part.trim()).find((part) => part.startsWith(ACTOR_COOKIE + "="));
  return {
    world: decodeWorld(worldRaw ? decodeURIComponent(worldRaw.split("=").slice(1).join("=")) : undefined),
    actorId: actorRaw ? decodeURIComponent(actorRaw.split("=").slice(1).join("=")) : "",
  };
}

function write(response: NextResponse, worldEncoded: string, actorId: string) {
  const secure = process.env.VERCEL_ENV === "preview";
  response.cookies.set(WORLD_COOKIE, worldEncoded, { httpOnly: true, sameSite: "lax", path: "/", secure, maxAge: 60 * 60 * 24 * 7 });
  response.cookies.set(ACTOR_COOKIE, actorId, { httpOnly: true, sameSite: "lax", path: "/", secure, maxAge: 60 * 60 * 24 * 7 });
  return response;
}

export async function GET(request: Request) {
  if (!previewEnabled()) return locked();
  const { world, actorId } = cookiesOf(request);
  const actor = actorById(actorId);
  if (!actor) return NextResponse.json({ enabled: true, actor: null });
  if (actor.kind === "buyer") return NextResponse.json({ enabled: true, actor, buyer: buyerView(world, actor) });
  return NextResponse.json({ enabled: true, actor, home: presentHome(world, actor), buyer: null });
}

export async function POST(request: Request) {
  if (!previewEnabled()) return locked();
  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "");
  if (action === "leave") {
    const response = NextResponse.json({ ok: true });
    response.cookies.set(WORLD_COOKIE, "", { path: "/", maxAge: 0 });
    response.cookies.set(ACTOR_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  }
  const { world, actorId } = cookiesOf(request);
  if (action === "reset") {
    const actor = actorById(String(body.actor || actorId)) || actorById("asha");
    if (!actor) return NextResponse.json({ error: "Unknown test person." }, { status: 400 });
    return write(NextResponse.json({ ok: true, actor }), encodeWorld(fitWorld(seedWorld())), actor.id);
  }
  if (action === "enter") {
    const actor = actorById(String(body.actor || ""));
    if (!actor) return NextResponse.json({ error: "Unknown test person." }, { status: 400 });
    const next = world.leads.length ? world : seedWorld();
    return write(NextResponse.json({ ok: true, actor }), encodeWorld(fitWorld(next)), actor.id);
  }
  const actor = actorById(actorId);
  if (!actor) return NextResponse.json({ error: "Open the test desk first." }, { status: 401 });
  if (action === "lead") {
    const result = updateLead(world, actor, String(body.id || ""), body);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 403 });
    return write(NextResponse.json({ ok: true }), encodeWorld(fitWorld(result.world)), actor.id);
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
