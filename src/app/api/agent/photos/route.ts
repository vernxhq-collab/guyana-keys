import { NextResponse } from "next/server";
import { newId } from "../../../../lib/labels";
import { readSession } from "../../../../lib/session";
import { serviceDb, supabaseUrl } from "../../../../lib/supabase";

export async function POST(request: Request) {
  const session = await readSession();
  if (!session?.profile || session.profile.role !== "agent" || session.profile.suspended) {
    return NextResponse.json({ error: "This desk is for agents." }, { status: 403 });
  }
  const db = serviceDb();
  if (!db) return NextResponse.json({ error: "The photo could not be saved." }, { status: 503 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a photo." }, { status: 400 });
  if (file.type !== "image/jpeg") return NextResponse.json({ error: "Use a JPEG photo." }, { status: 400 });
  if (file.size > 4_000_000) return NextResponse.json({ error: "That photo is too large." }, { status: 400 });
  const kind = form?.get("kind") === "profile" ? "profile" : "listing";
  const path = kind === "profile" ? `${session.profile.id}/profile.jpg` : `${session.profile.id}/${newId("photo")}.jpg`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error } = await db.storage.from("listing-photos").upload(path, bytes, { contentType: "image/jpeg", upsert: kind === "profile" });
  if (error) return NextResponse.json({ error: "That photo could not be saved." }, { status: 500 });
  const url = `${supabaseUrl()}/storage/v1/object/public/listing-photos/${path}`;
  if (kind === "profile") await db.from("profiles").update({ photo_url: url }).eq("id", session.profile.id);
  return NextResponse.json({ url });
}
