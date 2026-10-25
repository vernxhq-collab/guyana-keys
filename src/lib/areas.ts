export function areaByName(name: string) {
  const key = name.trim().toLowerCase();
  return areas.find((item) => item.name.toLowerCase() === key);
}

export function areaFits(listingArea: string, wanted: string) {
  const listing = listingArea.trim().toLowerCase();
  const want = wanted.trim().toLowerCase();
  if (!want) return true;
  if (!listing) return false;
  return listing === want || listing.startsWith(`${want} `);
}

export function regionSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function regionIn(text: string) {
  const q = text.toLowerCase();
  const names = [...new Set(areas.map((item) => item.region))].sort((a, b) => b.length - a.length);
  const named = names.find((name) => q.includes(name.toLowerCase()));
  if (named) return named;
  if (q.includes("east bank")) return "East Bank Demerara";
  if (q.includes("east coast")) return "East Coast Demerara";
  if (q.includes("west coast")) return "West Coast Demerara";
  if (q.includes("berbice")) return "Berbice";
  if (/\blinden\b/.test(q) && !q.includes("linden highway")) return "Upper Demerara";
  return "";
}

const areaNotes: Record<string, { pros: string[]; cons: string[] }> = {
  "bel-air-park": {
    pros: ["Gated residential streets.", "Often the first neighbourhood diaspora buyers search."],
    cons: ["Asking prices are among the higher ones on Guyana Keys.", "Confirm the papers before any deposit."],
  },
  "bel-air": {
    pros: ["Residential streets beside Bel Air Park.", "Close to the commercial core of Georgetown."],
    cons: ["Prices vary street by street.", "Confirm transport or certificate of title before any deposit."],
  },
  ogle: {
    pros: ["Near the Ogle airstrip.", "Rentals serve people working the oil corridor."],
    cons: ["The East Coast public road is busy.", "Oil-corridor rents can move faster than other villages."],
  },
  providence: {
    pros: ["Land and schemes near the stadium.", "A common search for buyers who want space outside the city."],
    cons: ["Ask whether the lot is transport, certificate of title, or lease.", "Roads and drainage differ by scheme."],
  },
  diamond: {
    pros: ["A main search for family houses on the East Bank.", "Closer to shops and schools than the highway villages."],
    cons: ["The East Bank public road is slow at peak times.", "Compare asking prices only against live Guyana Keys listings."],
  },
  eccles: {
    pros: ["Schemes close to Georgetown.", "A shorter East Bank commute than Diamond or Providence."],
    cons: ["Not enough live sales on Guyana Keys to call a price high or low.", "Title still needs a registry search."],
  },
  linden: {
    pros: ["The main town up the Demerara.", "Houses and land sit in a market of their own, away from Georgetown prices."],
    cons: ["The drive from Georgetown is long.", "The listing volume on Guyana Keys is thin."],
  },
  "new-amsterdam": {
    pros: ["The main Berbice town.", "Riverside houses are a different market from Georgetown."],
    cons: ["Distance from the oil corridor.", "Use a Berbice or Georgetown attorney for the title search."],
  },
};

const marketPrice = "Not enough sales on Guyana Keys yet.";
const marketYield = "Not enough rentals on Guyana Keys yet.";

export function areaDetail(area: (typeof areas)[number]) {
  const extra = areaNotes[area.slug];
  return {
    ...area,
    pros: extra?.pros || [`${area.name} is in ${area.region}.`, "Listings on this page are the ones agents have published."],
    cons: extra?.cons || ["There are not enough Guyana Keys sales here for an average price."],
    averagePrice: marketPrice,
    rentalYield: marketYield,
  };
}

export const regionGuides = [
  { slug: "east-bank-demerara", name: "East Bank Demerara", about: "Eccles, Providence, Diamond, and the villages down the East Bank public road. Family houses and house lots are the usual search.", pros: ["A wide range of schemes within a drive of Georgetown.", "Providence and Diamond are among the most searched names."], cons: ["Peak traffic on the public road.", "Title can be transport, certificate of title, or lease. Ask which one."] },
  { slug: "east-coast-demerara", name: "East Coast Demerara", about: "Ogle through Mahaica, including the oil-corridor rentals near the airstrip and the villages further east.", pros: ["Ogle is the rental search for the oil corridor.", "Villages further east still have houses and house lots."], cons: ["The public road is congested.", "Rents near Ogle are not a guide for Lusignan or Mahaica."] },
  { slug: "berbice", name: "Berbice", about: "New Amsterdam, the Corentyne towns, and the west-bank crossing at Rosignol.", pros: ["Town houses at asking prices well below Bel Air.", "A real market for people who live and work in Berbice."], cons: ["It is a long way from Georgetown and the oil corridor.", "Have the title searched before sending money from abroad."] },
  { slug: "upper-demerara", name: "Linden", about: "Linden is the mining town in Upper Demerara. Treat it as its own market.", pros: ["Houses and land away from Georgetown prices.", "People who work in Linden actually search here."], cons: ["Thin listing volume.", "The highway drive is long, and a Georgetown price is the wrong comparison."] },
  { slug: "georgetown", name: "Georgetown", about: "Bel Air, Kitty, Queenstown, and the other city neighbourhoods buyers name first.", pros: ["The deepest set of named neighbourhoods on Guyana Keys.", "Walkable to offices, schools, and the seawall in several wards."], cons: ["Asking prices in Bel Air Park are not a guide for Ruimveldt.", "Drainage and title both need a proper check."] },
];

