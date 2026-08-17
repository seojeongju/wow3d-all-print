import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAuthOrGuest } from '@/lib/api-utils'
import {
    MESHY_TODAY_KST_SQL,
    MESHY_USER_DAILY_LIMIT,
    resolveMeshyApiKey,
} from '@/lib/meshy'

/**
 * GET /api/meshy/quota
 * 로그인 회원 기준 오늘(KST) 남은 AI 모델링 횟수
 */
export async function GET(request: NextRequest) {
    try {
        const auth = await requireAuthOrGuest(request)
        const configured = !!resolveMeshyApiKey(
            (() => {
                try {
                    return getCloudflareContext().env as unknown as Record<string, unknown>
                } catch {
                    return null
                }
            })()
        )

        if (auth instanceof Response) {
            return NextResponse.json({
                success: true,
                data: {
                    configured,
                    loginRequired: true,
                    limit: MESHY_USER_DAILY_LIMIT,
                    usedToday: 0,
                    remainingToday: 0,
                    resetsHint: '매일 자정(한국 시간)에 초기화됩니다',
                },
            })
        }

        if (auth.isGuest) {
            return NextResponse.json({
                success: true,
                data: {
                    configured,
                    loginRequired: true,
                    limit: MESHY_USER_DAILY_LIMIT,
                    usedToday: 0,
                    remainingToday: 0,
                    resetsHint: '로그인 후 계정당 하루 1회 이용할 수 있습니다',
                },
            })
        }

        const { env } = getCloudflareContext()
        if (!env?.DB) {
            return NextResponse.json({ error: 'DB를 사용할 수 없습니다' }, { status: 503 })
        }

        const r = await env.DB.prepare(
            `SELECT COUNT(*) AS c FROM meshy_jobs
             WHERE user_id = ?
               AND ${MESHY_TODAY_KST_SQL}
               AND status != 'failed'`
        )
            .bind(auth.userId)
            .first<{ c: number }>()

        const usedToday = Number(r?.c) || 0
        const remainingToday = Math.max(0, MESHY_USER_DAILY_LIMIT - usedToday)

        return NextResponse.json({
            success: true,
            data: {
                configured,
                loginRequired: false,
                limit: MESHY_USER_DAILY_LIMIT,
                usedToday,
                remainingToday,
                resetsHint: '매일 자정(한국 시간)에 초기화됩니다',
            },
        })
    } catch (e) {
        console.error('GET /api/meshy/quota', e)
        return NextResponse.json({ error: '한도 조회 실패' }, { status: 500 })
    }
}
