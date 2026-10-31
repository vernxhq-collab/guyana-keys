/** Canonical public origin. Magic links, email links, and host redirects land here. */
export const CANONICAL_SITE_ORIGIN = "https://gykeys.com";

export const CANONICAL_HOST = "gykeys.com";
export const WWW_HOST = "www.gykeys.com";
export const LEGACY_PRODUCTION_HOST = "guyana-keys.vercel.app";

const desks = {
  buyer: "/account",
  agent: "/agent",
  admin: "/admin",
} as const;

export type DeskName = keyof typeof desks;

function isVercelHost(host: string) {
  return host === "vercel.app" || host.endsWith(".vercel.app");
}

/**
 * Origin for magic-link redirects and links in email.
 * Defaults to https://gykeys.com. A vercel.app value is never used.
 */
export function siteOrigin(configured = process.env.NEXT_PUBLIC_SITE_URL) {
  const raw = (configured || "").trim();
  if (!raw) return CANONICAL_SITE_ORIGIN;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return CANONICAL_SITE_ORIGIN;
    const host = url.hostname.toLowerCase();
    if (host === CANONICAL_HOST || host === WWW_HOST || isVercelHost(host)) return CANONICAL_SITE_ORIGIN;
    return url.origin;
  } catch {
    return CANONICAL_SITE_ORIGIN;
  }
}

export function redirectForDesk(desk: DeskName, configured?: string) {
  return `${siteOrigin(configured)}${desks[desk]}`;
}

/** Origin embedded in a phone-scan QR code. Preview hosts stay on the preview. */
export function handoffOrigin(requestOrigin: string, env = process.env.VERCEL_ENV || "") {
  try {
    const url = new URL(requestOrigin);
    const host = url.hostname.toLowerCase();
    if (host === CANONICAL_HOST || host === WWW_HOST) return CANONICAL_SITE_ORIGIN;
    if (isVercelHost(host)) return env === "preview" ? url.origin : CANONICAL_SITE_ORIGIN;
    return url.origin;
  } catch {
    return CANONICAL_SITE_ORIGIN;
  }
}

export type HostRedirect = {
  source: "/:path*";
  has: [{ type: "host"; value: string }];
  destination: `${typeof CANONICAL_SITE_ORIGIN}/:path*`;
  permanent: true;
};

function hostRule(host: string): HostRedirect {
  return {
    source: "/:path*",
    has: [{ type: "host", value: host }],
    destination: `${CANONICAL_SITE_ORIGIN}/:path*`,
    permanent: true,
  };
}

/**
 * 308 host redirects. The fragment is not on the request; browsers keep it
 * across a 308, so #access_token and phone-scan #t= still reach the page.
 * Preview builds omit the vercel.app alias so preview hosts are left alone.
 */
export function hostRedirects(env = process.env.VERCEL_ENV || ""): HostRedirect[] {
  const rules = [hostRule(WWW_HOST)];
  if (env !== "preview") rules.unshift(hostRule(LEGACY_PRODUCTION_HOST));
  return rules;
}
