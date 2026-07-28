import type { Metadata } from "next";
import { buildBreadcrumbSchema, buildCollectionPageSchema, buildQuoteHowToSchema } from "@/lib/aeo-schema";
import { OG_IMAGE_PATH, SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "3D 프린팅 자동 견적 | 파일 업로드 10초 견적",
  description:
    "3D 프린팅 견적은 어떻게 계산되는지, 어떤 파일을 올려야 하는지, FDM·SLA·DLP 중 무엇을 선택해야 하는지 궁금할 때 바로 사용할 수 있는 WOW3D 자동 견적 페이지입니다.",
  openGraph: {
    url: `${SITE_URL}/quote`,
    title: "3D 프린팅 자동 견적 | WOW3D",
    description: "STL·OBJ·3MF 업로드 후 3D 프린팅 가격과 예상 시간을 바로 확인하고 공정별 옵션까지 비교해 보세요.",
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
    title: "3D 프린팅 자동 견적 | WOW3D",
    description: "파일 업로드, 공정 선택, 레이어 높이와 소재 반영까지 지원하는 WOW3D 3D 프린팅 자동 견적 시스템.",
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
