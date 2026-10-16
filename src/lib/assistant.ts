import { findArea, parseBuyerSearch } from "./assist";
import { areaDetail, areaFits } from "./areas";
import { money, type Listing } from "./data";

export function answer(question: string, source: Listing[] = [], people: { name: string; company: string }[] = []) {
  const q = question.toLowerCase();
  if (q.includes("scam") || q.includes("fraud") || (q.includes("deposit") && q.includes("before"))) {
    return "Do not send a deposit before a Georgetown attorney searches the Deeds Registry. Keep the conversation on Guyana Keys, and do not pay a stranger off the site.";
  }
  if (q.includes("transport") || q.includes("title") || q.includes("deed")) return "A listing is not proof of title. Ask for the transport or certificate of title, then have a Georgetown attorney search the Deeds Registry before any deposit.";
  if (q.includes("abroad") || q.includes("diaspora") || q.includes("power of attorney")) return "From abroad, save the search and use a power of attorney if you cannot sign in Georgetown. Prices show GYD and an approximate USD figure. Have the attorney search the title before any deposit.";
  const area = findArea(question);
  if (area && /price (high|low)|overpriced|too (high|much)|cheap for|is this price/.test(q)) {
    const sales = source.filter((item) => areaFits(item.area, area.name) && item.purpose === "Sale" && item.priceGyd > 0);
    if (sales.length < 3) return `${area.name}: not enough live sales on Guyana Keys to say if a price is high. ${area.note} This is not a valuation.`;
    const prices = sales.map((item) => item.priceGyd).sort((a, b) => a - b);
    const mid = prices[Math.floor(prices.length / 2)];
    return `Live asking prices in ${area.name} run from ${money(prices[0], "Sale")} to ${money(prices[prices.length - 1], "Sale")}. The middle asking price is ${money(mid, "Sale")}. This compares listings on Guyana Keys. It is not a valuation.`;
  }
  if (area && /before buying|should i know|what to know|worth knowing|pros|cons/.test(q)) {
    const detail = areaDetail(area);
    return `${area.name} is in ${area.region}. ${area.note} Worth knowing: ${detail.pros.join(" ")} Watch for: ${detail.cons.join(" ")} Average price: ${detail.averagePrice} Rental yield: ${detail.rentalYield}`;
  }
  const parsed = parseBuyerSearch(question);
  const matched = source.filter((item) => {
    if (parsed.area && !areaFits(item.area, parsed.area)) return false;
    if (parsed.purpose && item.purpose !== parsed.purpose) return false;
    if (parsed.beds && item.beds < parsed.beds) return false;
    if (parsed.maxPrice && item.priceGyd > parsed.maxPrice) return false;
    return Boolean(parsed.area || parsed.purpose || parsed.beds || parsed.maxPrice);
  });
  if (matched.length) return matched.slice(0, 3).map((item) => item.title + ": " + money(item.priceGyd, item.purpose) + " in " + item.area + ".").join(" ");
  if (area) return area.name + " is in " + area.region + ". " + area.note + " No live listing matches that yet.";
  if (q.includes("agent")) {
    if (!people.length) return "No agents are listed on Guyana Keys yet.";
    return people.map((item) => item.company ? `${item.name} at ${item.company}` : item.name).join(". ") + ".";
  }
  return "Ask for a neighbourhood, a house for sale, a rental, a price check, or the transport check. I only use Guyana Keys listings.";
}
