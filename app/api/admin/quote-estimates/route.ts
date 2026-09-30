import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { errorResponse, successResponse, requireAdminAuth } from '@/lib/api-utils';

const ORDERED_SQL = 'EXISTS (SELECT 1 FROM order_items oi WHERE oi.quote_id = e.quote_id)';

const FILTER_SQL = {
    all: '1=1',
    unsaved: 'e.quote_id IS NULL',
    saved: `e.quote_id IS NOT NULL AND NOT ${ORDERED_SQL}`,
    ordered: `e.quote_id IS NOT NULL AND ${ORDERED_SQL}`,
} as const;
type FilterKey = keyof typeof FILTER_SQL;

function parseFilter(v: string | null): FilterKey {
    return v && v in FILTER_SQL ? (v as FilterKey) : 'unsaved';
}

function likePattern(raw: string): string {
    const t = raw.trim().replace(/[%_\\]/g, '');
    return t ? `%${t}%` : '';
}

/**
 * GET /api/admin/quote-estimates - 자동견적 확인 기록 (저장하지 않은 견적 포함)
 * Query: filter=unsaved|saved|ordered|all, page, limit, q(파일명·고객명·이메일)
 */
export async function GET(req: NextRequest) {
    try {
        const { env } = getCloudflareContext();
        if (!env?.DB) return errorResponse('DB를 사용할 수 없습니다', 503);

        const auth = await requireAdminAuth(req, env.DB);
        if (auth instanceof Response) return auth;

        const params = req.nextUrl.searchParams;
        const filter = parseFilter(params.get('filter'));
        const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(params.get('limit') || '12', 10) || 12));
        const offset = (page - 1) * limit;
        const pattern = likePattern(params.get('q') || '');

        let where = `WHERE ${FILTER_SQL[filter]}`;
        const binds: (string | number)[] = [];
        if (pattern) {
            where += ` AND (
                LOWER(e.file_name) LIKE LOWER(?)
                OR LOWER(COALESCE(u.name, '')) LIKE LOWER(?)
                OR LOWER(COALESCE(u.email, '')) LIKE LOWER(?)
            )`;
            binds.push(pattern, pattern, pattern);
        }

        const stats = await env.DB.prepare(
            `SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN e.quote_id IS NULL THEN 1 ELSE 0 END) AS unsaved,
                SUM(CASE WHEN e.quote_id IS NOT NULL AND NOT ${ORDERED_SQL} THEN 1 ELSE 0 END) AS saved,
                SUM(CASE WHEN e.quote_id IS NOT NULL AND ${ORDERED_SQL} THEN 1 ELSE 0 END) AS ordered,
                SUM(CASE WHEN e.quote_id IS NULL THEN e.total_price ELSE 0 END) AS unsaved_amount,
                SUM(CASE WHEN e.user_id IS NOT NULL THEN 1 ELSE 0 END) AS member_count
             FROM quote_estimate_logs e`
        ).first<Record<string, number | null>>();

        const countRow = await env.DB.prepare(
            `SELECT COUNT(*) AS cnt FROM quote_estimate_logs e LEFT JOIN users u ON e.user_id = u.id ${where}`
        )
            .bind(...binds)
            .first<{ cnt?: number }>();
        const total = Number(countRow?.cnt ?? 0);

        const { results } = await env.DB.prepare(
            `SELECT
                e.id, e.user_id, e.session_id, e.file_name, e.file_size,
                e.dimensions_x, e.dimensions_y, e.dimensions_z, e.volume_cm3,
                e.print_method, e.material_name, e.layer_height, e.fdm_infill,
                e.total_price, e.estimated_time_hours, e.change_count,
                e.thumbnail_data, e.quote_id, e.guide_source, e.created_at, e.updated_at,
                u.name AS user_name, u.email AS user_email, u.phone AS user_phone,
                (SELECT o.order_number FROM order_items oi JOIN orders o ON oi.order_id = o.id
                 WHERE oi.quote_id = e.quote_id LIMIT 1) AS order_number
             FROM quote_estimate_logs e
             LEFT JOIN users u ON e.user_id = u.id
             ${where}
             ORDER BY e.updated_at DESC
             LIMIT ? OFFSET ?`
        )
            .bind(...binds, limit, offset)
            .all();

        return successResponse({
            items: results || [],
            stats: {
                total: Number(stats?.total ?? 0),
                unsaved: Number(stats?.unsaved ?? 0),
                saved: Number(stats?.saved ?? 0),
                ordered: Number(stats?.ordered ?? 0),
                unsavedAmount: Number(stats?.unsaved_amount ?? 0),
                memberCount: Number(stats?.member_count ?? 0),
            },
            pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
        });
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes('no such table')) {
            return errorResponse('견적 확인 기록 테이블이 아직 없습니다 (schema_quote_estimate_logs.sql 적용 필요)', 503);
        }
        console.error('GET /api/admin/quote-estimates', e);
        return errorResponse('견적 확인 기록 조회 실패', 500);
    }
}
