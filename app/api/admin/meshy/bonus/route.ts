import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAdminAuth } from '@/lib/api-utils'
import { grantMeshyBonusCredits, getMeshyQuotaSnapshot } from '@/lib/meshy-quota'

/**
 * POST /api/admin/meshy/bonus
 * body: { userId: number, amount?: number, note?: string }
 */
export async function POST(req: NextRequest) {
    const { env } = getCloudflareContext()
    if (!env?.DB) return NextResponse.json({ error: 'DB를 사용할 수 없습니다' }, { status: 503 })

    const auth = await requireAdminAuth(req, env.DB)
    if (auth instanceof Response) return auth

    try {
        const body = (await req.json()) as { userId?: number; amount?: number; note?: string }
        const userId = Number(body.userId)
        const amount = Number(body.amount ?? 1)
        if (!Number.isInteger(userId) || userId < 1) {
            return NextResponse.json({ error: '유효한 userId가 필요합니다' }, { status: 400 })
        }
        if (!Number.isFinite(amount) || amount < 1 || amount > 100) {
            return NextResponse.json({ error: '횟수는 1~100 사이여야 합니다' }, { status: 400 })
        }

        const user = await env.DB.prepare(`SELECT id, email, name FROM users WHERE id = ?`)
            .bind(userId)
            .first<{ id: number; email: string; name: string }>()
        if (!user) {
            return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 })
        }

        const grantId = await grantMeshyBonusCredits(
            env.DB,
            userId,
            amount,
            body.note?.trim() || '관리자 추가 생성 횟수',
            auth.userId
        )
        if (!grantId) {
            return NextResponse.json(
                { error: '보너스 테이블이 없습니다. schema_meshy_bonus.sql 마이그레이션을 실행하세요.' },
                { status: 503 }
            )
        }

        const snap = await getMeshyQuotaSnapshot(env.DB, userId)
        return NextResponse.json({
            success: true,
            data: {
                grantId,
                user,
                granted: Math.floor(amount),
                quota: snap,
            },
        })
    } catch (e) {
        console.error('POST /api/admin/meshy/bonus', e)
        const msg = e instanceof Error && /no such table/i.test(e.message)
            ? 'meshy_bonus_credits 테이블이 없습니다. 마이그레이션을 실행하세요.'
            : '보너스 부여 실패'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
