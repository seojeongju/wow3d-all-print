import { NextRequest } from 'next/server';
import { getOptionalRequestContext } from '@cloudflare/next-on-pages';
import type { Env } from '@/env';
import { errorResponse, successResponse, verifyPassword, generateToken } from '@/lib/api-utils';

export const runtime = 'edge';

/**
 * POST /api/auth/login - 로그인
 */
export async function POST(request: NextRequest) {
    try {
        // Cloudflare env (D1 등): getOptionalRequestContext는 throw 대신 undefined 반환
        const ctx = getOptionalRequestContext() as { env?: { DB?: Env['DB'] } } | undefined;
        const env = ctx?.env;

        if (!env?.DB) {
            return errorResponse('데이터베이스를 사용할 수 없습니다. (D1 바인딩 확인)', 503);
        }

        let body: { email?: string; password?: string };
        try {
            body = await request.json();
        } catch (_e) {
            return errorResponse('요청 본문이 올바른 JSON이 아닙니다', 400);
        }

        if (!body?.email || !body?.password) {
            return errorResponse('이메일과 비밀번호를 입력해주세요', 400);
        }

        // 사용자 조회 (SELECT *: role 컬럼이 없을 수 있음)
        const raw = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
            .bind((body.email || '').trim())
            .first() as Record<string, unknown> | null;

        const passwordHash = (raw?.password_hash ?? raw?.passwordHash) as string | undefined;
        if (!raw || !passwordHash) {
            return errorResponse('이메일 또는 비밀번호가 올바르지 않습니다', 401);
        }

        const isPasswordValid = await verifyPassword(body.password, passwordHash);
        if (!isPasswordValid) {
            return errorResponse('이메일 또는 비밀번호가 올바르지 않습니다', 401);
        }

        const userId = Number(raw.id ?? raw.ID);
        const email = String(raw.email ?? '');
        const token = await generateToken(userId, email);

        return successResponse(
            {
                user: {
                    id: userId,
                    email,
                    name: String(raw.name ?? ''),
                    phone: raw.phone != null ? String(raw.phone) : undefined,
                    role: (raw.role as string) ?? 'user',
                },
                token,
            },
            '로그인 성공'
        );
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('POST /api/auth/login error:', msg, error);
        return errorResponse('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.', 500);
    }
}
