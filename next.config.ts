import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  env: {
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.NODE_ENV === "production" ? "https://www.wow3dp.co.kr" : "http://localhost:3000"),
    /** 카카오 비즈 채널 검색용 ID (pf.kakao.com/_xxx). 빌드 시 주입 → 견적 페이지 FAB */
    NEXT_PUBLIC_KAKAO_CHANNEL_SEARCH_ID:
      process.env.NEXT_PUBLIC_KAKAO_CHANNEL_SEARCH_ID || "",
    /** 네이버 톡톡 프로필/채팅 코드 (예: wowi7tu) */
    NEXT_PUBLIC_NAVER_TALKTALK_ID:
      process.env.NEXT_PUBLIC_NAVER_TALKTALK_ID || "wowi7tu",
    /** 네이버 톡톡 상담 URL (프로필 → 톡톡문의) */
    NEXT_PUBLIC_NAVER_TALKTALK_CHAT_URL:
      process.env.NEXT_PUBLIC_NAVER_TALKTALK_CHAT_URL ||
      "https://talk.naver.com/profile/wowi7tu",
    /** 네이버 톡톡 배너 data-id (공식 배너 위젯, 선택) */
    NEXT_PUBLIC_NAVER_TALKTALK_BANNER_ID:
      process.env.NEXT_PUBLIC_NAVER_TALKTALK_BANNER_ID || "",
  },
};

export default nextConfig;
initOpenNextCloudflareForDev();
