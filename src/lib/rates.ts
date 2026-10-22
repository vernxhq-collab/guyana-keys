export type MortgageRate = {
  id: string;
  bank: string;
  product: string;
  rate: number;
  sourceUrl: string;
  checkedOn: string;
};

/** Rates read from each bank's own page on 22 Oct 2026. No other rate is included. */
export const publishedRates: MortgageRate[] = [
  { id: "gbti-4m", bank: "GBTI", product: "Standard mortgage, up to $4 million", rate: 3.5, sourceUrl: "https://gbtibank.com/mortgage-centre/", checkedOn: "2026-10-22" },
  { id: "gbti-9m", bank: "GBTI", product: "Standard mortgage, $4 million to $9 million", rate: 3.7, sourceUrl: "https://gbtibank.com/mortgage-centre/", checkedOn: "2026-10-22" },
  { id: "gbti-20m", bank: "GBTI", product: "Standard mortgage, $9 million to $20 million", rate: 4.25, sourceUrl: "https://gbtibank.com/mortgage-centre/", checkedOn: "2026-10-22" },
  { id: "gbti-40m", bank: "GBTI", product: "Standard mortgage, $20 million to $40 million", rate: 4.75, sourceUrl: "https://gbtibank.com/mortgage-centre/", checkedOn: "2026-10-22" },
  { id: "gbti-60m", bank: "GBTI", product: "Standard mortgage, $40 million to $60 million", rate: 4.99, sourceUrl: "https://gbtibank.com/mortgage-centre/", checkedOn: "2026-10-22" },
  { id: "demerara-4m", bank: "Demerara Bank", product: "Residential home loan, up to G$4,000,000", rate: 3.5, sourceUrl: "https://demerarabank.com/home-loans/", checkedOn: "2026-10-22" },
  { id: "demerara-9m", bank: "Demerara Bank", product: "Residential home loan, G$4,000,001 to G$9,000,000", rate: 3.7, sourceUrl: "https://demerarabank.com/home-loans/", checkedOn: "2026-10-22" },
  { id: "demerara-15m", bank: "Demerara Bank", product: "Residential home loan, G$9,000,001 to G$15,000,000", rate: 4.5, sourceUrl: "https://demerarabank.com/home-loans/", checkedOn: "2026-10-22" },
  { id: "demerara-40m", bank: "Demerara Bank", product: "Residential home loan, G$15,000,001 to G$40,000,000", rate: 5, sourceUrl: "https://demerarabank.com/home-loans/", checkedOn: "2026-10-22" },
  { id: "demerara-above", bank: "Demerara Bank", product: "Residential home loan, above G$40,000,000", rate: 8, sourceUrl: "https://demerarabank.com/home-loans/", checkedOn: "2026-10-22" },
  { id: "citizens-10m", bank: "Citizens Bank", product: "Mortgage up to $10 million", rate: 3.5, sourceUrl: "https://citizensbankgy.com/choose-your-mortgage/", checkedOn: "2026-10-22" },
  { id: "citizens-20m", bank: "Citizens Bank", product: "Mortgage up to $20 million", rate: 3.7, sourceUrl: "https://citizensbankgy.com/choose-your-mortgage/", checkedOn: "2026-10-22" },
  { id: "citizens-30m", bank: "Citizens Bank", product: "Mortgage up to $30 million", rate: 4.6, sourceUrl: "https://citizensbankgy.com/choose-your-mortgage/", checkedOn: "2026-10-22" },
  { id: "citizens-50m", bank: "Citizens Bank", product: "Mortgage up to $50 million", rate: 5, sourceUrl: "https://citizensbankgy.com/choose-your-mortgage/", checkedOn: "2026-10-22" },
  { id: "scotia-floor", bank: "Scotiabank Guyana", product: "Published floor for a new mortgage or a switch. Terms apply.", rate: 4, sourceUrl: "https://gy.scotiabank.com/personal/borrowing/mortgages.html", checkedOn: "2026-10-22" },
];

export const ratesStillNeeded = [
  "Republic Bank Guyana: the public rate pages redirected and did not return a rate on 22 Oct 2026, so no Republic Bank rate is stored.",
  "GBTI above $60 million is published as a range, 5.25% to 6.5%, so it is not stored as one rate.",
  "GBTI Advantage rates are published as “as low as” and depend on the banking relationship. Only the standard column is stored.",
  "Citizens Bank over $50 million is described as competitive, with no number on the page.",
  "Scotiabank publishes a floor of 4% with conditions. That floor is stored. A full product table was not on the page.",
  "Stamp duty, transfer costs, and attorney fees had no official schedule cited in this run. Those fields stay blank until you type a figure.",
];

export function rateLine(rate: MortgageRate) {
  const checked = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${rate.checkedOn}T00:00:00Z`));
  return `Rate from ${rate.bank}, checked ${checked}`;
}

/** Inclusive loan bounds, in GYD, taken from each bank's published bands. A null max has no ceiling. */
const loanBands: Record<string, { minLoan: number; maxLoan: number | null }> = {
  "gbti-4m": { minLoan: 0, maxLoan: 4_000_000 },
  "gbti-9m": { minLoan: 4_000_001, maxLoan: 9_000_000 },
  "gbti-20m": { minLoan: 9_000_001, maxLoan: 20_000_000 },
  "gbti-40m": { minLoan: 20_000_001, maxLoan: 40_000_000 },
  "gbti-60m": { minLoan: 40_000_001, maxLoan: 60_000_000 },
  "demerara-4m": { minLoan: 0, maxLoan: 4_000_000 },
  "demerara-9m": { minLoan: 4_000_001, maxLoan: 9_000_000 },
  "demerara-15m": { minLoan: 9_000_001, maxLoan: 15_000_000 },
  "demerara-40m": { minLoan: 15_000_001, maxLoan: 40_000_000 },
  "demerara-above": { minLoan: 40_000_001, maxLoan: null },
  "citizens-10m": { minLoan: 0, maxLoan: 10_000_000 },
  "citizens-20m": { minLoan: 10_000_001, maxLoan: 20_000_000 },
  "citizens-30m": { minLoan: 20_000_001, maxLoan: 30_000_000 },
  "citizens-50m": { minLoan: 30_000_001, maxLoan: 50_000_000 },
  "scotia-floor": { minLoan: 0, maxLoan: null },
};

export function rateForLoan(rates: MortgageRate[], bank: string, loan: number) {
  if (!Number.isFinite(loan) || loan < 0) return null;
  const matches = rates.filter((rate) => {
    if (rate.bank !== bank) return false;
    const band = loanBands[rate.id];
    if (!band) return false;
    return loan >= band.minLoan && (band.maxLoan === null || loan <= band.maxLoan);
  });
  return matches.length === 1 ? matches[0] : null;
}
