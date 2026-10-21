import { clientKey, tooMany } from "../../../lib/abuse";
import { nearbyPlaces } from "../../../lib/places";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (String(url.searchParams.get("website") || "").trim()) return Response.json({ error: "Too many map lookups. Wait and try again." }, { status: 400 });
  if (tooMany(`${clientKey(request)}:places`, 30, 10 * 60 * 1000)) return Response.json({ error: "Too many map lookups. Wait and try again." }, { status: 429 });
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Response.json({ error: "A map pin is required." }, { status: 400 });
  }
  const report = await nearbyPlaces(lat, lng);
  return Response.json(report);
}
