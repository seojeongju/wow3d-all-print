import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { getLocale } from "next-intl/server";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ClearCartWhenGuest } from "@/components/ClearCartWhenGuest";
import TrafficTracker from "@/components/analytics/TrafficTracker";
import {
  absoluteUrl,
  buildOgImages,
  OG_IMAGE_ALT,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_PATH,
  OG_IMAGE_WIDTH,
  SITE_DESCRIPTION,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/site-url";
import {
  buildBusinessSchemas,
  buildWebPageSchema,
  buildWebSiteSearchActionSchema,
} from "@/lib/aeo-schema";
import { routing } from "@/i18n/routing";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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

/** 네이버 www 속성 소유확인 — metadata.other 대신 head에 직접 넣어 크롤러가 확실히 읽게 함 */
const NAVER_SITE_VERIFICATION = "a5e68284a983861b03b77e7085666c955007de7a";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const businessSchemas = buildBusinessSchemas();
  let locale: string = routing.defaultLocale;
  try {
    locale = await getLocale();
  } catch {
    locale = routing.defaultLocale;
  }

  return (
    <html lang={locale} className="dark" suppressHydrationWarning>
      <head>
        <meta name="naver-site-verification" content={NAVER_SITE_VERIFICATION} />
        {/* 네이버·구형 크롤러용 대표 이미지 힌트 (절대 URL 명시) */}
        <link rel="image_src" href={primaryImage} />
        <meta property="og:image" content={primaryImage} />
        <meta property="og:image:secure_url" content={primaryImage} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content={String(OG_IMAGE_WIDTH)} />
        <meta property="og:image:height" content={String(OG_IMAGE_HEIGHT)} />
        <meta property="og:image:alt" content={OG_IMAGE_ALT} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              buildWebSiteSearchActionSchema(),
              buildWebPageSchema(),
              ...businessSchemas,
            ]),
          }}
        />
        <ClearCartWhenGuest />
        <Suspense fallback={null}>
          <TrafficTracker />
        </Suspense>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
