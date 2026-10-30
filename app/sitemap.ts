import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";
import { SERVICE_LANDINGS } from "@/lib/seo-service-pages";
import { NEW_SEO_GUIDES } from "@/lib/seo-guide-pages";
import { USE_CASES } from "@/lib/use-case-pages";
import { SHOWCASE_SLUGS } from "@/lib/showcase";
import { CUSTOM_PRODUCT_SLUGS } from "@/lib/custom-products";
import { getCustomProductList } from "@/lib/custom-products-public";
import { getAllPublishedNews } from "@/lib/news-public";
import { utcSqlToIso } from "@/lib/news";
import { getContentDates, kstDateToIso } from "@/lib/content-dates";

/**
 * 맞춤 상품·최신 동향은 DB에서 읽되, 매 요청 force-dynamic 대신 ISR로 안정화한다.
 * DB 장애 시에도 정적 PUBLIC_PAGES는 항상 반환되도록 조회부를 try/catch로 감싼다.
 */
export const revalidate = 3600;

type PublicPage = {
  path: string;
  priority?: number;
  changeFrequency?: "daily" | "weekly" | "monthly";
};

/** 검색엔진에 노출할 공개 페이지 — www 대표 URL만 수록 (/custom/[slug]는 DB 동적 주입) */
const PUBLIC_PAGES: PublicPage[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/quote", priority: 0.98, changeFrequency: "weekly" },
  { path: "/price-calculator", priority: 0.95, changeFrequency: "weekly" },
  { path: "/stl-checker", priority: 0.9, changeFrequency: "monthly" },
  { path: "/use-cases", priority: 0.9, changeFrequency: "weekly" },
  ...USE_CASES.map((u) => ({
    path: u.path,
    priority: 0.88,
    changeFrequency: "monthly" as const,
  })),
  { path: "/custom", priority: 0.95, changeFrequency: "weekly" },
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
  { path: "/partnership/smart-store", priority: 0.78, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.9, changeFrequency: "monthly" },
  { path: "/maker", priority: 0.9, changeFrequency: "weekly" },
  { path: "/makerspace", priority: 0.88, changeFrequency: "monthly" },
  { path: "/qna", priority: 0.88, changeFrequency: "weekly" },
  { path: "/gallery", priority: 0.85, changeFrequency: "weekly" },
  { path: "/guides", priority: 0.9, changeFrequency: "weekly" },
  { path: "/guides/photo-to-3d-printing-quote", priority: 0.92, changeFrequency: "weekly" },
  { path: "/guides/3d-printing-quote-guide", priority: 0.92, changeFrequency: "weekly" },
  { path: "/guides/3d-printing-price-examples", priority: 0.92, changeFrequency: "weekly" },
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

async function resolveCustomProductPages(): Promise<PublicPage[]> {
  try {
    const products = await getCustomProductList();
    const slugs =
      products.length > 0
        ? products.map((p) => p.slug)
        : [...CUSTOM_PRODUCT_SLUGS];
    const unique = Array.from(new Set(slugs.filter(Boolean)));
    return unique.map((slug) => ({
      path: `/custom/${slug}`,
      priority: 0.9,
      changeFrequency: "weekly" as const,
    }));
  } catch (e) {
    console.warn("sitemap custom products", e);
    return CUSTOM_PRODUCT_SLUGS.map((slug) => ({
      path: `/custom/${slug}`,
      priority: 0.9,
      changeFrequency: "weekly" as const,
    }));
  }
}

function pushLocalizedEntries(entries: MetadataRoute.Sitemap, page: PublicPage) {
  const { path, priority = 0.8, changeFrequency = "weekly" } = page;
  // 실제 콘텐츠 수정일만 lastmod로 — 날짜를 모르는 페이지(DB 상품 등)는 생략
  const dates = getContentDates(path);
  const lastModified = dates ? kstDateToIso(dates.modified) : undefined;
  const koPath = path === "/" ? "" : path;
  const enPath = path === "/" ? "/en" : `/en${path}`;
  const koUrl = `${SITE_URL}${koPath}`;
  const enUrl = `${SITE_URL}${enPath}`;

  entries.push({
    url: koUrl,
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages: { ko: koUrl, en: enUrl } },
  });
  entries.push({
    url: enUrl,
    lastModified,
    changeFrequency,
    priority: Math.max(0.4, (priority ?? 0.8) - 0.05),
    alternates: { languages: { ko: koUrl, en: enUrl } },
  });
}

async function resolveNewsPosts() {
  try {
    return await getAllPublishedNews();
  } catch (e) {
    console.warn("sitemap news", e);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const [customPages, news] = await Promise.all([
    resolveCustomProductPages(),
    resolveNewsPosts(),
  ]);
  const pages = [...PUBLIC_PAGES, ...customPages];

  for (const page of pages) {
    pushLocalizedEntries(entries, page);
  }

  /** 최신 동향은 한국어 전용 콘텐츠 — 영문 경로는 noindex이므로 ko URL만 수록 */
  const newsLatest = news[0] ? utcSqlToIso(news[0].updatedAt) : null;
  entries.push({
    url: `${SITE_URL}/news`,
    lastModified: newsLatest ? new Date(newsLatest) : undefined,
    changeFrequency: "daily",
    priority: 0.88,
  });
  for (const post of news) {
    const modified = utcSqlToIso(post.updatedAt) ?? utcSqlToIso(post.publishedAt);
    entries.push({
      url: `${SITE_URL}/news/${encodeURIComponent(post.slug)}`,
      lastModified: modified ? new Date(modified) : undefined,
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  return entries;
}
