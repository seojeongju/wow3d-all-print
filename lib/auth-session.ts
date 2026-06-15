export type AuthValidationResult = {
    ok: boolean;
    reason?: 'token_expired' | 'invalid_token' | 'network_error';
};

function decodeJwtPayload(token: string): { exp?: number } | null {
    try {
        const parts = token.trim().split('.');
        if (parts.length !== 3) return null;
        const payload = parts[1];
        if (!payload) return null;
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        const json = atob(padded);
        return JSON.parse(json) as { exp?: number };
    } catch {
        return null;
    }
}

/** 클라이언트에서 JWT 만료 여부 빠르게 확인 (exp 클레임) */
export function isTokenExpired(token: string | null | undefined): boolean {
    if (!token?.trim()) return true;
    const payload = decodeJwtPayload(token);
    if (!payload || typeof payload.exp !== 'number') return true;
    return payload.exp < Date.now();
}

/** 서버 `/api/auth/me`로 JWT 유효성 확인 */
export async function validateAuthToken(token: string | null | undefined): Promise<AuthValidationResult> {
    if (!token?.trim()) return { ok: false, reason: 'invalid_token' };
    if (isTokenExpired(token)) return { ok: false, reason: 'token_expired' };

    try {
        const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
        });
        if (res.ok) return { ok: true };

        const data = await res.json().catch(() => ({}));
        const reason = data?.reason === 'token_expired' ? 'token_expired' : 'invalid_token';
        return { ok: false, reason };
    } catch {
        return { ok: false, reason: 'network_error' };
    }
}

export function isAuthTokenError(status: number, errorBody?: { error?: string; reason?: string }): boolean {
    if (status !== 401) return false;
    if (errorBody?.error === '유효하지 않은 토큰입니다') return true;
    return Boolean(errorBody?.reason);
}
