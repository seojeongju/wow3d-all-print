import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAdminAuth } from '@/lib/api-utils'
import { MESHY_TODAY_KST_SQL } from '@/lib/meshy'

/**
 * GET /api/admin/meshy/stats
 * 사진→AI 3D 사용량·실패율 (KST 오늘 + 최근 7일)
 */
export async function GET(req: NextRequest) {
    const { env } = getCloudflareContext()
    if (!env?.DB) return NextResponse.json({ error: 'DB를 사용할 수 없습니다' }, { status: 503 })

    const auth = await requireAdminAuth(req, env.DB)
    if (auth instanceof Response) return auth

    try {
        const today = await env.DB.prepare(
            `SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END) AS succeeded,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
                SUM(CASE WHEN status IN ('queued','processing','uploading') THEN 1 ELSE 0 END) AS in_progress,
                COALESCE(SUM(credits_used), 0) AS credits
             FROM meshy_jobs
             WHERE ${MESHY_TODAY_KST_SQL}`
        ).first<{
            total: number
            succeeded: number
            failed: number
            in_progress: number
            credits: number
        }>()

        const week = await env.DB.prepare(
            `SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END) AS succeeded,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
                COALESCE(SUM(credits_used), 0) AS credits
             FROM meshy_jobs
             WHERE created_at >= datetime('now', '-7 days')`
        ).first<{
            total: number
            succeeded: number
            failed: number
            credits: number
        }>()

        const recent = await env.DB.prepare(
            `SELECT j.id, j.user_id, j.status, j.progress, j.credits_used, j.error_message,
                    j.source_file_name, j.created_at, u.email AS user_email, u.name AS user_name
             FROM meshy_jobs j
             LEFT JOIN users u ON u.id = j.user_id
             ORDER BY j.id DESC
             LIMIT 40`
        ).all()

        let bonusOutstanding = 0
        try {
            const b = await env.DB.prepare(
                `SELECT COALESCE(SUM(remaining), 0) AS s FROM meshy_bonus_credits WHERE remaining > 0`
            ).first<{ s: number }>()
            bonusOutstanding = Number(b?.s) || 0
        } catch {
            bonusOutstanding = 0
        }

        return NextResponse.json({
            success: true,
            data: {
                today: {
                    total: Number(today?.total) || 0,
                    succeeded: Number(today?.succeeded) || 0,
                    failed: Number(today?.failed) || 0,
                    inProgress: Number(today?.in_progress) || 0,
                    credits: Number(today?.credits) || 0,
                },
                week: {
                    total: Number(week?.total) || 0,
                    succeeded: Number(week?.succeeded) || 0,
                    failed: Number(week?.failed) || 0,
                    credits: Number(week?.credits) || 0,
                },
                bonusOutstanding,
                recent: recent.results || [],
            },
        })
    } catch (e) {
        console.error('GET /api/admin/meshy/stats', e)
        const msg = e instanceof Error && /no such table/i.test(e.message)
            ? 'meshy_jobs 테이블이 없습니다'
            : '통계 조회 실패'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
