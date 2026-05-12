import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://wow3dp.co.kr";
const QUOTE_OG_IMAGE = `${SITE_URL}/og-image.png`;

export const metadata: Metadata = {
  title: "3D 프린팅 자동 견적 | 파일 업로드 10초 견적",
  description:
    "3D 프린팅 자동 견적. STL·OBJ·3MF 업로드만으로 10초 실시간 견적. 3D 프린팅 출력·3D 프린터 출력 서비스, 시제품·양산 견적.",
  openGraph: {
    url: `${SITE_URL}/quote`,
    title: "3D 프린팅 자동 견적 | WOW3D",
    description: "파일 업로드만으로 10초 실시간 견적. 3D 프린팅 출력 서비스.",
    images: [
      {
        url: QUOTE_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "와우쓰리디 WOW3D 3D프린팅 자동견적 서비스 화면",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "3D 프린팅 자동 견적 | WOW3D",
    description: "파일 업로드만으로 10초 실시간 견적. 3D 프린팅 출력 서비스.",
    images: [QUOTE_OG_IMAGE],
  },
  alternates: { canonical: `${SITE_URL}/quote` },
};

export default function QuoteLayout({
  children,
}: { children: React.ReactNode }) {
  return <>{children}</>;
}
