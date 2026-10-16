export const mobileNetworks = ["GTT", "Digicel"] as const;
export const broadbandProviders = ["GTT", "Digicel", "ENet", "Starlink"] as const;

export const waterSupplies = [
  { id: "gwi", label: "GWI mains" },
  { id: "well", label: "Well" },
  { id: "both", label: "GWI and a well" },
  { id: "none", label: "Not connected" },
] as const;

export const electricitySupplies = [
  { id: "gpl", label: "GPL" },
  { id: "generator", label: "Generator only" },
  { id: "both", label: "GPL and a generator" },
  { id: "none", label: "Not connected" },
] as const;

export const roadAccesses = [
  { id: "paved", label: "Paved" },
  { id: "unpaved", label: "Unpaved" },
] as const;

export type PlaceFacts = {
  mobileNetworks: string[];
  broadbandProviders: string[];
  broadbandSpeed: string;
  waterSupply: string;
  electricity: string;
  roadAccess: string;
  drainageNote: string;
  areaNote: string;
};

export const emptyFacts: PlaceFacts = {
  mobileNetworks: [],
  broadbandProviders: [],
  broadbandSpeed: "",
  waterSupply: "",
  electricity: "",
  roadAccess: "",
  drainageNote: "",
  areaNote: "",
};

function allowed(value: unknown, options: readonly string[]) {
  const set = new Set(options);
  const list = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  return [...new Set(list.map((item) => String(item).trim()).filter((item) => set.has(item)))];
}

function choice(value: unknown, options: readonly { id: string }[]) {
  const id = String(value || "").trim();
  return options.some((item) => item.id === id) ? id : "";
}

export function cleanFacts(input: {
  mobileNetworks?: unknown;
  broadbandProviders?: unknown;
  broadbandSpeed?: unknown;
  waterSupply?: unknown;
  electricity?: unknown;
  roadAccess?: unknown;
  drainageNote?: unknown;
  areaNote?: unknown;
}): PlaceFacts {
  return {
    mobileNetworks: allowed(input.mobileNetworks, mobileNetworks),
    broadbandProviders: allowed(input.broadbandProviders, broadbandProviders),
    broadbandSpeed: String(input.broadbandSpeed || "").trim().slice(0, 40),
    waterSupply: choice(input.waterSupply, waterSupplies),
    electricity: choice(input.electricity, electricitySupplies),
    roadAccess: choice(input.roadAccess, roadAccesses),
    drainageNote: String(input.drainageNote || "").trim().slice(0, 400),
    areaNote: String(input.areaNote || "").trim().slice(0, 400),
  };
}

export function factsFromRow(row: Record<string, unknown>): PlaceFacts {
  return cleanFacts({
    mobileNetworks: row.mobile_networks,
    broadbandProviders: row.broadband_providers,
    broadbandSpeed: row.broadband_speed,
    waterSupply: row.water_supply,
    electricity: row.electricity,
    roadAccess: row.road_access,
    drainageNote: row.drainage_note,
    areaNote: row.area_note,
  });
}

export function labelFor(id: string, options: readonly { id: string; label: string }[]) {
  return options.find((item) => item.id === id)?.label || "";
}

export function sizeFact(type: string, sqft: number) {
  if (!sqft) return { primary: "Not listed", secondary: "" };
  const feet = `${sqft.toLocaleString("en-GY")} sq ft`;
  if (type !== "Land") return { primary: feet, secondary: "" };
  const acres = sqft / 43560;
  const acresLabel = `${acres >= 10 ? acres.toFixed(1) : acres.toFixed(2)} acres`;
  return { primary: acresLabel, secondary: feet };
}
