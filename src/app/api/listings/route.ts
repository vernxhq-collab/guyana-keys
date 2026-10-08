import { NextResponse } from "next/server";
import { db } from "../../../lib/supabase";
import { listings } from "../../../lib/data";

export async function GET() {
  const client = db();
  if (!client) return NextResponse.json({ listings });
  const { data, error } = await client.from("properties").select("*").eq("status", "live");
  if (error || !data?.length) return NextResponse.json({ listings });
  return NextResponse.json({ listings: data });
}
