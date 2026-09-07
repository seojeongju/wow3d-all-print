import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

/**
 * GET /api/makerspace/map-config
 * 카카오 지도 JS 키(공개용) — 빌드 없이 대시보드 변수로 교체 가능
 */
export async function GET() {
    let appKey = ''
    try {
        const cfEnv = (getCloudflareContext().env || {}) as unknown as Record<string, string | undefined>
        appKey = (
            cfEnv.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ||
            cfEnv.KAKAO_MAP_JS_KEY ||
            process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ||
            process.env.KAKAO_MAP_JS_KEY ||
            ''
        ).trim()
    } catch {
        appKey = (
            process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ||
            process.env.KAKAO_MAP_JS_KEY ||
            ''
        ).trim()
    }

    return NextResponse.json(
        { appKey: appKey || null },
        {
            headers: {
                'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
            },
        },
    )
}
