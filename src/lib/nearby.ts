export const nearbyRadiusKm = 3;

export type NearbyPlace = {
  id: string;
  name: string;
  kind: string;
  km: number;
  mi: number;
};

export type NearbyGroup = {
  id: "schools" | "health" | "getting-around" | "shops";
  label: string;
  empty: string;
  status: "ok" | "failed" | "loading";
  places: NearbyPlace[];
};

export type NearbyReport = {
  groups: NearbyGroup[];
};

export const nearbyGroupMeta: { id: NearbyGroup["id"]; label: string; empty: string }[] = [
  { id: "schools", label: "Schools", empty: "No mapped schools within 3 km yet." },
  { id: "health", label: "Health", empty: "No mapped hospitals or clinics within 3 km yet." },
  { id: "getting-around", label: "Getting around", empty: "No mapped stops, parks, or terminals within 3 km yet." },
  { id: "shops", label: "Shops & markets", empty: "No mapped shops or markets within 3 km yet." },
];

function blank(status: NearbyGroup["status"], empty?: string): NearbyReport {
  return {
    groups: nearbyGroupMeta.map((spec) => ({
      id: spec.id,
      label: spec.label,
      empty: empty || spec.empty,
      status,
      places: [],
    })),
  };
}

export function outsideGuyanaReport(): NearbyReport {
  return blank("ok", "This pin is outside Guyana, so nearby places were not searched.");
}

export function failedNearbyReport(): NearbyReport {
  return blank("failed");
}
