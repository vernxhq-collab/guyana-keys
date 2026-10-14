export type PartnerGroup = "Bank" | "Broker" | "Insurance" | "Lawyer" | "Surveyor";

export type Partner = {
  id: string;
  name: string;
  group: PartnerGroup;
  description: string;
  offer: string;
  contact: string;
};

export const partnerGroups: PartnerGroup[] = ["Bank", "Broker", "Insurance", "Lawyer", "Surveyor"];

export const partners: Partner[] = [
  { id: "republic", name: "Republic Bank", group: "Bank", description: "Commercial bank used by many home buyers in Guyana.", offer: "Residential mortgages. The rate depends on the loan size.", contact: "Request an intro. Guyana Keys saves this as a lead." },
  { id: "gbti", name: "GBTI", group: "Bank", description: "Guyana Bank for Trade and Industry.", offer: "Residential mortgages, including published bands from May 2026.", contact: "Request an intro. Guyana Keys saves this as a lead." },
  { id: "demerara", name: "Demerara Bank", group: "Bank", description: "Commercial bank with a published residential loan schedule.", offer: "Home loans up to a published ceiling, then a higher band.", contact: "Request an intro. Guyana Keys saves this as a lead." },
  { id: "citizens", name: "Citizens Bank", group: "Bank", description: "Commercial bank offering home loans.", offer: "Residential mortgages. Terms can run for many years.", contact: "Request an intro. Guyana Keys saves this as a lead." },
  { id: "scotia", name: "Scotiabank", group: "Bank", description: "Scotiabank Guyana.", offer: "Home loans. Promotional rates are set at the branch.", contact: "Request an intro. Guyana Keys saves this as a lead." },
  { id: "nbs", name: "NBS", group: "Bank", description: "New Building Society, a common mortgage lender for owner-occupiers.", offer: "New mortgages around a published 5% guide, with a lending ceiling.", contact: "Request an intro. Guyana Keys saves this as a lead." },
  { id: "broker", name: "Mortgage broker", group: "Broker", description: "No named broker is on this list yet.", offer: "An intro if you want help comparing bank offers.", contact: "Request an intro. Guyana Keys saves this as a lead." },
  { id: "ibgl", name: "IBGL", group: "Insurance", description: "Insurance broker buyers ask about for home cover.", offer: "Home insurance quotes. The insurer sets the premium.", contact: "Get a quote request. Guyana Keys saves this as a lead." },
  { id: "assuria", name: "Assuria", group: "Insurance", description: "Insurer active in Guyana.", offer: "Home and property cover. Confirm the policy wording.", contact: "Get a quote request. Guyana Keys saves this as a lead." },
  { id: "monarch", name: "Monarch", group: "Insurance", description: "Insurer buyers ask about for house cover.", offer: "Home insurance. Confirm what the policy actually pays.", contact: "Get a quote request. Guyana Keys saves this as a lead." },
  { id: "pp", name: "P&P", group: "Insurance", description: "Insurance broker buyers ask about in Georgetown.", offer: "A broker quote for home cover.", contact: "Get a quote request. Guyana Keys saves this as a lead." },
  { id: "lawyer", name: "Conveyancing attorney", group: "Lawyer", description: "A Georgetown attorney searches the registry. This card is not one named firm.", offer: "Title search, agreement of sale, and transport or certificate of title.", contact: "Request an intro. Guyana Keys saves this as a lead." },
  { id: "surveyor", name: "Land surveyor", group: "Surveyor", description: "A surveyor checks the lot against the plan. This card is not one named firm.", offer: "Boundary and cadastral surveys before you rely on a plan.", contact: "Request an intro. Guyana Keys saves this as a lead." },
];

export function partnerById(id: string) {
  return partners.find((item) => item.id === id);
}
