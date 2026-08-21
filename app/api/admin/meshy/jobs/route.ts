import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAdminAuth } from '@/lib/api-utils'

/**
 * GET /api/admin/meshy/jobs
 * Query: status=all|succeeded|failed|in_progress, userId, q, page, limit
 */
export async function GET(req: NextRequest) {
    const { env } = getCloudflareContext()
    if (!env?.DB) return NextResponse.json({ error: 'DB를 사용할 수 없습니다' }, { status: 503 })

    const auth = await requireAdminAuth(req, env.DB)
    if (auth instanceof Response) return auth

    const sp = req.nextUrl.searchParams
    const status = (sp.get('status') || 'all').trim()
    const userIdRaw = sp.get('userId')
    const q = (sp.get('q') || '').trim()
    const page = Math.max(1, parseInt(sp.get('page') || '1', 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(sp.get('limit') || '20', 10) || 20))
    const offset = (page - 1) * limit

    const where: string[] = []
    const binds: (string | number)[] = []

    if (status === 'succeeded') {
        where.push(`j.status = 'succeeded'`)
    } else if (status === 'failed') {
        where.push(`j.status = 'failed'`)
    } else if (status === 'in_progress') {
        where.push(`j.status IN ('pending','uploading','queued','processing')`)
    } else if (status === 'canceled') {
        where.push(`j.status = 'canceled'`)
    }

    if (userIdRaw && /^\d+$/.test(userIdRaw)) {
        where.push('j.user_id = ?')
        binds.push(parseInt(userIdRaw, 10))
    }

    if (q) {
        const like = `%${q.replace(/[%_\\]/g, '')}%`
        if (/^\d+$/.test(q)) {
            where.push('(j.id = ? OR j.user_id = ? OR j.quote_id = ? OR LOWER(COALESCE(u.email,\'\')) LIKE LOWER(?) OR LOWER(COALESCE(u.name,\'\')) LIKE LOWER(?) OR LOWER(COALESCE(j.source_file_name,\'\')) LIKE LOWER(?) OR LOWER(COALESCE(j.result_file_name,\'\')) LIKE LOWER(?))')
            const idNum = parseInt(q, 10)
            binds.push(idNum, idNum, idNum, like, like, like, like)
        } else {
            where.push('(LOWER(COALESCE(u.email,\'\')) LIKE LOWER(?) OR LOWER(COALESCE(u.name,\'\')) LIKE LOWER(?) OR LOWER(COALESCE(j.source_file_name,\'\')) LIKE LOWER(?) OR LOWER(COALESCE(j.result_file_name,\'\')) LIKE LOWER(?))')
            binds.push(like, like, like, like)
        }
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

    try {
        const countRow = await env.DB.prepare(
            `SELECT COUNT(*) AS c
             FROM meshy_jobs j
             LEFT JOIN users u ON u.id = j.user_id
             ${whereSql}`
        )
            .bind(...binds)
            .first<{ c: number }>()

        const total = Number(countRow?.c) || 0

        const list = await env.DB.prepare(
            `SELECT
                j.id,
                j.user_id,
                j.session_id,
                j.status,
                j.progress,
                j.credits_used,
                j.error_message,
                j.source_file_name,
                j.result_file_name,
                j.source_image_key,
                j.result_file_key,
                j.thumbnail_url,
                j.quote_id,
                j.created_at,
                j.updated_at,
                u.email AS user_email,
                u.name AS user_name,
                (SELECT oi.order_id FROM order_items oi WHERE oi.quote_id = j.quote_id LIMIT 1) AS order_id,
                (SELECT o.order_number FROM order_items oi
                    JOIN orders o ON o.id = oi.order_id
                    WHERE oi.quote_id = j.quote_id LIMIT 1) AS order_number
             FROM meshy_jobs j
             LEFT JOIN users u ON u.id = j.user_id
             ${whereSql}
             ORDER BY j.id DESC
             LIMIT ? OFFSET ?`
        )
            .bind(...binds, limit, offset)
            .all()

        const jobs = ((list.results || []) as Record<string, unknown>[]).map((r) => {
            return {
                id: Number(r.id),
                userId: r.user_id != null ? Number(r.user_id) : null,
                sessionId: (r.session_id as string) || null,
                status: String(r.status),
                progress: r.progress != null ? Number(r.progress) : null,
                creditsUsed: r.credits_used != null ? Number(r.credits_used) : null,
                errorMessage: (r.error_message as string) || null,
                sourceFileName: (r.source_file_name as string) || null,
                resultFileName: (r.result_file_name as string) || null,
                hasSource: Boolean(r.source_image_key),
                hasModel: Boolean(r.result_file_key) && String(r.status) === 'succeeded',
                thumbnailUrl: (r.thumbnail_url as string) || null,
                quoteId: r.quote_id != null ? Number(r.quote_id) : null,
                orderId: r.order_id != null ? Number(r.order_id) : null,
                orderNumber: (r.order_number as string) || null,
                createdAt: String(r.created_at || ''),
                updatedAt: String(r.updated_at || ''),
                userEmail: (r.user_email as string) || null,
                userName: (r.user_name as string) || null,
            }
        })

        return NextResponse.json({
            success: true,
            data: {
                jobs,
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        })
    } catch (e) {
        console.error('GET /api/admin/meshy/jobs', e)
        const msg =
            e instanceof Error && /no such table/i.test(e.message)
                ? 'meshy_jobs 테이블이 없습니다'
                : '작업 목록 조회 실패'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
