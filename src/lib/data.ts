export type Listing = { id: string; title: string; area: string; region: string; type: string; purpose: string; priceGyd: number; beds: number; baths: number; sqft: number; lat: number; lng: number; image: string; description: string; agentId: string; };
export type Agent = { id: string; name: string; company: string; phone: string; areas: string[]; image: string; };
const house = "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80";
const house2 = "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80";
const apt = "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80";
const land = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80";
const office = "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80";
export const agents: Agent[] = [
  { id: "priya", name: "Priya Ramcharran", company: "Demerara Realty", phone: "5926001101", areas: ["Bel Air Park", "Queenstown", "Kitty"], image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80" },
  { id: "marcus", name: "Marcus Singh", company: "Coastal Keys", phone: "5926002202", areas: ["Ogle", "Providence"], image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80" },
  { id: "anita", name: "Anita Persaud", company: "Berbice Homes", phone: "5926003303", areas: ["New Amsterdam"], image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80" }
];
export const listings: Listing[] = [
  { id: "gy-1042", title: "Raised timber house, Bel Air Park", area: "Bel Air Park", region: "Georgetown", type: "House", purpose: "Sale", priceGyd: 95000000, beds: 4, baths: 3, sqft: 3200, lat: 6.8095, lng: -58.1458, image: house, description: "Raised family house. Title transport available for attorney review.", agentId: "priya" },
  { id: "gy-1108", title: "Apartment near the oil corridor, Ogle", area: "Ogle", region: "East Coast Demerara", type: "Apartment", purpose: "Rent", priceGyd: 420000, beds: 2, baths: 2, sqft: 1180, lat: 6.8068, lng: -58.1054, image: apt, description: "Furnished two-bedroom near the Ogle airstrip.", agentId: "marcus" },
  { id: "gy-1180", title: "Residential land, Providence", area: "Providence", region: "East Bank Demerara", type: "Land", purpose: "Sale", priceGyd: 18000000, beds: 0, baths: 0, sqft: 8000, lat: 6.768, lng: -58.155, image: land, description: "House lot near the stadium corridor.", agentId: "marcus" },
  { id: "gy-1214", title: "Office suite, Main Street", area: "Cummingsburg", region: "Georgetown", type: "Commercial", purpose: "Rent", priceGyd: 650000, beds: 0, baths: 2, sqft: 2100, lat: 6.813, lng: -58.158, image: office, description: "Office space on Main Street.", agentId: "priya" },
  { id: "gy-1302", title: "New Amsterdam riverside house", area: "New Amsterdam", region: "Berbice", type: "House", purpose: "Sale", priceGyd: 28000000, beds: 3, baths: 2, sqft: 1540, lat: 6.247, lng: -57.522, image: house2, description: "Town house near the Berbice river.", agentId: "anita" }
];
export function money(price: number, purpose: string) { const formatted = new Intl.NumberFormat("en-GY").format(price); return purpose === "Rent" ? `GYD ${formatted} / month` : `GYD ${formatted}`; }
export function usd(price: number) { return Math.round(price / 209); }
export function listingById(id: string) { return listings.find((item) => item.id === id); }
export function agentById(id: string) { return agents.find((item) => item.id === id) || agents[0]; }
