// Pure helpers for two-step sign-in. No network, so scripts can test them.

/**
 * Reads the assurance level from an access token. Only call this with a token that
 * has already been accepted by Supabase (readSession / getUser), so the claim can be trusted.
 */
export function tokenAal(token: string): "aal1" | "aal2" | "" {
  const part = token.split(".")[1] || "";
  try {
    const payload = JSON.parse(Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
    return payload?.aal === "aal2" ? "aal2" : payload?.aal === "aal1" ? "aal1" : "";
  } catch {
    return "";
  }
}

export function twoStepDone(token: string) {
  return tokenAal(token) === "aal2";
}

export function cleanCode(value: unknown) {
  const code = String(value || "").replace(/\s+/g, "");
  return /^\d{6}$/.test(code) ? code : "";
}

export function qrImageSrc(qr: string) {
  if (!qr) return "";
  return qr.startsWith("data:") ? qr : `data:image/svg+xml;utf-8,${encodeURIComponent(qr)}`;
}
