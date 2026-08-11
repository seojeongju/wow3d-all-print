import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ClearCartWhenGuest } from "@/components/ClearCartWhenGuest";
import SessionValidator from "@/components/auth/SessionValidator";
import TrafficTracker from "@/components/analytics/TrafficTracker";
import EducationQuickMenu from "@/components/layout/EducationQuickMenu";
import {
  absoluteUrl,
  buildOgImages,
  OG_IMAGE_PATH,
  SITE_DESCRIPTION,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/site-url";
import {
  buildBusinessSchemas,
  buildWebSiteSearchActionSchema,
} from "@/lib/aeo-schema";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ogImages = buildOgImages();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | (주)와우쓰리디 WOW3D",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "와우쓰리디",
    "WOW3D",
    "3D프린팅 출력",
    "시제품제작",
    "3D 프린팅 자동 견적",
    "프로토타입 제작",
  ],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: "(주)와우쓰리디",
    // 네이버: title과 og:title을 동일하게 권장
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ogImages,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [absoluteUrl(OG_IMAGE_PATH)],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: { canonical: "/" },
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const businessSchemas = buildBusinessSchemas();
  const primaryImage = absoluteUrl(OG_IMAGE_PATH);

  return (
    <html lang="ko" className="dark">
      <head>
        <meta name="naver-site-verification" content={NAVER_SITE_VERIFICATION} />
        {/* 네이버·구형 크롤러용 대표 이미지 힌트 */}
        <link rel="image_src" href={primaryImage} />
        <meta property="og:image:type" content="image/jpeg" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              buildWebSiteSearchActionSchema(),
              ...businessSchemas,
            ]),
          }}
        />
        <ClearCartWhenGuest />
        <SessionValidator />
        <Suspense fallback={null}>
          <TrafficTracker />
        </Suspense>
        {children}
        <Toaster />
        <EducationQuickMenu />
      </body>
    </html>
  );
}
