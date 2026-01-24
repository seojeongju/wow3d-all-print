import { NextRequest } from 'next/server';
import type { Env } from '@/env';
import { errorResponse, successResponse, verifyPassword, generateToken } from '@/lib/api-utils';

export const runtime = 'edge';

function safeJson500(msg: string): Response {
    try {
        return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch {
        return new Response('{"error":"서버 오류"}', { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}

/**
 * POST /api/auth/login - 로그인
 * @cloudflare/next-on-pages는 POST에서만 동적 import (모듈 로드 시 500 방지)
 */
export async function POST(request: NextRequest) {
    try {
        let ctx: { env?: { DB?: Env['DB'] } } | undefined;
        try {
            const { getOptionalRequestContext } = await import('@cloudflare/next-on-pages');
            ctx = getOptionalRequestContext() as { env?: { DB?: Env['DB'] } } | undefined;
        } catch (_e) {
            ctx = undefined;
        }
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

        let raw: Record<string, unknown> | null;
        try {
            raw = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
                .bind((body.email || '').trim())
                .first() as Record<string, unknown> | null;
        } catch (e) {
            try { console.error('login D1 error', e); } catch { }
            return safeJson500('데이터베이스 조회 중 오류가 발생했습니다.');
        }

        const passwordHash = (raw?.password_hash ?? raw?.passwordHash) as string | undefined;
        if (!raw || !passwordHash) {
            return errorResponse('이메일 또는 비밀번호가 올바르지 않습니다', 401);
        }

        let isPasswordValid: boolean;
        try {
            isPasswordValid = await verifyPassword(body.password, passwordHash);
        } catch (e) {
            try { console.error('login verifyPassword error', e); } catch { }
            return safeJson500('비밀번호 확인 중 오류가 발생했습니다.');
        }
        if (!isPasswordValid) {
            return errorResponse('이메일 또는 비밀번호가 올바르지 않습니다', 401);
        }

        const userId = Number(raw.id ?? raw.ID);
        const email = String(raw.email ?? '');
        let token: string;
        try {
            token = await generateToken(userId, email);
        } catch (e) {
            try { console.error('login generateToken error', e); } catch { }
            return safeJson500('토큰 생성 중 오류가 발생했습니다.');
        }

        try {
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
        } catch (_) {
            return safeJson500('응답 생성 중 오류가 발생했습니다.');
        }
    } catch (_e) {
        try { console.error('POST /api/auth/login'); } catch { }
        return safeJson500('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    }
}

/** GET /api/auth/login - 디버깅: 라우트/런타임 확인용 */
export async function GET() {
    return new Response(JSON.stringify({ ok: true, route: 'login' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}
