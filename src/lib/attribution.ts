export type LeadChannel = "web" | "email" | "whatsapp";

export type LeadAttribution = {
  source_page: string;
  lead_channel: LeadChannel;
  utm: Record<string, string>;
  lead_kind: "enquiry" | "title_check" | "intro";
  partner_id: string;
};

function clip(value: unknown, max = 180) {
  return String(value || "").trim().slice(0, max);
}

export function attributionFromBody(body: Record<string, unknown>, fallbackPage = ""): LeadAttribution {
  const channel = body.channel === "email" || body.channel === "whatsapp" ? body.channel : "web";
  const kind = body.leadKind === "title_check" || body.leadKind === "intro" ? body.leadKind : "enquiry";
  const utm = {
    source: clip(body.utmSource, 80),
    medium: clip(body.utmMedium, 80),
    campaign: clip(body.utmCampaign, 80),
    term: clip(body.utmTerm, 80),
    content: clip(body.utmContent, 80),
  };
  return {
    source_page: clip(body.page || fallbackPage, 240),
    lead_channel: channel,
    utm: Object.fromEntries(Object.entries(utm).filter(([, value]) => value)),
    lead_kind: kind,
    partner_id: clip(body.partnerId, 80),
  };
}

export function formatLeadSource(row: Record<string, unknown>) {
  const channel = typeof row.lead_channel === "string" && row.lead_channel ? row.lead_channel : "web";
  const page = typeof row.source_page === "string" ? row.source_page : "";
  const utm = row.utm && typeof row.utm === "object" ? row.utm as Record<string, unknown> : {};
  const utmText = ["source", "medium", "campaign", "term", "content"]
    .map((key) => (typeof utm[key] === "string" && utm[key] ? `${key}=${utm[key]}` : ""))
    .filter(Boolean)
    .join(" ");
  return ["Guyana Keys", channel, page, utmText].filter(Boolean).join(" · ");
}

/** Third-party photographs. Each row is copied from docs/redesign/IMAGE-CREDITS.md. */
export type PhotoCredit = {
  file: string;
  subject: string;
  source: string;
  author: string;
  licence: string;
  licenceHref: string;
};

export const homepageImageCredit = "Homepage image: illustrative image created for Guyana Keys.";

/** No third-party photograph is used on the public site. */
export const photoCredits: PhotoCredit[] = [];
