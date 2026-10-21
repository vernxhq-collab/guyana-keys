import { cookies } from "next/headers";
import { decodeWorld, encodeWorld, fitWorld } from "./codec";
import { actors, type Actor } from "./world";

export const WORLD_COOKIE = "gk_preview_world";
export const ACTOR_COOKIE = "gk_preview_actor";

export function previewEnabled() {
  return process.env.PREVIEW_DESK === "1";
}

export { decodeWorld, encodeWorld, fitWorld };

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
