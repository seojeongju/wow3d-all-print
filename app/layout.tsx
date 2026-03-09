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
    default: "3D 프린팅 자동 견적 | WOW3D - 시제품·양산 견적 10초",
    template: "%s | WOW3D",
  },
  description:
    "STL·OBJ·3MF·PLY 업로드만으로 10초 실시간 견적. 산업용 3D 프린팅, 시제품·소량양산·프로토타입 제작. FDM·SLA·DLP, 다양한 소재.",
  keywords: [
    "3D 프린팅",
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
    title: "3D 프린팅 자동 견적 | WOW3D - 시제품·양산 견적 10초",
    description:
      "STL·OBJ·3MF·PLY 업로드만으로 10초 실시간 견적. 산업용 3D 프린팅, 시제품·소량양산까지.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "WOW3D 3D 프린팅 견적" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "3D 프린팅 자동 견적 | WOW3D",
    description: "STL·OBJ·3MF·PLY 업로드만으로 10초 실시간 견적. 시제품·양산까지.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: { canonical: SITE_URL },
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
        <ClearCartWhenGuest />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
