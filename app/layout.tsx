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
  OG_IMAGE_PATH,
  SITE_URL,
} from "@/lib/site-url";
import {
  buildBusinessSchemas,
  buildQuoteHowToSchema,
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "(주)와우쓰리디 - 3D프린팅 출력 및 시제품제작 서비스 | 실시간 자동견적",
    template: "%s | (주)와우쓰리디 WOW3D",
  },
  description:
    "3D프린팅 출력 및 시제품제작 서비스 전문 와우쓰리디. STL·OBJ·3MF·PLY 즉시 자동견적, STEP·STP 자동 변환 후 견적.",
  keywords: [
    "와우쓰리디",
    "WOW3D",
    "(주)와우쓰리디",
    "와우3D",
    "3D프린팅출력",
    "3D프린터출력",
    "시제품제작",
    "3D프린팅출력대행",
    "3D프린터출력대행",
    "3D 프린팅 자동 견적",
    "3D 프린팅 출력 서비스",
    "프로토타입 제작",
    "3D 모델 분석",
    "산업용 3D 프린팅",
    "3D 프린팅 업체",
    "3D 프린팅 제작",
  ],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: "(주)와우쓰리디",
    title: "3D프린팅 출력·자동견적 | 시제품제작 전문 (주)와우쓰리디 WOW3D",
    description:
      "3D 프린팅 출력 서비스와 AI 실시간 자동견적. 시제품·프로토타입·소량양산. (주)와우쓰리디가 당신의 상상을 현실로 만듭니다.",
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
    title: "3D프린팅 출력·자동견적 | (주)와우쓰리디 WOW3D",
    description: "3D 프린팅 출력 서비스와 AI 실시간 자동견적. 시제품·프로토타입 제작 전문 (주)와우쓰리디.",
    images: [OG_IMAGE_PATH],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: { canonical: SITE_URL },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "-9piNXSyjNzl442zz",
    other: {
      "naver-site-verification":
        process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION || "ce7e7d3489dc31609cfceda1d5ad6648d527bbf8",
    },
  },
};

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
  const ogImageUrl = absoluteUrl(OG_IMAGE_PATH);
  const businessSchemas = buildBusinessSchemas();

  return (
    <html lang="ko" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              buildWebSiteSearchActionSchema(),
              ...businessSchemas,
              {
                "@context": "https://schema.org",
                "@type": "WebPage",
                "name": "3D프린팅 출력·자동견적 | 시제품제작 전문 (주)와우쓰리디",
                "description": "3D 프린팅 출력 서비스와 AI 실시간 자동견적. 시제품·프로토타입 제작 전문 (주)와우쓰리디.",
                "url": SITE_URL,
                "primaryImageOfPage": {
                  "@type": "ImageObject",
                  "url": ogImageUrl,
                  "width": "1200",
                  "height": "630"
                }
              },
              buildQuoteHowToSchema(),
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
