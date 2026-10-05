import type { Metadata, Viewport } from "next";
import {
  absoluteUrl,
  buildOgImages,
  OG_IMAGE_PATH,
  SITE_DESCRIPTION,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/site-url";

const ogImages = buildOgImages();
const primaryImage = absoluteUrl(OG_IMAGE_PATH);

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | (주)와우쓰리디 WOW3D",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "3D프린팅출력",
    "3D프린터출력",
    "3D프린팅 출력",
    "3D프린터 출력",
    "와우쓰리디",
    "WOW3D",
    "시제품제작",
    "목업제작",
    "3D프린팅 자동견적",
    "3D프린팅 출력대행",
  ],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "(주)와우쓰리디",
    // title/description/url은 페이지별 generateMetadata에서 설정.
    // 루트에 고정하면 하위 페이지가 SITE_TITLE을 og:title로 상속해 중복 진단이 난다.
    images: ogImages,
  },
  twitter: {
    card: "summary_large_image",
    images: [primaryImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  // canonical은 페이지별로 설정 — 루트에 "/"를 두면 /hardware 등 하위 페이지가 홈 표준으로 잘못 상속됨
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "-9piNXSyjNzl442zz",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

/**
 * <html>/<body>는 app/[locale]·app/admin 레이아웃의 DocumentShell이 렌더링한다.
 * 여기서 getLocale()로 요청 헤더를 읽으면 전 페이지가 동적 렌더링되어 정적 캐시를 쓸 수 없다.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
