import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAdminAuth } from '@/lib/api-utils'
import { MESHY_TODAY_KST_SQL, MESHY_USER_DAILY_LIMIT } from '@/lib/meshy'

function likePattern(raw: string): string {
    const t = raw.trim().replace(/[%_\\]/g, '')
    if (!t) return ''
    return `%${t}%`
}

export type AdminMeshyUserRow = {
    id: number
    email: string
    name: string | null
    phone: string | null
    jobCount: number
    lastJobAt: string | null
    bonusRemaining: number
    usedToday: number
    remainingDaily: number
    remainingTotal: number
}

/**
 * GET /api/admin/meshy/users
 * Query: q (이메일·이름·연락처·숫자 ID), scope=meshy|all, limit
 */
export async function GET(req: NextRequest) {
    const { env } = getCloudflareContext()
    if (!env?.DB) return NextResponse.json({ error: 'DB를 사용할 수 없습니다' }, { status: 503 })

    const auth = await requireAdminAuth(req, env.DB)
    if (auth instanceof Response) return auth

    const qRaw = (req.nextUrl.searchParams.get('q') || '').trim()
    const scope = req.nextUrl.searchParams.get('scope') === 'all' ? 'all' : 'meshy'
    const limitRaw = parseInt(req.nextUrl.searchParams.get('limit') || '15', 10) || 15
    const limit = Math.min(30, Math.max(1, limitRaw))
    const idExact = /^\d+$/.test(qRaw) ? parseInt(qRaw, 10) : null
    const pattern = likePattern(qRaw)

    try {
        let where = 'WHERE u.store_id = ?'
        const binds: (string | number)[] = [auth.storeId]

        if (idExact != null) {
            where += ' AND u.id = ?'
            binds.push(idExact)
        } else if (pattern) {
            where += ` AND (
                LOWER(COALESCE(u.email, '')) LIKE LOWER(?)
                OR LOWER(COALESCE(u.name, '')) LIKE LOWER(?)
                OR COALESCE(u.phone, '') LIKE ?
            )`
            binds.push(pattern, pattern, pattern)
        }

        if (scope === 'meshy') {
            where += ` AND (
                EXISTS (SELECT 1 FROM meshy_jobs j WHERE j.user_id = u.id)
                OR EXISTS (
                    SELECT 1 FROM meshy_bonus_credits b
                    WHERE b.user_id = u.id AND b.remaining > 0
                )
            )`
        }

        const sql = `
            SELECT
                u.id,
                u.email,
                u.name,
                u.phone,
                COALESCE(jstats.job_count, 0) AS job_count,
                jstats.last_job_at,
                COALESCE(bonus.bonus_remaining, 0) AS bonus_remaining,
                COALESCE(today.used_today, 0) AS used_today
            FROM users u
            LEFT JOIN (
                SELECT user_id, COUNT(*) AS job_count, MAX(created_at) AS last_job_at
                FROM meshy_jobs
                GROUP BY user_id
            ) jstats ON jstats.user_id = u.id
            LEFT JOIN (
                SELECT user_id, SUM(remaining) AS bonus_remaining
                FROM meshy_bonus_credits
                WHERE remaining > 0
                GROUP BY user_id
            ) bonus ON bonus.user_id = u.id
            LEFT JOIN (
                SELECT user_id, COUNT(*) AS used_today
                FROM meshy_jobs
                WHERE ${MESHY_TODAY_KST_SQL} AND status != 'failed'
                GROUP BY user_id
            ) today ON today.user_id = u.id
            ${where}
            ORDER BY
                jstats.last_job_at IS NULL,
                jstats.last_job_at DESC,
                u.created_at DESC
            LIMIT ?
        `

        const { results } = await env.DB.prepare(sql).bind(...binds, limit).all<{
            id: number
            email: string
            name: string | null
            phone: string | null
            job_count: number
            last_job_at: string | null
            bonus_remaining: number
            used_today: number
        }>()

        const items: AdminMeshyUserRow[] = (results || []).map((row: {
            id: number
            email: string
            name: string | null
            phone: string | null
            job_count: number
            last_job_at: string | null
            bonus_remaining: number
            used_today: number
        }) => {
            const usedToday = Number(row.used_today) || 0
            const bonusRemaining = Number(row.bonus_remaining) || 0
            const remainingDaily = Math.max(0, MESHY_USER_DAILY_LIMIT - usedToday)
            return {
                id: row.id,
                email: row.email,
                name: row.name,
                phone: row.phone,
                jobCount: Number(row.job_count) || 0,
                lastJobAt: row.last_job_at,
                bonusRemaining,
                usedToday,
                remainingDaily,
                remainingTotal: remainingDaily + bonusRemaining,
            }
        })

        return NextResponse.json({ success: true, data: { items } })
    } catch (e) {
        console.error('GET /api/admin/meshy/users', e)
        const msg =
            e instanceof Error && /no such table/i.test(e.message)
                ? 'meshy 관련 테이블이 없습니다. 마이그레이션을 확인하세요.'
                : '회원 검색에 실패했습니다'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
