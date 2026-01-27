import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { errorResponse, successResponse, requireAdminAuth } from '@/lib/api-utils';

/**
 * GET /api/admin/users - 사용자 목록 (관리자 전용)
 * Query: ?q= (이메일·이름 검색)
 * Returns: id, email, name, phone, role, created_at (password_hash 제외)
 */
export async function GET(req: NextRequest) {
    try {
        const { env } = getCloudflareContext();
        if (!env?.DB) return errorResponse('DB를 사용할 수 없습니다', 503);

        // 인증 및 store_id 획득
        const auth = await requireAdminAuth(req, env.DB);
        if (auth instanceof Response) return auth;

        const { storeId } = auth;

        const q = (req.nextUrl.searchParams.get('q') || '').trim();
        let stmt;
        if (q) {
            const like = `%${q}%`;
            stmt = env.DB.prepare(
                `SELECT id, email, name, phone, role, created_at 
                 FROM users 
                 WHERE store_id = ? AND (email LIKE ? OR name LIKE ?)
                 ORDER BY created_at DESC 
                 LIMIT 200`
            ).bind(storeId, like, like);
        } else {
            stmt = env.DB.prepare(
                `SELECT id, email, name, phone, role, created_at 
                 FROM users 
                 WHERE store_id = ?
                 ORDER BY created_at DESC 
                 LIMIT 200`
            ).bind(storeId);
        }
        const { results } = await stmt.all();

        return successResponse(results || []);
    } catch (e) {
        console.error('GET /api/admin/users', e);
        return errorResponse('사용자 목록 조회에 실패했습니다', 500);
    }
}
