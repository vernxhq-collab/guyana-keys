export const FREE_LIVE_CAP = 3;
export const MIN_LIVE_PHOTOS = 3;

export function liveCap(plan: string, listingCap: number) {
  const cap = Number.isFinite(listingCap) && listingCap > 0 ? listingCap : FREE_LIVE_CAP;
  return plan === "agency" ? cap : Math.min(cap, FREE_LIVE_CAP);
}

export function withinLiveCap(liveAlready: number, cap: number) {
  const allowed = Number.isFinite(cap) && cap > 0 ? cap : FREE_LIVE_CAP;
  return liveAlready < allowed;
}
