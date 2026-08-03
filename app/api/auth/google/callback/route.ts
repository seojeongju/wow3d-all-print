import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { Env } from '@/env';
import { generateToken } from '@/lib/api-utils';
import { getOAuthRedirectUri } from '@/lib/site-url';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
const GOOGLE_CALLBACK_PATH = '/api/auth/google/callback';

type GoogleUserInfo = { id: string; email: string; name?: string; picture?: string };

/**
 * GET /api/auth/google/callback - Google OAuth 콜백 (code 교환 → 사용자 조회/생성 → 토큰 발급 → 프론트 리다이렉트)
 */
export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state') || ''; // return URL
    const error = url.searchParams.get('error');

    const origin = url.origin;
    const authPage = `${origin}/auth`;
    const failRedirect = `${authPage}?error=google_cancel`;

    if (error) {
        return new Response(null, { status: 302, headers: { Location: failRedirect } });
    }
    if (!code) {
        return new Response(null, { status: 302, headers: { Location: failRedirect } });
    }

    let env: { DB?: Env['DB'] } | undefined;
    try {
        env = getCloudflareContext().env;
    } catch {
        env = undefined;
    }
    if (!env?.DB) {
        return new Response(null, { status: 302, headers: { Location: `${authPage}?error=server` } });
    }

    const envVars = (getCloudflareContext().env || {}) as unknown as Record<string, string | undefined>;
    const clientId = process.env.GOOGLE_CLIENT_ID || envVars.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || envVars.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        return new Response(null, { status: 302, headers: { Location: `${authPage}?error=config` } });
    }

    // 시작 API(/api/auth/google)와 동일한 대표 URL — Host 헤더에 의존하지 않음
    const redirectUri = getOAuthRedirectUri(
        GOOGLE_CALLBACK_PATH,
        envVars.GOOGLE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI
    );

    // 1) code → access_token
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
        }).toString(),
    });

    if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.error('Google token exchange failed', tokenRes.status, errText);
        return new Response(null, { status: 302, headers: { Location: failRedirect } });
    }

    const tokenData = (await tokenRes.json()) as { access_token?: string };
    const accessToken = tokenData.access_token;
    if (!accessToken) {
        return new Response(null, { status: 302, headers: { Location: failRedirect } });
    }

    // 2) access_token → user info
    const userRes = await fetch(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userRes.ok) {
        return new Response(null, { status: 302, headers: { Location: failRedirect } });
    }
    const googleUser = (await userRes.json()) as GoogleUserInfo;
    const { id: googleId, email, name: googleName } = googleUser;
    if (!email) {
        return new Response(null, { status: 302, headers: { Location: failRedirect } });
    }

    const name = (googleName || email.split('@')[0] || '사용자').trim();

    // 3) DB: google_id로 기존 사용자 찾기, 없으면 email로 찾기, 없으면 신규 생성
    type UserRow = { id: number; email: string; name: string; role?: string; store_id?: number };
    let userRow: UserRow | null = null;

    try {
        userRow = await env.DB.prepare('SELECT id, email, name, role, store_id FROM users WHERE google_id = ?')
            .bind(googleId)
            .first() as UserRow | null;

        if (!userRow) {
            const existingByEmail = await env.DB.prepare('SELECT id, email, name, role, store_id FROM users WHERE email = ?')
                .bind(email)
                .first() as UserRow | null;

            if (existingByEmail) {
                userRow = existingByEmail;
                // 기존 이메일 가입자에게 google_id 연결
                await env.DB.prepare('UPDATE users SET google_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                    .bind(googleId, existingByEmail.id)
                    .run();
            } else {
                // 신규: Google 전용 회원 생성 (password_hash는 빈 문자열)
                const insertResult = await env.DB.prepare(
                    `INSERT INTO users (email, password_hash, name, google_id, phone) VALUES (?, ?, ?, ?, NULL)`
                )
                    .bind(email, '', name, googleId)
                    .run();
                const newId = insertResult.meta.last_row_id;
                if (!newId) {
                    return new Response(null, { status: 302, headers: { Location: `${authPage}?error=signup` } });
                }
                userRow = {
                    id: Number(newId),
                    email,
                    name,
                    role: 'user',
                    store_id: 1,
                };
            }
        }
    } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        console.error('Google callback DB error', err.message, err.stack);
        return new Response(null, { status: 302, headers: { Location: `${authPage}?error=db` } });
    }

    if (!userRow) {
        return new Response(null, { status: 302, headers: { Location: `${authPage}?error=server` } });
    }

    const userId = userRow.id;
    let token: string;
    try {
        token = await generateToken(userId, userRow.email);
    } catch {
        return new Response(null, { status: 302, headers: { Location: `${authPage}?error=server` } });
    }

    // 4) 프론트로 리다이렉트 (token 전달)
    const returnTo = state ? decodeURIComponent(state) : '/';
    const target = `${authPage}?google=1&token=${encodeURIComponent(token)}&return=${encodeURIComponent(returnTo)}`;
    return new Response(null, { status: 302, headers: { Location: target } });
}
