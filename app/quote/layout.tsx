import type { Metadata } from "next";
import {
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildQuoteHowToSchema,
  buildPhotoTo3DHowToSchema,
  buildWebPageSchema,
} from "@/lib/aeo-schema";
import {
  absoluteUrl,
  buildQuoteOgImages,
  OG_QUOTE_IMAGE_ALT,
  OG_QUOTE_IMAGE_HEIGHT,
  OG_QUOTE_IMAGE_PATH,
  OG_QUOTE_IMAGE_WIDTH,
  SITE_URL,
} from "@/lib/site-url";

const quoteTitle = "3D프린팅 자동견적 | 3D프린팅 견적 · 3D프린터 출력 가격";
const quoteDescription =
  "3D프린팅 자동견적·3D프린팅 견적·3D프린터 출력 가격을 파일 업로드 또는 사진(이미지) AI 모델링 후 즉시 확인하세요. STL·OBJ·3MF·PLY 즉시 견적, STEP·STP 자동 변환, 사진(이미지)→3D.";

const quoteOgImages = buildQuoteOgImages();
const quotePrimaryImage = absoluteUrl(OG_QUOTE_IMAGE_PATH);

export const metadata: Metadata = {
  title: quoteTitle,
  description: quoteDescription,
  keywords: [
    "3D프린팅출력",
    "3D프린터출력",
    "3D프린팅 자동견적",
    "3D프린팅 견적",
    "3D프린터 출력 가격",
    "3D 프린팅 견적",
  ],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: `${SITE_URL}/quote`,
    siteName: "(주)와우쓰리디",
    title: quoteTitle,
    description: quoteDescription,
    images: quoteOgImages,
  },
  twitter: {
    card: "summary_large_image",
    title: quoteTitle,
    description: quoteDescription,
    images: [quotePrimaryImage],
  },
  alternates: { canonical: `${SITE_URL}/quote` },
  other: {
    "og:image:secure_url": quotePrimaryImage,
  },
};

export default function QuoteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const schemas = [
    buildWebPageSchema({
      name: quoteTitle,
      description: quoteDescription,
      path: "/quote",
      imagePath: OG_QUOTE_IMAGE_PATH,
      imageWidth: OG_QUOTE_IMAGE_WIDTH,
      imageHeight: OG_QUOTE_IMAGE_HEIGHT,
      imageCaption: OG_QUOTE_IMAGE_ALT,
    }),
    buildCollectionPageSchema({
      name: "3D 프린팅 자동 견적",
      description:
        "STL, OBJ, 3MF, PLY 파일 업로드 또는 제품 사진(이미지) AI 3D 모델링 후 출력 방식, 레이어 높이, 인필, 소재를 선택해 실시간 견적을 확인하는 페이지입니다.",
      path: "/quote",
      imagePath: OG_QUOTE_IMAGE_PATH,
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
