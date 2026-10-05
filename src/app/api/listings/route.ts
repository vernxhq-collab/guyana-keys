import { NextResponse } from "next/server";
import { db } from "../../../lib/supabase";
import { listings } from "../../../lib/data";
export async function GET() {
  const client = db();
  if (!client) return NextResponse.json({ source: "file", listings });
  const { data, error } = await client.from("properties").select("*").eq("status", "live");
  if (error) return NextResponse.json({ source: "file", error: error.message, listings });
  return NextResponse.json({ source: "supabase", listings: data });
}
