import { areaByName, areas } from "./areas";
import { money, type Listing } from "./data";

export type AssistHome = {
  id: string;
  title: string;
  area: string;
  purpose: string;
  beds: number;
  baths: number;
  priceGyd: number;
  type: string;
};

export type LeadInput = {
  name?: string;
  listing?: string;
  stage?: string;
  abroad?: boolean;
  note?: string;
  createdAt?: string;
  agentReply?: string;
  viewingAt?: string | null;
  viewingRequest?: string | null;
};

const longestAreas = [...areas].sort((a, b) => b.name.length - a.name.length);

export function findArea(text: string) {
  const q = text.toLowerCase();
  return longestAreas.find((item) => q.includes(item.name.toLowerCase()));
}

export function parsePrice(text: string): number | null {
  const cleaned = text
    .replace(/\d+\s*-?\s*bed(rooms?)?/gi, " ")
    .replace(/\d+\s*-?\s*bath(rooms?)?/gi, " ")
    .replace(/\d[\d,]*\s*(sq\.?\s*ft|sqft|ft2)/gi, " ");
  const million = cleaned.match(/(\d[\d,]*(?:\.\d+)?)\s*(million|mn)\b/i) || cleaned.match(/(\d[\d,]*(?:\.\d+)?)\s*m\b/i);
  if (million) {
    const value = Number(million[1].replace(/,/g, ""));
    if (Number.isFinite(value) && value > 0) return Math.round(value * 1_000_000);
  }
  const thousand = cleaned.match(/(\d[\d,]*(?:\.\d+)?)\s*(thousand|k)\b/i);
  if (thousand) {
    const value = Number(thousand[1].replace(/,/g, ""));
    if (Number.isFinite(value) && value > 0) return Math.round(value * 1000);
  }
  const labelled = cleaned.match(/(?:gyd|gy\$|price|asking|rent)\s*:?\s*([\d,]{4,})/i);
  if (labelled) {
    const value = Number(labelled[1].replace(/,/g, ""));
    if (Number.isFinite(value) && value > 0) return value;
  }
  const big = cleaned.match(/\b(\d{6,})\b/);
  if (big) return Number(big[1]);
  return null;
}

export function parseBuyerSearch(query: string) {
  const q = query.toLowerCase();
  const purpose = /\brent|lease|tenant\b/.test(q) ? "Rent" : /\bsale|buy|purchase\b/.test(q) ? "Sale" : "";
  const area = findArea(query)?.name || "";
  const bedsMatch = q.match(/(\d+)\s*-?\s*bed/);
  const beds = bedsMatch ? Number(bedsMatch[1]) : 0;
  let maxPrice = 0;
  const under = q.match(/(?:under|below|max|less than|up to|<)\s*([\d,.]+)\s*(million|mn|m|thousand|k)?/);
  if (under) {
    const raw = Number(under[1].replace(/,/g, ""));
    const unit = under[2] || "";
    if (Number.isFinite(raw) && raw > 0) {
      maxPrice = /million|mn|^m$/.test(unit) ? Math.round(raw * 1_000_000) : /thousand|^k$/.test(unit) ? Math.round(raw * 1000) : raw < 1000 ? Math.round(raw * 1_000_000) : raw;
    }
  } else {
    const hinted = parsePrice(query);
    if (hinted && /under|below|max|budget/.test(q)) maxPrice = hinted;
  }
  return { purpose, area, beds, maxPrice };
}

function whyLine(home: AssistHome, parsed: ReturnType<typeof parseBuyerSearch>) {
  const bits = [`This ${home.beds ? home.beds + " bed " : ""}${home.type.toLowerCase()} is for ${home.purpose === "Rent" ? "rent" : "sale"} in ${home.area || "Guyana"} at ${money(home.priceGyd, home.purpose)}.`];
  if (parsed.area && home.area === parsed.area) bits.push(`It is in ${parsed.area}.`);
  if (parsed.beds && home.beds >= parsed.beds) bits.push(`It has at least ${parsed.beds} bed${parsed.beds === 1 ? "" : "s"}.`);
  if (parsed.maxPrice && home.priceGyd <= parsed.maxPrice) bits.push("It is within the price you named.");
  return bits.join(" ");
}

export function buyerSearch(query: string, homes: AssistHome[]) {
  const parsed = parseBuyerSearch(query);
  const understood = Boolean(parsed.purpose || parsed.area || parsed.beds || parsed.maxPrice);
  const matches = understood
    ? homes.filter((home) => {
        if (parsed.purpose && home.purpose !== parsed.purpose) return false;
        if (parsed.area && home.area !== parsed.area) return false;
        if (parsed.beds && home.beds < parsed.beds) return false;
        if (parsed.maxPrice && home.priceGyd > parsed.maxPrice) return false;
        return true;
      })
    : [];
  return {
    ...parsed,
    understood,
    matches: matches.map((home) => ({ id: home.id, why: whyLine(home, parsed) })),
  };
}

