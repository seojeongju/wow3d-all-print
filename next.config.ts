import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages 호환성
  images: {
    unoptimized: true, // Cloudflare는 자체 이미지 최적화 사용
  },

  // 정적 export 설정 (필요시)
  // output: 'export',

  // 환경 변수
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
};

export default nextConfig;
