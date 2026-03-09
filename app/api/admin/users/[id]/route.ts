import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { errorResponse, successResponse, requireAuth } from '@/lib/api-utils';

const ROLES = ['user', 'admin'] as const;

/**
 * PATCH /api/admin/users/[id] - 사용자 역할 변경 (관리자 전용)
 * Body: { role: 'user' | 'admin' }
 * - 자신의 역할은 변경할 수 없음
 */
export async function PATCH(
    req: NextRequest,
    ctx: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const { id } = await ctx.params;
        const numId = parseInt(id, 10);
        if (!Number.isInteger(numId)) {
            return errorResponse('잘못된 사용자 ID입니다', 400);
        }

        if (numId === auth.userId) {
            return errorResponse('자신의 역할은 변경할 수 없습니다', 400);
        }

        const { env } = getCloudflareContext();
        if (!env?.DB) return errorResponse('DB를 사용할 수 없습니다', 503);

        const me = await env.DB.prepare('SELECT role FROM users WHERE id = ?')
            .bind(auth.userId)
            .first() as { role?: string } | null;
        if (!me || me.role !== 'admin') {
            return errorResponse('관리자만 접근할 수 있습니다', 403);
        }

        let body: { role?: string };
        try {
            body = await req.json();
        } catch {
            return errorResponse('요청 본문이 올바른 JSON이 아닙니다', 400);
        }

        const role = typeof body?.role === 'string' && ROLES.includes(body.role as any)
            ? body.role
            : null;
        if (!role) {
            return errorResponse('role은 "user" 또는 "admin"이어야 합니다', 400);
        }

        const existing = await env.DB.prepare('SELECT id FROM users WHERE id = ?')
            .bind(numId)
            .first();
        if (!existing) {
            return errorResponse('사용자를 찾을 수 없습니다', 404);
        }

        await env.DB.prepare(
            'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        )
            .bind(role, numId)
            .run();

        return successResponse({ id: numId, role });
    } catch (e) {
        console.error('PATCH /api/admin/users/[id]', e);
        return errorResponse('역할 변경에 실패했습니다', 500);
    }
}
