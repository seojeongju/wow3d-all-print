import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  /** 네이버·소셜 크롤러가 OG 이미지를 안정적으로 캐시하도록 */
  async headers() {
    return [
      {
        source: '/og-:name.jpg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400',
          },
          { key: 'Content-Type', value: 'image/jpeg' },
        ],
      },
      {
        source: '/thumbnail.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400',
          },
        ],
      },
    ]
  },
  env: {
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://www.wow3dp.co.kr'
        : 'http://localhost:3000'),
    NEXT_PUBLIC_KAKAO_CHANNEL_SEARCH_ID:
      process.env.NEXT_PUBLIC_KAKAO_CHANNEL_SEARCH_ID || '',
    NEXT_PUBLIC_KAKAO_MAP_APP_KEY:
      process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY || '',
    NEXT_PUBLIC_NAVER_TALKTALK_ID:
      process.env.NEXT_PUBLIC_NAVER_TALKTALK_ID || 'wowi7tu',
    NEXT_PUBLIC_NAVER_TALKTALK_CHAT_URL:
      process.env.NEXT_PUBLIC_NAVER_TALKTALK_CHAT_URL ||
      'https://talk.naver.com/profile/wowi7tu',
    NEXT_PUBLIC_NAVER_TALKTALK_BANNER_ID:
      process.env.NEXT_PUBLIC_NAVER_TALKTALK_BANNER_ID || '',
  },
}

export default withNextIntl(nextConfig)
initOpenNextCloudflareForDev()
