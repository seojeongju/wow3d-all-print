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
    default: "3D프린팅 출력·시제품제작 전문 | 와우쓰리디 WOW3D 자동견적",
    template: "%s | WOW3D",
  },
  description:
    "3D프린터 출력 및 시제품제작 대행 전문 와우쓰리디. AI 자동견적으로 실시간 가격 확인. STL 파일 업로드만으로 즉시 주문 가능한 3D프린팅 출력대행 서비스.",
  keywords: [
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
    "와우쓰리디",
    "WOW3D",
    "3D 프린팅 업체",
    "3D 프린팅 제작",
  ],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: "WOW3D",
    title: "3D 프린팅 출력·자동견적 | 시제품 제작 전문 와우쓰리디 WOW3D",
    description:
      "3D 프린팅 출력 서비스와 AI 실시간 자동견적. 시제품·프로토타입·소량양산. 와우쓰리디가 당신의 상상을 현실로 만듭니다.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "WOW3D 3D 프린팅 견적" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "3D 프린팅 출력·자동견적 | WOW3D",
    description: "3D 프린팅 출력 서비스와 AI 실시간 자동견적. 시제품·프로토타입 제작 전문.",
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
                "@type": "LocalBusiness",
                "name": "WOW3D",
                "description": "3D프린팅 출력 및 시제품제작 대행 서비스 전문 업체 와우쓰리디입니다.",
                "url": SITE_URL,
                "image": `${SITE_URL}/og-image.png`,
              },
              {
                "@context": "https://schema.org",
                "@type": "Service",
                "serviceType": "3D프린팅 출력 및 시제품제작 대행",
                "provider": {
                  "@type": "LocalBusiness",
                  "name": "와우쓰리디 (WOW3D)"
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
