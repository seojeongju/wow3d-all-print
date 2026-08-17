import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAuthOrGuest } from '@/lib/api-utils'
import { MESHY_USER_DAILY_LIMIT, resolveMeshyApiKey } from '@/lib/meshy'
import { getMeshyQuotaSnapshot } from '@/lib/meshy-quota'

/**
 * GET /api/meshy/quota
 * 로그인 회원 기준 오늘(KST) 남은 횟수 + 보너스
 */
export async function GET(request: NextRequest) {
    try {
        const auth = await requireAuthOrGuest(request)
        let configured = false
        try {
            configured = !!resolveMeshyApiKey(
                getCloudflareContext().env as unknown as Record<string, unknown>
            )
        } catch {
            configured = !!resolveMeshyApiKey(null)
        }

        if (auth instanceof Response) {
            return NextResponse.json({
                success: true,
                data: {
                    configured,
                    loginRequired: true,
                    limit: MESHY_USER_DAILY_LIMIT,
                    usedToday: 0,
                    remainingToday: 0,
                    remainingDaily: 0,
                    bonusRemaining: 0,
                    remainingTotal: 0,
                    resetsHint: '매일 자정(한국 시간)에 일일 횟수가 초기화됩니다',
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
                    remainingDaily: 0,
                    bonusRemaining: 0,
                    remainingTotal: 0,
                    resetsHint: '로그인 후 계정당 하루 1회(+보너스) 이용할 수 있습니다',
                },
            })
        }

        const { env } = getCloudflareContext()
        if (!env?.DB) {
            return NextResponse.json({ error: 'DB를 사용할 수 없습니다' }, { status: 503 })
        }

        const snap = await getMeshyQuotaSnapshot(env.DB, auth.userId)

        return NextResponse.json({
            success: true,
            data: {
                configured,
                loginRequired: false,
                limit: snap.limit,
                usedToday: snap.usedToday,
                remainingToday: snap.remainingDaily,
                remainingDaily: snap.remainingDaily,
                bonusRemaining: snap.bonusRemaining,
                remainingTotal: snap.remainingTotal,
                resetsHint:
                    snap.bonusRemaining > 0
                        ? `일일 ${snap.limit}회는 자정(KST) 초기화 · 보너스 ${snap.bonusRemaining}회 보유`
                        : '매일 자정(한국 시간)에 일일 횟수가 초기화됩니다',
            },
        })
    } catch (e) {
        console.error('GET /api/meshy/quota', e)
        return NextResponse.json({ error: '한도 조회 실패' }, { status: 500 })
    }
}
