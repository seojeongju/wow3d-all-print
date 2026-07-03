import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { errorResponse, successResponse, requireAdminAuth } from '@/lib/api-utils';

function likePattern(raw: string): string {
    const t = raw.trim().replace(/[%_\\]/g, '');
    if (!t) return '';
    return `%${t}%`;
}

const ROLE_FILTER_SET = new Set(['user', 'admin']);

/**
 * GET /api/admin/users - 사용자 목록 (관리자 전용)
 * Query: page, limit, q (이메일·이름·연락처), role (all|user|admin)
 */
export async function GET(req: NextRequest) {
    try {
        const { env } = getCloudflareContext();
        if (!env?.DB) return errorResponse('DB를 사용할 수 없습니다', 503);

        const auth = await requireAdminAuth(req, env.DB);
        if (auth instanceof Response) return auth;

        const { storeId } = auth;

        const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1', 10) || 1);
        const limitRaw = parseInt(req.nextUrl.searchParams.get('limit') || '20', 10) || 20;
        const limit = Math.min(100, Math.max(1, limitRaw));
        const offset = (page - 1) * limit;

        const pattern = likePattern(req.nextUrl.searchParams.get('q') || '');
        const roleParam = (req.nextUrl.searchParams.get('role') || 'all').trim();
        const roleFilter = ROLE_FILTER_SET.has(roleParam) ? roleParam : '';

        let where = 'WHERE store_id = ?';
        const binds: (string | number)[] = [storeId];

        if (pattern) {
            where += ` AND (
                LOWER(COALESCE(email, '')) LIKE LOWER(?)
                OR LOWER(COALESCE(name, '')) LIKE LOWER(?)
                OR COALESCE(phone, '') LIKE ?
            )`;
            binds.push(pattern, pattern, pattern);
        }
        if (roleFilter) {
            where += ' AND role = ?';
            binds.push(roleFilter);
        }

        const countRow = await env.DB.prepare(`SELECT COUNT(*) as cnt FROM users ${where}`)
            .bind(...binds)
            .first() as { cnt?: number } | null;
        const total = Number(countRow?.cnt ?? 0);
        const totalPages = Math.max(1, Math.ceil(total / limit));

        const { results } = await env.DB.prepare(
            `SELECT id, email, name, phone, role, created_at
             FROM users ${where}
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`
        ).bind(...binds, limit, offset).all();

        return successResponse({
            items: results || [],
            pagination: { page, limit, total, totalPages },
        });
    } catch (e) {
        console.error('GET /api/admin/users', e);
        return errorResponse('사용자 목록 조회에 실패했습니다', 500);
    }
}
