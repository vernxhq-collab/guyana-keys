export const publicEmail = "info@gykeys.com";
export const facebookPage = "https://www.facebook.com/GuyanaKeysGY";

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://guyana-keys.vercel.app").replace(/\/$/, "");
}