export function regionGuide(name: string) {
  const slug = regionSlug(name);
  const guide = regionGuides.find((item) => item.slug === slug);
  return {
    slug,
    name: guide?.name || name,
    about: guide?.about || `Neighbourhoods in ${name}.`,
    pros: guide?.pros || ["Live listings are the ones agents have published on Guyana Keys."],
    cons: guide?.cons || ["Average price and rental yield wait until more sales are on Guyana Keys."],
    areas: areas.filter((item) => item.region === name),
    averagePrice: marketPrice,
    rentalYield: marketYield,
  };
}

export const areas = [
  { slug: "bel-air-park", name: "Bel Air Park", region: "Georgetown", note: "Gated residential streets." },
  { slug: "bel-air", name: "Bel Air", region: "Georgetown", note: "Residential streets beside the park." },
  { slug: "queenstown", name: "Queenstown", region: "Georgetown", note: "Older houses close to the commercial core." },
  { slug: "kitty", name: "Kitty", region: "Georgetown", note: "Family houses near the seawall." },
  { slug: "campbellville", name: "Campbellville", region: "Georgetown", note: "Central family neighbourhood." },
  { slug: "lamaha-gardens", name: "Lamaha Gardens", region: "Georgetown", note: "Established residential streets." },
  { slug: "prashad-nagar", name: "Prashad Nagar", region: "Georgetown", note: "Scheme houses near the city." },
  { slug: "subryanville", name: "Subryanville", region: "Georgetown", note: "Small residential pocket beside Bel Air." },
  { slug: "alberttown", name: "Alberttown", region: "Georgetown", note: "Older streets near the centre." },
  { slug: "cummingsburg", name: "Cummingsburg", region: "Georgetown", note: "Offices and mixed buildings." },
  { slug: "kingston", name: "Kingston", region: "Georgetown", note: "Seawall edge of the city." },
  { slug: "ruimveldt", name: "Ruimveldt", region: "Georgetown", note: "South Georgetown family houses." },
  { slug: "festival-city", name: "Festival City", region: "Georgetown", note: "Scheme housing in south Georgetown." },
  { slug: "ogle", name: "Ogle", region: "East Coast Demerara", note: "Rentals near the airstrip and oil corridor." },
  { slug: "better-hope", name: "Better Hope", region: "East Coast Demerara", note: "East Coast housing schemes." },
  { slug: "plaisance", name: "Plaisance", region: "East Coast Demerara", note: "Village on the city boundary." },
  { slug: "beterverwagting", name: "Beterverwagting", region: "East Coast Demerara", note: "Houses along the public road." },
  { slug: "mon-repos", name: "Mon Repos", region: "East Coast Demerara", note: "Market village on the East Coast." },
  { slug: "lusignan", name: "Lusignan", region: "East Coast Demerara", note: "Scheme and village housing." },
  { slug: "buxton", name: "Buxton", region: "East Coast Demerara", note: "Historic village, houses and land." },
  { slug: "enmore", name: "Enmore", region: "East Coast Demerara", note: "Houses and house lots past Buxton." },
  { slug: "mahaica", name: "Mahaica", region: "East Coast Demerara", note: "Eastern end of the coast road." },
  { slug: "eccles", name: "Eccles", region: "East Bank Demerara", note: "Schemes close to Georgetown." },
  { slug: "providence", name: "Providence", region: "East Bank Demerara", note: "Land and schemes near the stadium." },
  { slug: "diamond", name: "Diamond", region: "East Bank Demerara", note: "A main search for family houses." },
  { slug: "herstelling", name: "Herstelling", region: "East Bank Demerara", note: "Between Providence and Diamond." },
  { slug: "mocha", name: "Mocha", region: "East Bank Demerara", note: "Houses and house lots." },
  { slug: "soesdyke", name: "Soesdyke", region: "East Bank Demerara", note: "Junction on the Linden highway." },
  { slug: "vreed-en-hoop", name: "Vreed-en-Hoop", region: "West Coast Demerara", note: "The town across the new bridge." },
  { slug: "parika", name: "Parika", region: "East Bank Essequibo", note: "Market town and stelling." },
  { slug: "tuschen", name: "Tuschen", region: "West Coast Demerara", note: "West Coast housing schemes." },
  { slug: "leonora", name: "Leonora", region: "West Coast Demerara", note: "Village houses and land." },
  { slug: "new-amsterdam", name: "New Amsterdam", region: "Berbice", note: "Berbice town houses." },
  { slug: "rose-hall", name: "Rose Hall", region: "Berbice", note: "Corentyne town." },
  { slug: "corriverton", name: "Corriverton", region: "Berbice", note: "Eastern Corentyne town." },
  { slug: "rosignol", name: "Rosignol", region: "Berbice", note: "West Berbice river crossing." },
  { slug: "linden", name: "Linden", region: "Upper Demerara", note: "Mining town up the Demerara." },
  { slug: "bartica", name: "Bartica", region: "Cuyuni-Mazaruni", note: "Essequibo river town." },
  { slug: "lethem", name: "Lethem", region: "Rupununi", note: "Gateway town to the Rupununi, on the border with Brazil." },
  { slug: "anna-regina", name: "Anna Regina", region: "Essequibo", note: "Essequibo coast town." }
];

