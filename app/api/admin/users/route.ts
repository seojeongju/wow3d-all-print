import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { errorResponse, successResponse, requireAuth } from '@/lib/api-utils';

/**
 * GET /api/admin/users - 사용자 목록 (관리자 전용)
 * Query: ?q= (이메일·이름 검색)
 * Returns: id, email, name, phone, role, created_at (password_hash 제외)
 */
export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const { env } = getCloudflareContext();
        if (!env?.DB) return errorResponse('DB를 사용할 수 없습니다', 503);

        const me = await env.DB.prepare('SELECT role FROM users WHERE id = ?')
            .bind(auth.userId)
            .first() as { role?: string } | null;
        if (!me || me.role !== 'admin') {
            return errorResponse('관리자만 접근할 수 있습니다', 403);
        }

        const q = (req.nextUrl.searchParams.get('q') || '').trim();
        let stmt;
        if (q) {
            const like = `%${q}%`;
            stmt = env.DB.prepare(
                `SELECT id, email, name, phone, role, created_at 
                 FROM users 
                 WHERE email LIKE ? OR name LIKE ? 
                 ORDER BY created_at DESC 
                 LIMIT 200`
            ).bind(like, like);
        } else {
            stmt = env.DB.prepare(
                `SELECT id, email, name, phone, role, created_at 
                 FROM users 
                 ORDER BY created_at DESC 
                 LIMIT 200`
            );
        }
        const { results } = await stmt.all();

        return successResponse(results || []);
    } catch (e) {
        console.error('GET /api/admin/users', e);
        return errorResponse('사용자 목록 조회에 실패했습니다', 500);
    }
}
