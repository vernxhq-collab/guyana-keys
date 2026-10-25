import { GYD_PER_USD } from "./data";

/** Owner sets this when the guide rate is confirmed. Leave empty until then. */
export const usdGuideAsOf = "";

export function usdGuideNote() {
  const rate = `USD figures use an indicative guide of ${GYD_PER_USD} GYD to 1 USD.`;
  if (!usdGuideAsOf.trim()) return `${rate} Indicative rate. Check before you transact.`;
  return `${rate} Guide rate set on ${usdGuideAsOf}. Your bank's rate on the day will differ.`;
}
