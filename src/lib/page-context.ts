export function pageAttribution(extra: { leadKind?: string; partnerId?: string } = {}) {
  const params = typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
  return {
    page: typeof window === "undefined" ? "" : window.location.pathname,
    channel: "web",
    utmSource: params.get("utm_source") || "",
    utmMedium: params.get("utm_medium") || "",
    utmCampaign: params.get("utm_campaign") || "",
    utmTerm: params.get("utm_term") || "",
    utmContent: params.get("utm_content") || "",
    leadKind: extra.leadKind || "enquiry",
    partnerId: extra.partnerId || "",
  };
}
