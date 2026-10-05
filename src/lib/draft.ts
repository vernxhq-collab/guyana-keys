import { areas } from "./areas";
export function draftListing(notes: string) {
  const text = notes.trim();
  const area = areas.find((item) => text.toLowerCase().includes(item.name.toLowerCase()));
  const beds = text.match(/(\d+)\s*bed/i);
  const price = text.match(/(\d[\d,]*)/);
  const purpose = /rent/i.test(text) ? "Rent" : "Sale";
  const type = /land|lot/i.test(text) ? "Land" : /apartment|flat/i.test(text) ? "Apartment" : /office|commercial/i.test(text) ? "Commercial" : "House";
  const missing = [area ? "" : "area", beds || type === "Land" ? "" : "beds", price ? "" : "price"].filter(Boolean);
  const title = `${beds ? beds[1] + "-bed " : ""}${type.toLowerCase()} in ${area?.name || "Guyana"}`;
  const description = `${text} Listed as ${purpose.toLowerCase()} in ${area?.name || "an area still to confirm"}. A buyer should ask for the transport or title reference before any deposit.`;
  return { title, description, purpose, type, area: area?.name || "", beds: beds?.[1] || "", price: price?.[1] || "", missing };
}
export function draftReply(name: string, listing: string) {
  return `Hello ${name}, this is Guyana Keys about ${listing}. Are you buying from abroad, or can you view in Georgetown? I can send the transport reference before any deposit.`;
}
