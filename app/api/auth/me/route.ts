import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { errorResponse, successResponse, requireAuth } from '@/lib/api-utils';

function mapUserRow(raw: Record<string, unknown>) {
    return {
        id: Number(raw.id),
        email: String(raw.email ?? ''),
        name: String(raw.name ?? ''),
        phone: raw.phone != null && String(raw.phone).trim() !== '' ? String(raw.phone) : undefined,
        role: (raw.role as string) ?? 'user',
        store_id: raw.store_id != null ? Number(raw.store_id) : undefined,
        createdAt: String(raw.created_at ?? ''),
        updatedAt: String(raw.updated_at ?? ''),
    };
}

/**
 * GET /api/auth/me - 현재 사용자 정보 조회
 */
export async function GET(request: NextRequest) {
    try {
        const { env } = getCloudflareContext();

        const auth = await requireAuth(request);
        if (auth instanceof Response) {
            return auth;
        }

        if (!env?.DB) {
            return errorResponse('데이터베이스를 사용할 수 없습니다', 503);
        }

        const user = await env.DB
            .prepare('SELECT id, email, name, phone, role, store_id, created_at, updated_at FROM users WHERE id = ?')
            .bind(auth.userId)
            .first();

        if (!user) {
            return errorResponse('사용자를 찾을 수 없습니다', 404);
        }

        return successResponse(mapUserRow(user as Record<string, unknown>));
    } catch (error: any) {
        console.error('GET /api/auth/me error:', error);
        return errorResponse(error.message || '사용자 정보 조회 실패', 500);
    }
}

/**
 * PATCH /api/auth/me - 내 정보 수정
 */
export async function PATCH(request: NextRequest) {
    try {
        const { env } = getCloudflareContext();
        const body = await request.json();

        const auth = await requireAuth(request);
        if (auth instanceof Response) {
            return auth;
        }

        if (!env?.DB) {
            return errorResponse('데이터베이스를 사용할 수 없습니다', 503);
        }

        const { name, phone } = body as { name?: unknown; phone?: unknown };

        if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
            return errorResponse('이름을 입력해주세요', 400);
        }

        const sets: string[] = [];
        const binds: (string | number | null)[] = [];

        if (typeof name === 'string') {
            sets.push('name = ?');
            binds.push(name.trim());
        }

        if (phone !== undefined) {
            sets.push('phone = ?');
            const phoneValue =
                typeof phone === 'string' && phone.trim() !== '' ? phone.trim() : null;
            binds.push(phoneValue);
        }

        if (sets.length === 0) {
            return errorResponse('수정할 항목이 없습니다', 400);
        }

        sets.push('updated_at = CURRENT_TIMESTAMP');
        binds.push(auth.userId);

        await env.DB
            .prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`)
            .bind(...binds)
            .run();

        const updatedUser = await env.DB
            .prepare('SELECT id, email, name, phone, role, store_id, created_at, updated_at FROM users WHERE id = ?')
            .bind(auth.userId)
            .first();

        if (!updatedUser) {
            return errorResponse('사용자를 찾을 수 없습니다', 404);
        }

        return successResponse(mapUserRow(updatedUser as Record<string, unknown>), '정보가 수정되었습니다');
    } catch (error: any) {
        console.error('PATCH /api/auth/me error:', error);
        return errorResponse(error.message || '정보 수정 실패', 500);
    }
}
