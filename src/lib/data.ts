export type Listing = {
  id: string; title: string; area: string; region: string;
  type: "House" | "Apartment" | "Land" | "Commercial";
  purpose: "Sale" | "Rent"; priceGyd: number; beds: number; baths: number; sqft: number;
  lat: number; lng: number; featured: boolean; status: "live"; agentId: string;
  image: string; amenities: string[]; description: string; views: number;
};
export const agents = [
  { id: "a1", name: "Priya Ramcharran", company: "Demerara Realty", phone: "5926001101", areas: ["Bel Air Park"], rating: 4.9, reviews: 41, verified: true },
];
export const listings: Listing[] = [
  { id: "gy-1042", title: "Raised timber house, Bel Air Park", area: "Bel Air Park", region: "Georgetown", type: "House", purpose: "Sale", priceGyd: 95000000, beds: 4, baths: 3, sqft: 3200, lat: 6.8095, lng: -58.1458, featured: true, status: "live", agentId: "a1", image: "", amenities: [], description: "Sample listing.", views: 1 },
];
export const money = (n: number, purpose: string) => `GYD ${n.toLocaleString()}${purpose === "Rent" ? " / month" : ""}`;
export const usd = (n: number) => Math.round(n / 209);
export const agentById = (id: string) => agents.find((a) => a.id === id) || agents[0];
export const listingById = (id: string) => listings.find((l) => l.id === id);
