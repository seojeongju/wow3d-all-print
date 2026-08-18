import type { Metadata } from "next";
import { buildBreadcrumbSchema, buildCollectionPageSchema, buildQuoteHowToSchema, buildPhotoTo3DHowToSchema } from "@/lib/aeo-schema";
import { absoluteUrl, buildOgImages, OG_IMAGE_PATH, SITE_URL } from "@/lib/site-url";

const quoteTitle = "3D프린팅 자동견적 | 3D프린팅 견적 · 3D프린터 출력 가격";
const quoteDescription =
  "3D프린팅 자동견적·3D프린팅 견적·3D프린터 출력 가격을 파일 업로드 또는 사진(이미지) AI 모델링 후 즉시 확인하세요. STL·OBJ·3MF·PLY 즉시 견적, STEP·STP 자동 변환, 사진(이미지)→3D.";

export const metadata: Metadata = {
  title: quoteTitle,
  description: quoteDescription,
  keywords: ["3D프린팅출력", "3D프린터출력", "3D프린팅 자동견적", "3D프린팅 견적", "3D프린터 출력 가격", "3D 프린팅 견적"],
  openGraph: {
    url: `${SITE_URL}/quote`,
    title: quoteTitle,
    description: quoteDescription,
    images: buildOgImages(),
  },
  twitter: {
    card: "summary_large_image",
    title: quoteTitle,
    description: quoteDescription,
    images: [absoluteUrl(OG_IMAGE_PATH)],
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
        "STL, OBJ, 3MF, PLY 파일 업로드 또는 제품 사진(이미지) AI 3D 모델링 후 출력 방식, 레이어 높이, 인필, 소재를 선택해 실시간 견적을 확인하는 페이지입니다.",
      path: "/quote",
    }),
    buildBreadcrumbSchema([
      { name: "홈", path: "/" },
      { name: "자동 견적", path: "/quote" },
    ]),
    buildQuoteHowToSchema(),
    buildPhotoTo3DHowToSchema(),
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
