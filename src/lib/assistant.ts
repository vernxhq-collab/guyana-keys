import { agents, listings, money, type Listing } from "./data";
import { areas } from "./areas";
export function answer(question: string, source: Listing[] = listings) {
  const q = question.toLowerCase();
  if (q.includes("transport") || q.includes("title") || q.includes("deed")) return "A listing is not proof of title. Ask for the transport or certificate of title, then have a Georgetown attorney search the Deeds Registry before any deposit.";
  if (q.includes("abroad") || q.includes("diaspora")) return "From abroad, save the search and use a power of attorney if you cannot sign in Georgetown. Prices show GYD and an approximate USD figure.";
  const area = areas.find((item) => q.includes(item.name.toLowerCase()));
  const purpose = q.includes("rent") ? "Rent" : q.includes("sale") || q.includes("buy") ? "Sale" : "";
  const matched = source.filter((item) => (!area || item.area === area.name) && (!purpose || item.purpose === purpose) && (area || purpose));
  if (matched.length) return matched.slice(0, 3).map((item) => item.title + ": " + money(item.priceGyd, item.purpose) + " in " + item.area + ".").join(" ");
  if (area) return area.name + " is in " + area.region + ". " + area.note + " No live listing there yet.";
  if (q.includes("agent")) return agents.map((item) => item.name + " at " + item.company).join(". ") + ".";
  return "Ask for a neighbourhood, a house for sale, a rental, or the transport check. I only use Guyana Keys listings.";
}
