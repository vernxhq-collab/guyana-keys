import { nearbyPlaces } from "../../../lib/places";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Response.json({ error: "A map pin is required." }, { status: 400 });
  }
  const report = await nearbyPlaces(lat, lng);
  return Response.json(report);
}
