import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

const KAKAO_AUTH_URL = 'https://kauth.kakao.com/oauth/authorize';

/** 카카오 로그인 동의 항목 (이메일·닉네임) */
const KAKAO_SCOPE = ['profile_nickname', 'account_email'].join(',');

/**
 * GET /api/auth/kakao - Kakao OAuth 로그인 시작
 * 쿼리: return (선택) - 로그인 후 돌아갈 URL
 */
export async function GET(request: NextRequest) {
    const cfEnv = (getCloudflareContext().env || {}) as unknown as Record<string, string | undefined>;
    const clientId = (cfEnv.KAKAO_REST_API_KEY || process.env.KAKAO_REST_API_KEY || '').trim();
    if (!clientId) {
        return new Response(
            JSON.stringify({ error: '카카오 로그인이 설정되지 않았습니다. (KAKAO_REST_API_KEY)' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const url = new URL(request.url);
    const returnTo = url.searchParams.get('return') || '';

    let redirectUri = cfEnv.KAKAO_REDIRECT_URI || process.env.KAKAO_REDIRECT_URI;
    if (!redirectUri) {
        const host = request.headers.get('host') || url.host;
        const proto = request.headers.get('x-forwarded-proto') || url.protocol.replace(':', '') || 'https';
        redirectUri = `${proto}://${host}/api/auth/kakao/callback`;
    }

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: KAKAO_SCOPE,
    });
    if (returnTo) params.set('state', returnTo);

    const redirectUrl = `${KAKAO_AUTH_URL}?${params.toString()}`;
    return new Response(null, { status: 302, headers: { Location: redirectUrl } });
}
