export type Mine = { saved: string[]; enquired: string[] };

const empty: Mine = { saved: [], enquired: [] };

export function readMine(userId: string): Mine {
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem("gk-mine-" + userId);
    if (!raw) return empty;
    const data = JSON.parse(raw) as Partial<Mine>;
    return {
      saved: Array.isArray(data.saved) ? data.saved : [],
      enquired: Array.isArray(data.enquired) ? data.enquired : [],
    };
  } catch {
    return empty;
  }
}

export function writeMine(userId: string, mine: Mine) {
  localStorage.setItem("gk-mine-" + userId, JSON.stringify(mine));
}
