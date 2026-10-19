export const deskEmail = "guyanakeys@mail.grokbot.com";
export const deskFrom = `Guyana Keys <${deskEmail}>`;

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://guyana-keys.vercel.app").replace(/\/$/, "");
}