/** Approximate centre of the neighbourhood, for a map pin when a listing has no coordinates. */
export const areaCenters: Record<string, { lat: number; lng: number }> = {
  "bel-air-park": { lat: 6.809, lng: -58.146 },
  "bel-air": { lat: 6.812, lng: -58.14 },
  queenstown: { lat: 6.816, lng: -58.16 },
  kitty: { lat: 6.825, lng: -58.14 },
  campbellville: { lat: 6.82, lng: -58.148 },
  "lamaha-gardens": { lat: 6.815, lng: -58.145 },
  "prashad-nagar": { lat: 6.818, lng: -58.155 },
  subryanville: { lat: 6.811, lng: -58.142 },
  alberttown: { lat: 6.812, lng: -58.162 },
  cummingsburg: { lat: 6.813, lng: -58.158 },
  kingston: { lat: 6.826, lng: -58.162 },
  ruimveldt: { lat: 6.792, lng: -58.16 },
  "festival-city": { lat: 6.788, lng: -58.155 },
  ogle: { lat: 6.807, lng: -58.105 },
  "better-hope": { lat: 6.81, lng: -58.09 },
  plaisance: { lat: 6.82, lng: -58.11 },
  beterverwagting: { lat: 6.815, lng: -58.07 },
  "mon-repos": { lat: 6.82, lng: -58.05 },
  lusignan: { lat: 6.82, lng: -58.02 },
  buxton: { lat: 6.83, lng: -57.98 },
  enmore: { lat: 6.835, lng: -57.95 },
  mahaica: { lat: 6.85, lng: -57.9 },
  eccles: { lat: 6.785, lng: -58.165 },
  providence: { lat: 6.768, lng: -58.175 },
  diamond: { lat: 6.73, lng: -58.18 },
  herstelling: { lat: 6.75, lng: -58.175 },
  mocha: { lat: 6.71, lng: -58.185 },
  soesdyke: { lat: 6.55, lng: -58.2 },
  "vreed-en-hoop": { lat: 6.81, lng: -58.19 },
  parika: { lat: 6.84, lng: -58.43 },
  tuschen: { lat: 6.83, lng: -58.25 },
  leonora: { lat: 6.85, lng: -58.28 },
  "new-amsterdam": { lat: 6.247, lng: -57.522 },
  "rose-hall": { lat: 6.27, lng: -57.35 },
  corriverton: { lat: 5.9, lng: -57.15 },
  rosignol: { lat: 6.27, lng: -57.54 },
  linden: { lat: 6.0, lng: -58.3 },
  bartica: { lat: 6.4, lng: -58.62 },
  lethem: { lat: 3.38, lng: -59.8 },
  "anna-regina": { lat: 7.26, lng: -58.48 },
};

export function centerForArea(name: string) {
  const area = areaByName(name);
  if (!area) return null;
  return areaCenters[area.slug] || null;
}

export function areaBySlug(slug: string) {
  return areas.find((item) => item.slug === slug.trim().toLowerCase()) || null;
}
