export const generatorChoices = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
  { id: "unknown", label: "Not stated" },
] as const;

export const waterTankChoices = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
] as const;

export const parkingChoices = [
  { id: "none", label: "None" },
  { id: "street", label: "Street" },
  { id: "yard", label: "Yard" },
  { id: "garage", label: "Garage" },
] as const;

export const floodChoices = [
  { id: "low", label: "Low" },
  { id: "some", label: "Some" },
  { id: "high", label: "High" },
  { id: "unknown", label: "Not stated" },
] as const;

export const furnishedChoices = [
  { id: "unfurnished", label: "Unfurnished" },
  { id: "partly", label: "Partly furnished" },
  { id: "furnished", label: "Furnished" },
  { id: "unknown", label: "Not stated" },
] as const;

export type SiteFacts = {
  generator: string;
  waterTank: string;
  waterNotes: string;
  parking: string;
  parkingSpaces: number | null;
  floodRisk: string;
  furnished: string;
};

export const emptySite: SiteFacts = {
  generator: "",
  waterTank: "",
  waterNotes: "",
  parking: "",
  parkingSpaces: null,
  floodRisk: "",
  furnished: "",
};

function choice(value: unknown, options: readonly { id: string }[]) {
  const id = String(value || "").trim();
  return options.some((item) => item.id === id) ? id : "";
}

export function cleanSite(input: {
  generator?: unknown;
  waterTank?: unknown;
  waterNotes?: unknown;
  parking?: unknown;
  parkingSpaces?: unknown;
  floodRisk?: unknown;
  furnished?: unknown;
}): SiteFacts {
  const spaces = Number(input.parkingSpaces);
  return {
    generator: choice(input.generator, generatorChoices),
    waterTank: choice(input.waterTank, waterTankChoices),
    waterNotes: String(input.waterNotes || "").trim().slice(0, 400),
    parking: choice(input.parking, parkingChoices),
    parkingSpaces: Number.isFinite(spaces) && spaces >= 0 ? Math.round(spaces) : null,
    floodRisk: choice(input.floodRisk, floodChoices),
    furnished: choice(input.furnished, furnishedChoices),
  };
}

export function siteFromRow(row: Record<string, unknown>): SiteFacts {
  return cleanSite({
    generator: row.generator,
    waterTank: row.water_tank,
    waterNotes: row.water_notes,
    parking: row.parking,
    parkingSpaces: row.parking_spaces,
    floodRisk: row.flood_risk,
    furnished: row.furnished,
  });
}

export function siteColumns(site: SiteFacts): Record<string, string | number | null> {
  return {
    generator: site.generator || null,
    water_tank: site.waterTank || null,
    water_notes: site.waterNotes || null,
    parking: site.parking || null,
    parking_spaces: site.parkingSpaces,
    flood_risk: site.floodRisk || null,
    furnished: site.furnished || null,
  };
}

export function labelForSite(id: string, options: readonly { id: string; label: string }[]) {
  return options.find((item) => item.id === id)?.label || "";
}
