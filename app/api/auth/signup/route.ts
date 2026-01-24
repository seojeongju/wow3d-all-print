import { NextRequest } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import type { Env } from '@/env';
import { errorResponse, successResponse, hashPassword, generateToken } from '@/lib/api-utils';

export const runtime = 'edge';

/**
 * POST /api/auth/signup - 회원가입
 */
export async function POST(request: NextRequest) {
    try {
        let env: any;
        try {
            const ctx = getRequestContext();
            if (ctx && (ctx as any).env) {
                env = (ctx as any).env;
            }
        } catch (e) { }
        if (!env && typeof process !== 'undefined') {
            env = process.env;
        }
        const body = await request.json();

        // 필수 필드 검증
        if (!body.email || !body.password || !body.name) {
            return errorResponse('이메일, 비밀번호, 이름은 필수입니다', 400);
        }

        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.email)) {
            return errorResponse('유효한 이메일 주소를 입력해주세요', 400);
        }

        // 비밀번호 강도 검증 (최소 8자)
        if (body.password.length < 8) {
            return errorResponse('비밀번호는 최소 8자 이상이어야 합니다', 400);
        }

        if (!env.DB) {
            return errorResponse('데이터베이스를 사용할 수 없습니다', 503);
        }

        // 이메일 중복 확인
        const existingUser = await env.DB
            .prepare('SELECT id FROM users WHERE email = ?')
            .bind(body.email)
            .first();

        if (existingUser) {
            return errorResponse('이미 사용 중인 이메일입니다', 409);
        }

        // 비밀번호 해시
        const passwordHash = await hashPassword(body.password);

        // 사용자 생성
        const result = await env.DB
            .prepare(`
        INSERT INTO users (email, password_hash, name, phone)
        VALUES (?, ?, ?, ?)
      `)
            .bind(body.email, passwordHash, body.name, body.phone || null)
            .run();

        const userId = result.meta.last_row_id;

        if (!userId) {
            return errorResponse('사용자 생성 실패', 500);
        }

        // 토큰 생성
        const token = await generateToken(userId, body.email);

        return successResponse(
            {
                user: {
                    id: userId,
                    email: body.email,
                    name: body.name,
                    phone: body.phone,
                },
                token,
            },
            '회원가입이 완료되었습니다'
        );
    } catch (error: any) {
        console.error('POST /api/auth/signup error:', error);
        return errorResponse(error.message || '회원가입 실패', 500);
    }
}