export function listingDraft(notes: string) {
  const text = notes.trim();
  if (!text) return { error: "Type a few notes first." };
  const area = findArea(text);
  const beds = text.match(/(\d+)\s*-?\s*bed/i);
  const baths = text.match(/(\d+)\s*-?\s*bath/i);
  const purpose = /\brent|lease\b/i.test(text) ? "Rent" : "Sale";
  const type = /\bland|lot\b/i.test(text) ? "Land" : /\bapartment|flat\b/i.test(text) ? "Apartment" : /\boffice|commercial|shop\b/i.test(text) ? "Commercial" : "House";
  const priceGyd = parsePrice(text);
  const bedLabel = beds ? `${beds[1]}-bed ` : "";
  const title = `${bedLabel}${type.toLowerCase()} in ${area?.name || "Guyana"}`;
  const place = area?.name || "an area still to name";
  const description = `${text}\n\nListed for ${purpose.toLowerCase()} in ${place}. A listing is not proof of title. Ask for the transport or certificate of title before any deposit.`;
  return {
    title: title.charAt(0).toUpperCase() + title.slice(1),
    description,
    purpose,
    type,
    area: area?.name || "",
    region: area?.region || "",
    beds: beds ? beds[1] : "",
    baths: baths ? baths[1] : "",
    priceGyd,
    priceIsSuggestion: priceGyd != null,
  };
}

export function whenLabel(iso?: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GY", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Guyana" }).format(date);
}

export function replyDraft(input: LeadInput) {
  const name = (input.name || "there").trim() || "there";
  const listing = (input.listing || "this home").trim() || "this home";
  if (input.viewingAt) {
    return { message: `Hello ${name}, the viewing for ${listing} is set for ${whenLabel(input.viewingAt)}. Reply here if that time does not work. A listing is not proof of title.` };
  }
  return { message: `Hello ${name}, thank you for asking about ${listing} on Guyana Keys. Tell me a day that suits you, and whether you are buying from abroad. A listing is not proof of title.` };
}

export function leadScore(lead: LeadInput) {
  const stage = lead.stage || "new";
  const created = lead.createdAt ? new Date(lead.createdAt).getTime() : Date.now();
  const ageHours = Number.isFinite(created) ? (Date.now() - created) / 36e5 : 0;
  const unanswered = !(lead.agentReply || "").trim() && stage !== "closed";
  const overdue = unanswered && ageHours >= 24;
  let score: "High" | "Warm" | "New" = "New";
  if (stage === "offer" || lead.abroad || overdue) score = "High";
  else if (lead.viewingRequest || lead.viewingAt || stage === "contacted" || stage === "viewing" || (lead.note || "").trim().length > 20) score = "Warm";
  let sentence = "This enquiry is new.";
  if (overdue) sentence = "No reply for over 24 hours.";
  else if (lead.abroad) sentence = "This buyer said they are buying from abroad.";
  else if (lead.viewingRequest && !lead.viewingAt) sentence = "They asked for a viewing.";
  else if (lead.viewingAt) sentence = "A viewing time is set.";
  else if (stage === "offer") sentence = "This lead is at the offer stage.";
  else if ((lead.agentReply || "").trim()) sentence = "A reply is already saved on this lead.";
  let nextStep = "Reply today";
  if (stage === "closed") nextStep = "Ask for a review";
  else if (lead.viewingRequest && !lead.viewingAt) nextStep = "Confirm the viewing";
  else if (lead.viewingAt) nextStep = "Meet at the viewing";
  else if (!unanswered) nextStep = "Follow up";
  return { score, sentence, nextStep, reminder: overdue };
}

export function adminSummary(input: { agentName?: string; kind?: string; listingTitle?: string; status?: string }) {
  const who = (input.agentName || "An agent").trim() || "An agent";
  const kind = input.kind || "help";
  const what = kind === "plan" ? "asked to upgrade their package" : kind === "feature" ? `asked to feature ${input.listingTitle || "a listing"}` : "sent a help message";
  let next = "Read the request";
  if (input.status === "submitted" && kind === "help") next = "Mark the help request done when it is handled";
  else if (input.status === "submitted") next = "Send payment instructions";
  else if (input.status === "instructions") next = "Mark paid when the payment arrives";
  else next = "Nothing else to do on this request";
  return { line: `${who} ${what}. Next: ${next}.` };
}

export function runAssist(task: string, body: Record<string, unknown>) {
  if (task === "buyer-search") {
    const homes = Array.isArray(body.homes) ? (body.homes as AssistHome[]).slice(0, 50) : [];
    return buyerSearch(String(body.query || ""), homes);
  }
  if (task === "listing-draft") return listingDraft(String(body.notes || ""));
  if (task === "price-hint") {
    const priceGyd = parsePrice(String(body.notes || ""));
    return { priceGyd, priceIsSuggestion: priceGyd != null, note: priceGyd == null ? "The notes did not include a price." : "Suggestion" };
  }
  if (task === "reply-draft") return replyDraft((body.lead || body) as LeadInput);
  if (task === "lead-score") return leadScore((body.lead || body) as LeadInput);
  if (task === "admin-summary") return adminSummary(body as { agentName?: string; kind?: string; listingTitle?: string; status?: string });
  throw new Error("Unknown task");
}

export function homeToAssist(listing: Listing): AssistHome {
  return { id: listing.id, title: listing.title, area: listing.area, purpose: listing.purpose, beds: listing.beds, baths: listing.baths, priceGyd: listing.priceGyd, type: listing.type };
}

export { areaByName };
