import { NextResponse } from "next/server";
import { answer } from "../../../lib/assistant";
export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ reply: answer(String(body.message || "")) });
}
