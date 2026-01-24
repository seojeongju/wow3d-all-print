import { NextRequest } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import type { Env } from '@/env';
import { errorResponse, successResponse, verifyPassword, generateToken } from '@/lib/api-utils';

export const runtime = 'edge';

/**
 * POST /api/auth/login - 로그인
 */
export async function POST(request: NextRequest) {
    try {
        let env: any;
        try {
            const ctx = getRequestContext();
            if (ctx && (ctx as any).env) {
                env = (ctx as any).env;
            }
        } catch (e) {
            // getRequestContext failed or not in edge context
        }

        if (!env && typeof process !== 'undefined') {
            env = process.env;
        }
        const body = await request.json();

        // 필수 필드 검증
        if (!body.email || !body.password) {
            return errorResponse('이메일과 비밀번호를 입력해주세요', 400);
        }

        if (!env.DB) {
            return errorResponse('데이터베이스를 사용할 수 없습니다', 503);
        }

        // 사용자 조회
        const user = await env.DB
            .prepare('SELECT * FROM users WHERE email = ?')
            .bind(body.email)
            .first() as any;

        if (!user) {
            return errorResponse('이메일 또는 비밀번호가 올바르지 않습니다', 401);
        }

        // 비밀번호 검증
        const isPasswordValid = await verifyPassword(body.password, user.password_hash);

        if (!isPasswordValid) {
            return errorResponse('이메일 또는 비밀번호가 올바르지 않습니다', 401);
        }

        // 토큰 생성
        const token = await generateToken(user.id, user.email);

        return successResponse(
            {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    phone: user.phone,
                },
                token,
            },
            '로그인 성공'
        );
    } catch (error: any) {
        console.error('POST /api/auth/login error:', error);
        return errorResponse(error.message || '로그인 실패', 500);
    }
}
