import type { MetadataRoute } from "next";
import { publicOrigin } from "../lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/agents", "/agents/", "/guides", "/guides/", "/about", "/contact", "/listings", "/listings/", "/advertise", "/advertise/"],
      disallow: ["/admin$", "/admin/", "/agent$", "/agent/", "/api/", "/account$", "/account/", "/dashboard$", "/dashboard/", "/preview$", "/preview/"],
    },
    sitemap: `${publicOrigin}/sitemap.xml`,
  };
}
