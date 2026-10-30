import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAdminAuth } from '@/lib/api-utils'
import { adminUserDisplayPhoneSql, adminUserPhoneSearchSql } from '@/lib/admin-user-phone'
import { buildAdminUsersXlsx, type AdminUserExportRow } from '@/lib/admin-users-xlsx'
import { kstTodayISO } from '@/lib/date-utils'

function likePattern(raw: string): string {
    const t = raw.trim().replace(/[%_\\]/g, '')
    if (!t) return ''
    return `%${t}%`
}

const ROLE_FILTER_SET = new Set(['user', 'admin'])
const EXPORT_MAX = 10000

/**
 * GET /api/admin/users/export
 * Query: q, role — 현재 필터와 동일한 조건의 사용자 목록을 Excel(.xlsx)로 다운로드
 */
export async function GET(req: NextRequest) {
    try {
        const { env } = getCloudflareContext()
        if (!env?.DB) {
            return NextResponse.json({ error: 'DB를 사용할 수 없습니다' }, { status: 503 })
        }

        const auth = await requireAdminAuth(req, env.DB)
        if (auth instanceof Response) return auth

        const pattern = likePattern(req.nextUrl.searchParams.get('q') || '')
        const roleParam = (req.nextUrl.searchParams.get('role') || 'all').trim()
        const roleFilter = ROLE_FILTER_SET.has(roleParam) ? roleParam : ''

        let where = 'WHERE users.store_id = ?'
        const binds: (string | number)[] = [auth.storeId]

        if (pattern) {
            where += ` AND (
                LOWER(COALESCE(users.email, '')) LIKE LOWER(?)
                OR LOWER(COALESCE(users.name, '')) LIKE LOWER(?)
                OR ${adminUserPhoneSearchSql()}
            )`
            binds.push(pattern, pattern, pattern, pattern)
        }
        if (roleFilter) {
            where += ' AND users.role = ?'
            binds.push(roleFilter)
        }

        const { results } = await env.DB.prepare(
            `SELECT users.id, users.email, users.name,
                    ${adminUserDisplayPhoneSql('users.id')} AS phone,
                    users.role, users.created_at
             FROM users ${where}
             ORDER BY users.created_at DESC
             LIMIT ?`
        )
            .bind(...binds, EXPORT_MAX)
            .all()

        const rows = (results || []) as AdminUserExportRow[]
        const buffer = await buildAdminUsersXlsx(rows)

        const date = kstTodayISO()
        const fileName = `wow3d-users-${date}.xlsx`

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type':
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
                'Cache-Control': 'no-store',
            },
        })
    } catch (e) {
        console.error('GET /api/admin/users/export', e)
        return NextResponse.json({ error: '엑셀 다운로드에 실패했습니다' }, { status: 500 })
    }
}
