import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

/**
 * 비공개·거래 경로 (locale 접두어 없는 한국어 기준).
 * robots는 접두어 일치이므로 공개 페이지와 겹치지 않게 경로를 적는다.
 */
const PRIVATE_PATHS = [
  "/auth",
  "/cart",
  "/checkout",
  "/order-complete",
  "/my-account",
  "/quotes",
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

/** AI·답변엔진 크롤러 — * 규칙과 동일하게 공개 페이지만 허용(차단하지 않음) */
const AI_CRAWLER_AGENTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "anthropic-ai",
  "PerplexityBot",
  "Google-Extended",
] as const;

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
      ...AI_CRAWLER_AGENTS.map((userAgent) => ({
        userAgent,
        allow: ALLOW_PATHS,
        disallow: DISALLOW_PATHS,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
