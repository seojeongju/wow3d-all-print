import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/auth",
          "/cart",
          "/checkout",
          "/order-complete",
          "/my-account",
          "/quotes",
          "/maker",
          "/print/estimate/",
        ],
      },
      {
        userAgent: "Yeti",
        allow: "/",
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
