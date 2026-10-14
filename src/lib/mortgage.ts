import { GYD_PER_USD } from "./data";

export { GYD_PER_USD };

export type BankId = "republic" | "gbti" | "demerara" | "citizens" | "nbs" | "scotia" | "custom";

type Band = { upTo: number | null; rate: number; note?: string };

export const banks: { id: BankId; name: string; source: string; bands: Band[] }[] = [
  {
    id: "republic",
    name: "Republic Bank",
    source: "Approximate public bands for 2026. Confirm the rate with Republic Bank.",
    bands: [
      { upTo: 9_000_000, rate: 3.5 },
      { upTo: 20_000_000, rate: 4.25 },
      { upTo: 60_000_000, rate: 5 },
      { upTo: null, rate: 5, note: "Above the published GYD 60 million band. Enter the rate the bank quoted." },
    ],
  },
  {
    id: "gbti",
    name: "GBTI",
    source: "Approximate public bands from May 2026. GBTI Advantage can be lower. Confirm with GBTI.",
    bands: [
      { upTo: 4_000_000, rate: 3.5 },
      { upTo: 9_000_000, rate: 3.7 },
      { upTo: 20_000_000, rate: 4.25 },
      { upTo: 40_000_000, rate: 4.75 },
      { upTo: 60_000_000, rate: 4.99 },
      { upTo: null, rate: 5.25, note: "Above GYD 60 million the published range is negotiable, about 5.25% to 6.5%." },
    ],
  },
  {
    id: "demerara",
    name: "Demerara Bank",
    source: "Approximate public bands. Confirm with Demerara Bank.",
    bands: [
      { upTo: 4_000_000, rate: 3.5 },
      { upTo: 9_000_000, rate: 3.7 },
      { upTo: 15_000_000, rate: 4.5 },
      { upTo: 40_000_000, rate: 5 },
      { upTo: null, rate: 8, note: "Above GYD 40 million the published guide is about 8%." },
    ],
  },
  {
    id: "citizens",
    name: "Citizens Bank",
    source: "Approximate public bands as of mid-2026. Confirm with Citizens Bank.",
    bands: [
      { upTo: 10_000_000, rate: 3.5 },
      { upTo: 20_000_000, rate: 3.7 },
      { upTo: 30_000_000, rate: 4.6 },
      { upTo: 50_000_000, rate: 5 },
      { upTo: null, rate: 5, note: "Above GYD 50 million, ask Citizens Bank for the rate." },
    ],
  },
  {
    id: "nbs",
    name: "NBS",
    source: "New Building Society has published about 5% on new loans, with a ceiling near GYD 30 million.",
    bands: [
      { upTo: 30_000_000, rate: 5 },
      { upTo: null, rate: 5, note: "This loan is above the published NBS ceiling. Confirm with NBS." },
    ],
  },
  {
    id: "scotia",
    name: "Scotiabank",
    source: "Promotional guide from about 4%. The branch sets the rate.",
    bands: [{ upTo: null, rate: 4, note: "Promotional “from 4%”. Enter the rate the branch quoted." }],
  },
];

export function rateFor(bankId: string, loan: number) {
  const bank = banks.find((item) => item.id === bankId);
  if (!bank) return { rate: 5, note: "Enter the rate you were quoted." };
  const amount = Number.isFinite(loan) && loan > 0 ? loan : 0;
  const band = bank.bands.find((item) => item.upTo == null || amount <= item.upTo) || bank.bands[bank.bands.length - 1];
  return { rate: band.rate, note: band.note || bank.source };
}

export function amortise(loan: number, annualPercent: number, years: number) {
  const principal = Number.isFinite(loan) && loan > 0 ? loan : 0;
  const n = Math.round((Number.isFinite(years) ? years : 0) * 12);
  if (principal <= 0 || n <= 0) return { monthly: 0, totalInterest: 0, totalPaid: 0 };
  const rate = Number.isFinite(annualPercent) && annualPercent > 0 ? annualPercent / 100 / 12 : 0;
  const monthly = rate === 0 ? principal / n : (principal * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
  const totalPaid = monthly * n;
  return { monthly, totalInterest: Math.max(0, totalPaid - principal), totalPaid };
}

export function purchaseEstimate(price: number, stampPercent: number) {
  const base = Number.isFinite(price) && price > 0 ? price : 0;
  const stampRate = stampPercent === 2.5 ? 2.5 : 2;
  const stamp = base * (stampRate / 100);
  const legal = base * 0.015;
  return { stamp, legal, fees: stamp + legal, stampRate };
}

export function gyd(amount: number) {
  return `GYD ${new Intl.NumberFormat("en-GY").format(Math.round(amount || 0))}`;
}

export function usdFromGyd(amount: number) {
  return `USD ${new Intl.NumberFormat("en-US").format(Math.round((amount || 0) / GYD_PER_USD))}`;
}
