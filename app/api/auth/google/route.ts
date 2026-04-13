import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const SCOPES = ['openid', 'email', 'profile'].join(' ');

/**
 * GET /api/auth/google - Google OAuth 로그인 시작 (구글 로그인 페이지로 리다이렉트)
 * 쿼리: return (선택) - 로그인 후 돌아갈 URL
 */
export async function GET(request: NextRequest) {
    const envVars = (getCloudflareContext().env || {}) as unknown as Record<string, string | undefined>;
    const clientId = process.env.GOOGLE_CLIENT_ID || envVars.GOOGLE_CLIENT_ID;
    if (!clientId) {
        return new Response(
            JSON.stringify({ error: 'Google 로그인이 설정되지 않았습니다. (GOOGLE_CLIENT_ID)' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const url = new URL(request.url);
    const returnTo = url.searchParams.get('return') || '';
    
    // REDIRECT_URI 결정 로직: 
    // 1. 환경 변수에 설정된 명시적 URI (가장 확실함)
    // 2. 요청 헤더 기반의 동적 URI
    let redirectUri = envVars.GOOGLE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI;
    
    if (!redirectUri) {
        const host = request.headers.get('host') || url.host;
        const proto = request.headers.get('x-forwarded-proto') || (url.protocol.replace(':', '')) || 'https';
        redirectUri = `${proto}://${host}/api/auth/google/callback`;
    }

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: SCOPES,
        access_type: 'offline',
        prompt: 'consent',
    });
    if (returnTo) params.set('state', returnTo);

    const redirectUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;
    return new Response(null, { status: 302, headers: { Location: redirectUrl } });
}
