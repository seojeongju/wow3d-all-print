import type { Metadata } from "next";
import { OG_IMAGE_PATH, SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "3D 프린팅 자동 견적 | 파일 업로드 10초 견적",
  description:
    "3D 프린팅 자동 견적 페이지입니다. STL·OBJ·3MF 파일 업로드 후 FDM·SLA·DLP 방식, 레이어 높이, 인필, 소재를 선택해 실시간으로 가격과 예상 시간을 확인할 수 있습니다.",
  openGraph: {
    url: `${SITE_URL}/quote`,
    title: "3D 프린팅 자동 견적 | WOW3D",
    description: "STL·OBJ·3MF 업로드 후 FDM·SLA·DLP 옵션을 선택해 3D 프린팅 가격과 예상 시간을 바로 확인하세요.",
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
    description: "레이어 높이, 인필, 소재까지 반영하는 WOW3D 3D 프린팅 자동 견적 시스템.",
    images: [OG_IMAGE_PATH],
  },
  alternates: { canonical: `${SITE_URL}/quote` },
};

export default function QuoteLayout({
  children,
}: { children: React.ReactNode }) {
  return <>{children}</>;
}
