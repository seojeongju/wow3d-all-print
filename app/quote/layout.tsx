import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://wow3dp.co.kr";

export const metadata: Metadata = {
  title: "3D 프린팅 자동 견적 | 파일 업로드 10초 견적",
  description:
    "3D 프린팅 자동 견적. STL·OBJ·3MF 업로드만으로 10초 실시간 견적. 3D 프린팅 출력·3D 프린터 출력 서비스, 시제품·양산 견적.",
  openGraph: {
    url: `${SITE_URL}/quote`,
    title: "3D 프린팅 자동 견적 | WOW3D",
    description: "파일 업로드만으로 10초 실시간 견적. 3D 프린팅 출력 서비스.",
  },
  alternates: { canonical: `${SITE_URL}/quote` },
};

export default function QuoteLayout({
  children,
}: { children: React.ReactNode }) {
  return <>{children}</>;
}
