import type { Metadata } from "next";
import { buildBreadcrumbSchema, buildCollectionPageSchema, buildQuoteHowToSchema } from "@/lib/aeo-schema";
import { OG_IMAGE_PATH, SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "3D프린팅 자동견적 | 3D프린팅 견적 · 3D프린터 출력 가격",
  description:
    "3D프린팅 자동견적·3D프린팅 견적·3D프린터 출력 가격을 파일 업로드 후 즉시 확인하세요. STL·OBJ·3MF·PLY 즉시 견적, STEP·STP 자동 변환.",
  keywords: ["3D프린팅 자동견적", "3D프린팅 견적", "3D프린터 출력 가격", "3D 프린팅 견적"],
  openGraph: {
    url: `${SITE_URL}/quote`,
    title: "3D프린팅 자동견적 | 3D프린팅 견적 · 출력 가격 | WOW3D",
    description: "파일 업로드 후 3D프린팅 견적과 예상 제작기간을 바로 확인하고 주문하세요.",
    images: [
      {
        url: OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: "와우쓰리디 WOW3D 3D프린팅 출력 제품과 프린터",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "3D프린팅 자동견적 | WOW3D",
    description: "3D프린팅 견적·3D프린터 출력 가격을 실시간으로 확인하는 자동견적.",
    images: [OG_IMAGE_PATH],
  },
  alternates: { canonical: `${SITE_URL}/quote` },
};

export default function QuoteLayout({
  children,
}: { children: React.ReactNode }) {
  const schemas = [
    buildCollectionPageSchema({
      name: "3D 프린팅 자동 견적",
      description:
        "STL, OBJ, 3MF 파일 업로드 후 출력 방식, 레이어 높이, 인필, 소재를 선택해 실시간 견적을 확인하는 페이지입니다.",
      path: "/quote",
    }),
    buildBreadcrumbSchema([
      { name: "홈", path: "/" },
      { name: "자동 견적", path: "/quote" },
    ]),
    buildQuoteHowToSchema(),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
      />
      {children}
    </>
  );
}
