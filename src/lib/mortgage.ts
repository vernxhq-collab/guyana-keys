import { GYD_PER_USD } from "./data";

export { GYD_PER_USD };

export function amortise(loan: number, annualPercent: number, years: number) {
  const principal = Number.isFinite(loan) && loan > 0 ? loan : 0;
  const n = Math.round((Number.isFinite(years) ? years : 0) * 12);
  if (principal <= 0 || n <= 0) return { monthly: 0, totalInterest: 0, totalPaid: 0 };
  const rate = Number.isFinite(annualPercent) && annualPercent > 0 ? annualPercent / 100 / 12 : 0;
  const monthly = rate === 0 ? principal / n : (principal * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
  const totalPaid = monthly * n;
  return { monthly, totalInterest: Math.max(0, totalPaid - principal), totalPaid };
}

export function purchaseEstimate(stampGyd: number, legalGyd: number) {
  const stamp = Number.isFinite(stampGyd) && stampGyd > 0 ? stampGyd : 0;
  const legal = Number.isFinite(legalGyd) && legalGyd > 0 ? legalGyd : 0;
  return { stamp, legal, fees: stamp + legal };
}

export function groupAmount(raw: string) {
  const cleaned = raw.replace(/[^\d.]/g, "");
  if (!cleaned) return "";
  const [whole, frac] = cleaned.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return frac !== undefined ? `${grouped}.${frac.slice(0, 2)}` : grouped;
}

export function gyd(amount: number) {
  return `GYD ${new Intl.NumberFormat("en-GY").format(Math.round(amount || 0))}`;
}

export function usdFromGyd(amount: number) {
  return `USD ${new Intl.NumberFormat("en-US").format(Math.round((amount || 0) / GYD_PER_USD))}`;
}
