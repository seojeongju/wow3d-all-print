import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  env: {
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.NODE_ENV === "production" ? "https://wow3dp.co.kr" : "http://localhost:3000"),
    /** 카카오 비즈 채널 검색용 ID (pf.kakao.com/_xxx). 빌드 시 주입 → 견적 페이지 FAB */
    NEXT_PUBLIC_KAKAO_CHANNEL_SEARCH_ID:
      process.env.NEXT_PUBLIC_KAKAO_CHANNEL_SEARCH_ID || "",
  },
};

export default nextConfig;
initOpenNextCloudflareForDev();
