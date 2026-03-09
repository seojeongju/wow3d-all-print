import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ClearCartWhenGuest } from "@/components/ClearCartWhenGuest";

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
    default: "3D 프린팅 출력·자동 견적 | WOW3D - 3D 프린터 출력 서비스",
    template: "%s | WOW3D",
  },
  description:
    "3D 프린팅 출력, 3D 프린팅 자동 견적, 3D 프린터 출력 서비스. STL·OBJ 업로드만으로 10초 실시간 견적. 시제품·프로토타입·소량양산. FDM·SLA·DLP.",
  keywords: [
    "3D 프린팅 출력",
    "3D 프린팅 자동 견적",
    "3D 프린터 출력",
    "3D 프린팅 출력 서비스",
    "3D 프린팅 견적",
    "시제품 제작",
    "프로토타입",
    "STL 견적",
    "산업용 3D 프린팅",
    "와우3D",
    "WOW3D",
  ],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: "WOW3D",
    title: "3D 프린팅 출력·자동 견적 | WOW3D - 3D 프린터 출력 서비스",
    description:
      "3D 프린팅 출력, 3D 프린팅 자동 견적, 3D 프린터 출력 서비스. 10초 실시간 견적, 시제품·양산.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "WOW3D 3D 프린팅 견적" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "3D 프린팅 출력·자동 견적 | WOW3D",
    description: "3D 프린팅 출력, 3D 프린터 출력 서비스. 10초 실시간 자동 견적. 시제품·양산.",
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
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: "WOW3D",
              description:
                "3D 프린팅 출력, 3D 프린팅 자동 견적, 3D 프린터 출력, 3D 프린팅 출력 서비스. STL·OBJ 업로드로 10초 실시간 견적. 시제품·프로토타입·소량양산.",
              url: SITE_URL,
              image: `${SITE_URL}/og-image.png`,
            }),
          }}
        />
        <ClearCartWhenGuest />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
