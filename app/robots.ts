import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

/**
 * 비공개·거래 경로 (locale 접두어 없는 한국어 기준).
 * robots는 접두어 일치라 "/maker"로 쓰면 공개 페이지 "/makerspace"까지 막힌다 → "$"·"/"로 끝을 명시.
 */
const PRIVATE_PATHS = [
  "/auth",
  "/cart",
  "/checkout",
  "/order-complete",
  "/my-account",
  "/quotes",
  "/maker$",
  "/maker/",
  "/maker?",
  "/print/estimate/",
];

/** Yeti(네이버) 포함 모든 봇에 동일 적용 — 영문(/en) 경로도 같은 비공개 경로를 차단 */
const DISALLOW_PATHS = [
  "/admin/",
  "/api/",
  ...PRIVATE_PATHS,
  ...PRIVATE_PATHS.map((p) => `/en${p}`),
];

/** /api/ 차단 중 공개 이미지 스트림만 허용 — 더 긴(구체적) Allow 규칙이 Disallow보다 우선 */
const ALLOW_PATHS = [
  "/",
  "/api/gallery/image/",
  "/api/custom-products/media/",
  "/api/showcase/media/",
  "/api/news/media/",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ALLOW_PATHS,
        disallow: DISALLOW_PATHS,
      },
      // Yeti 전용 Allow:/ 만 두면 * 의 Disallow가 무시됨 → 동일 규칙 명시
      {
        userAgent: "Yeti",
        allow: ALLOW_PATHS,
        disallow: DISALLOW_PATHS,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
