import type { MetadataRoute } from "next";
import { siteUrl } from "../lib/contact";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/agent/", "/agent$", "/api/", "/account", "/dashboard", "/preview"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
