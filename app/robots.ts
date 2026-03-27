import type { MetadataRoute } from "next";

const BASE_URL = "https://wow3dp.co.kr";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/checkout", "/order-complete", "/my-account"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin/", "/api/", "/checkout", "/order-complete", "/my-account"],
      },
      {
        userAgent: "Yeti", // 네이버 봇
        allow: "/",
        disallow: ["/admin/", "/api/", "/checkout", "/order-complete", "/my-account"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
