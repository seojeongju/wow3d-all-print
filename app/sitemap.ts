import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";
import { SERVICE_LANDINGS } from "@/lib/seo-service-pages";
import { NEW_SEO_GUIDES } from "@/lib/seo-guide-pages";
import { SHOWCASE_SLUGS } from "@/lib/showcase";

/** 검색엔진에 노출할 공개 페이지 — www 대표 URL만 수록 */
const PUBLIC_PAGES: { path: string; priority?: number; changeFrequency?: "daily" | "weekly" | "monthly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/quote", priority: 0.98, changeFrequency: "weekly" },
  { path: "/services", priority: 0.96, changeFrequency: "weekly" },
  ...SERVICE_LANDINGS.map((s) => ({
    path: s.path,
    priority: 0.94,
    changeFrequency: "weekly" as const,
  })),
  { path: "/print-methods", priority: 0.85, changeFrequency: "monthly" },
  { path: "/materials", priority: 0.85, changeFrequency: "monthly" },
  { path: "/materials/safety", priority: 0.7, changeFrequency: "monthly" },
  { path: "/hardware/3d-printer", priority: 0.85, changeFrequency: "monthly" },
  { path: "/experience", priority: 0.8, changeFrequency: "monthly" },
  { path: "/expert", priority: 0.92, changeFrequency: "weekly" },
  ...SHOWCASE_SLUGS.map((slug) => ({
    path: `/expert/showcase/${slug}`,
    priority: 0.9,
    changeFrequency: "weekly" as const,
  })),
  { path: "/partnership", priority: 0.75, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.9, changeFrequency: "monthly" },
  { path: "/qna", priority: 0.88, changeFrequency: "weekly" },
  { path: "/gallery", priority: 0.85, changeFrequency: "weekly" },
  { path: "/guides", priority: 0.9, changeFrequency: "weekly" },
  { path: "/guides/photo-to-3d-printing-quote", priority: 0.92, changeFrequency: "weekly" },
  { path: "/guides/3d-printing-quote-guide", priority: 0.92, changeFrequency: "weekly" },
  { path: "/guides/fdm-vs-sla-vs-dlp", priority: 0.9, changeFrequency: "weekly" },
  { path: "/guides/3d-printing-file-preparation", priority: 0.9, changeFrequency: "weekly" },
  { path: "/guides/3d-printing-turnaround-time", priority: 0.86, changeFrequency: "weekly" },
  { path: "/guides/pla-vs-abs-vs-petg", priority: 0.88, changeFrequency: "weekly" },
  { path: "/guides/standard-vs-tough-vs-clear-vs-flexible-resin", priority: 0.88, changeFrequency: "weekly" },
  { path: "/guides/best-materials-for-3d-printing-prototypes", priority: 0.9, changeFrequency: "weekly" },
  { path: "/guides/best-materials-for-transparent-3d-printed-parts", priority: 0.89, changeFrequency: "weekly" },
  { path: "/guides/best-materials-for-3d-printed-housings-and-cases", priority: 0.89, changeFrequency: "weekly" },
  { path: "/guides/best-materials-for-heat-resistant-and-impact-resistant-parts", priority: 0.89, changeFrequency: "weekly" },
  { path: "/guides/best-materials-for-miniatures-and-figurines", priority: 0.89, changeFrequency: "weekly" },
  ...NEW_SEO_GUIDES.map((g) => ({
    path: g.path,
    priority: 0.9,
    changeFrequency: "weekly" as const,
  })),
  { path: "/privacy", priority: 0.5, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.5, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PAGES.map(({ path, priority = 0.8, changeFrequency = "weekly" }) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
