import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

/** 비공개·거래 경로 — Yeti(네이버) 포함 모든 봇에 동일 적용 */
const DISALLOW_PATHS = [
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
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW_PATHS,
      },
      // Yeti 전용 Allow:/ 만 두면 * 의 Disallow가 무시됨 → 동일 규칙 명시
      {
        userAgent: "Yeti",
        allow: "/",
        disallow: DISALLOW_PATHS,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
