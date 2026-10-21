import { cookies } from "next/headers";
import { actors, seedWorld, type Actor, type World } from "./world";

export const WORLD_COOKIE = "gk_preview_world";
export const ACTOR_COOKIE = "gk_preview_actor";

export function previewEnabled() {
  return process.env.VERCEL_ENV !== "production";
}

export function encodeWorld(world: World) {
  return Buffer.from(JSON.stringify(world)).toString("base64url");
}

export function decodeWorld(raw: string | undefined): World {
  if (!raw) return seedWorld();
  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as World;
  } catch {
    return seedWorld();
  }
}

export async function readPreview() {
  if (!previewEnabled()) return null;
  const jar = await cookies();
  const actor = actors[jar.get(ACTOR_COOKIE)?.value || ""];
  if (!actor) return null;
  return { actor, world: decodeWorld(jar.get(WORLD_COOKIE)?.value) };
}

export function actorById(id: string): Actor | null {
  return actors[id] || null;
}
