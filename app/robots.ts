import type { MetadataRoute } from "next";

const BASE_URL = "https://wow3dp.co.kr";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/checkout",
          "/order-complete",
          "/my-account",
          "/auth", // 이제 사이트맵에서 빠졌으므로 robots에서도 명시적으로 막아 수집 방지
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
