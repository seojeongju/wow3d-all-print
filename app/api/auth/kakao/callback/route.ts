import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { Env } from '@/env';
import { generateToken } from '@/lib/api-utils';

const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token';
const KAKAO_USER_ME_URL = 'https://kapi.kakao.com/v2/user/me';

type KakaoUserMe = {
    id: number;
    kakao_account?: {
        email?: string;
        profile?: { nickname?: string };
        has_email?: boolean;
        is_email_valid?: boolean;
    };
};

/**
 * GET /api/auth/kakao/callback - Kakao OAuth 콜백
 */
export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state') || '';
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    const origin = url.origin;
    const authPage = `${origin}/auth`;
    const failRedirect = `${authPage}?error=kakao_cancel`;

    if (error) {
        console.error('Kakao OAuth error', error, errorDescription);
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

    const cfEnv = (getCloudflareContext().env || {}) as unknown as Record<string, string | undefined>;
    const clientId = (cfEnv.KAKAO_REST_API_KEY || process.env.KAKAO_REST_API_KEY || '').trim();
    const clientSecret = (cfEnv.KAKAO_CLIENT_SECRET || process.env.KAKAO_CLIENT_SECRET || '').trim();
    if (!clientId || !clientSecret) {
        return new Response(null, { status: 302, headers: { Location: `${authPage}?error=config` } });
    }

    let redirectUri = cfEnv.KAKAO_REDIRECT_URI || process.env.KAKAO_REDIRECT_URI;
    if (!redirectUri) {
        const host = request.headers.get('host') || url.host;
        const proto = request.headers.get('x-forwarded-proto') || url.protocol.replace(':', '') || 'https';
        redirectUri = `${proto}://${host}/api/auth/kakao/callback`;
    }

    const tokenRes = await fetch(KAKAO_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            code,
        }).toString(),
    });

    if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.error('Kakao token exchange failed', tokenRes.status, errText);
        return new Response(null, { status: 302, headers: { Location: failRedirect } });
    }

    const tokenData = (await tokenRes.json()) as { access_token?: string };
    const accessToken = tokenData.access_token;
    if (!accessToken) {
        return new Response(null, { status: 302, headers: { Location: failRedirect } });
    }

    const userRes = await fetch(KAKAO_USER_ME_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userRes.ok) {
        return new Response(null, { status: 302, headers: { Location: failRedirect } });
    }

    const kakaoUser = (await userRes.json()) as KakaoUserMe;
    const kakaoId = String(kakaoUser.id);
    if (!kakaoId) {
        return new Response(null, { status: 302, headers: { Location: failRedirect } });
    }

    const acc = kakaoUser.kakao_account;
    const emailFromKakao =
        acc?.has_email && acc?.is_email_valid !== false && acc?.email?.trim()
            ? acc.email.trim().toLowerCase()
            : '';
    const email = emailFromKakao || `kakao_${kakaoId}@oauth.placeholder.wow3d`;
    const name = (acc?.profile?.nickname || '카카오 사용자').trim() || '카카오 사용자';

    type UserRow = { id: number; email: string; name: string; role?: string; store_id?: number };
    let userRow: UserRow | null = null;

    try {
        userRow = (await env.DB.prepare('SELECT id, email, name, role, store_id FROM users WHERE kakao_id = ?')
            .bind(kakaoId)
            .first()) as UserRow | null;

        if (!userRow) {
            const existingByEmail = (await env.DB.prepare('SELECT id, email, name, role, store_id FROM users WHERE email = ?')
                .bind(email)
                .first()) as UserRow | null;

            if (existingByEmail) {
                userRow = existingByEmail;
                await env.DB.prepare('UPDATE users SET kakao_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                    .bind(kakaoId, existingByEmail.id)
                    .run();
            } else {
                const insertResult = await env.DB.prepare(
                    `INSERT INTO users (email, password_hash, name, google_id, kakao_id, phone) VALUES (?, ?, ?, NULL, ?, NULL)`
                )
                    .bind(email, '', name, kakaoId)
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
        console.error('Kakao callback DB error', err.message, err.stack);
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

    const returnTo = state ? decodeURIComponent(state) : '/';
    const target = `${authPage}?kakao=1&token=${encodeURIComponent(token)}&return=${encodeURIComponent(returnTo)}`;
    return new Response(null, { status: 302, headers: { Location: target } });
}
