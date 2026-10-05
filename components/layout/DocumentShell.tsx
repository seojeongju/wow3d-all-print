import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "@/app/globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ClearCartWhenGuest } from "@/components/ClearCartWhenGuest";
import TrafficTracker from "@/components/analytics/TrafficTracker";
import { ZustandPersistGate } from "@/components/ZustandPersistGate";
import {
  buildBusinessSchemas,
  buildWebPageSchema,
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

/** 네이버 www 속성 소유확인 — metadata.other 대신 head에 직접 넣어 크롤러가 확실히 읽게 함 */
const NAVER_SITE_VERIFICATION = "a5e68284a983861b03b77e7085666c955007de7a";

/**
 * <html>/<body> 공통 틀 — app/[locale]·app/admin·app/not-found 에서 사용.
 * 루트 layout에서 getLocale()(요청 헤더)을 읽으면 모든 페이지가 동적 렌더링되므로,
 * lang은 각 레이아웃이 params로 받아 넘긴다.
 */
export default function DocumentShell({
  lang,
  children,
}: {
  lang: string;
  children: React.ReactNode;
}) {
  const businessSchemas = buildBusinessSchemas();

  return (
    <html lang={lang} className="dark" suppressHydrationWarning>
      <head>
        <meta name="naver-site-verification" content={NAVER_SITE_VERIFICATION} />
        {/* og:image는 페이지별 metadata에서만 출력 — 여기서 고정하면 모든 페이지의 첫 og:image가 같아져 네이버가 공통 배너로 보고 썸네일에서 제외함 */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
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
        <ZustandPersistGate />
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
