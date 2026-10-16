import type { PlaceFacts } from "./place-facts";

export type Listing = { id: string; title: string; area: string; region: string; type: string; purpose: string; priceGyd: number; beds: number; baths: number; sqft: number; lat: number; lng: number; image: string; description: string; agentId: string; photos?: string[]; featured?: boolean; status?: "live" | "hidden"; titleRef?: string; titleStatus?: string; facts?: PlaceFacts; };
export type Agent = { id: string; name: string; company: string; phone: string; areas: string[]; image: string; address?: string; graLicence?: string; verified?: boolean; };

export const GYD_PER_USD = 209;
export function money(price: number, purpose: string) { const formatted = new Intl.NumberFormat("en-GY").format(price); return purpose === "Rent" ? `GYD ${formatted} / month` : `GYD ${formatted}`; }
export function usd(price: number) { return Math.round(price / GYD_PER_USD); }
