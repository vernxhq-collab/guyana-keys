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
