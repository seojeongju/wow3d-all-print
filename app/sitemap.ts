import type { MetadataRoute } from "next";

const BASE_URL = "https://wow3dp.co.kr";

/** 검색엔진에 노출할 공개 페이지 (우선순위·변경주기 포함) */
const PUBLIC_PAGES: { path: string; priority?: number; changeFrequency?: "daily" | "weekly" | "monthly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/quote", priority: 0.95, changeFrequency: "weekly" },
  { path: "/quotes", priority: 0.9, changeFrequency: "weekly" },
  { path: "/print-methods", priority: 0.85, changeFrequency: "monthly" },
  { path: "/materials", priority: 0.85, changeFrequency: "monthly" },
  { path: "/materials/safety", priority: 0.7, changeFrequency: "monthly" },
  { path: "/hardware/3d-printer", priority: 0.85, changeFrequency: "monthly" },
  { path: "/experience", priority: 0.8, changeFrequency: "monthly" },
  { path: "/maker", priority: 0.8, changeFrequency: "monthly" },
  { path: "/partnership", priority: 0.75, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.9, changeFrequency: "monthly" },
  { path: "/qna", priority: 0.88, changeFrequency: "weekly" },
  { path: "/guides/3d-printing-quote-guide", priority: 0.92, changeFrequency: "weekly" },
  { path: "/guides/fdm-vs-sla-vs-dlp", priority: 0.9, changeFrequency: "weekly" },
  { path: "/guides/3d-printing-file-preparation", priority: 0.9, changeFrequency: "weekly" },
  { path: "/guides/3d-printing-turnaround-time", priority: 0.86, changeFrequency: "weekly" },
  { path: "/guides/pla-vs-abs-vs-petg", priority: 0.88, changeFrequency: "weekly" },
  { path: "/guides/standard-vs-tough-vs-clear-vs-flexible-resin", priority: 0.88, changeFrequency: "weekly" },
  { path: "/guides/best-materials-for-3d-printing-prototypes", priority: 0.9, changeFrequency: "weekly" },
  { path: "/privacy", priority: 0.5, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.5, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PAGES.map(({ path, priority = 0.8, changeFrequency = "weekly" }) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
