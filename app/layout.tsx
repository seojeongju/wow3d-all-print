import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ClearCartWhenGuest } from "@/components/ClearCartWhenGuest";
import TrafficTracker from "@/components/analytics/TrafficTracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://wow3dp.co.kr";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "(주)와우쓰리디 - 3D프린팅 출력 및 시제품 제작 | 실시간 AI 자동견적",
    template: "%s | (주)와우쓰리디 WOW3D",
  },
  description:
    "3D프린터 출력 및 시제품제작 대행 전문 (주)와우쓰리디. AI 자동견적으로 실시간 가격 확인. STL 파일 업로드만으로 즉시 주문 가능한 3D프린팅 출력대행 서비스.",
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
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "와우쓰리디 WOW3D 3D 프린팅 견적" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "3D프린팅 출력·자동견적 | (주)와우쓰리디 WOW3D",
    description: "3D 프린팅 출력 서비스와 AI 실시간 자동견적. 시제품·프로토타입 제작 전문 (주)와우쓰리디.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: { canonical: SITE_URL },
  // 검색엔진 소유 확인 (Search Console/서치어드바이저에서 발급한 content 값)
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
  return (
    <html lang="ko" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "(주)와우쓰리디",
                "alternateName": ["와우쓰리디", "WOW3D", "와우3D"],
                "url": SITE_URL,
              },
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": "(주)와우쓰리디",
                "url": SITE_URL,
                "logo": `${SITE_URL}/og-image.png`,
                "contactPoint": {
                  "@type": "ContactPoint",
                  "telephone": "02-3144-3137",
                  "contactType": "customer service",
                  "areaServed": "KR",
                  "availableLanguage": "Korean",
                },
                "sameAs": [
                  "https://www.band.us/@3dcookiehd",
                  "https://blog.naver.com/3dcookiehd",
                  "https://www.instagram.com/3dcookie_hd/",
                  "https://ko-kr.facebook.com/3dfabcafe/"
                ],
              },
              {
                "@context": "https://schema.org",
                "@type": "LocalBusiness",
                "name": "(주)와우쓰리디 (WOW3D)",
                "description": "(주)와우쓰리디는 AI 기반 3D프린팅 자동견적 시스템과 시제품제작 대행 전문 업체입니다.",
                "url": SITE_URL,
                "image": `${SITE_URL}/og-image.png`,
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "독막로 93 상수빌딩 4층",
                  "addressLocality": "마포구",
                  "addressRegion": "서울",
                  "postalCode": "04044",
                  "addressCountry": "KR",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "Service",
                "serviceType": "3D프린팅 출력 및 시제품제작 대행",
                "provider": {
                  "@type": "LocalBusiness",
                  "name": "(주)와우쓰리디 (WOW3D)"
                },
                "description": "3D프린터 출력, 시제품 제작, 프로토타입 제작, 3D프린팅 출력대행 서비스",
                "areaServed": "KR"
              }
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
