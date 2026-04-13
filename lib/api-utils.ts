// API 유틸리티 함수들

/**
 * JSON 응답 생성
 */
export function jsonResponse(data: any, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

/**
 * 에러 응답 생성
 */
export function errorResponse(message: string, status = 400) {
    return jsonResponse({ error: message }, status);
}

/**
 * 성공 응답 생성
 */
export function successResponse(data: any, message?: string) {
    return jsonResponse({
        success: true,
        data,
        ...(message && { message }),
    });
}

/**
 * 세션 ID 생성 (비회원용)
 */
export function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * 주문 번호 생성
 */
export function generateOrderNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `WOW${year}${month}${day}${random}`;
}

/**
 * 비밀번호 해시 생성 (간단한 구현 - 프로덕션에서는 bcrypt 사용 권장)
 */
export async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 비밀번호 검증
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await hashPassword(password);
    return passwordHash === hash;
}

/** UTF-8 JSON → Base64URL (이메일 등 유니코드 안전, URL 쿼리와도 호환) */
function jsonToBase64Url(obj: unknown): string {
    const json = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(json);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
    const b64 = btoa(binary);
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Base64 또는 Base64URL 조각 → UTF-8 문자열 */
function base64UrlToUtf8(segment: string): string {
    let b64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4;
    if (pad) b64 += '='.repeat(4 - pad);
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
}

/**
 * JWT 토큰 생성 (간단한 구현)
 */
export async function generateToken(userId: number, email: string): Promise<string> {
    const header = jsonToBase64Url({ alg: 'HS256', typ: 'JWT' });
    const payload = jsonToBase64Url({
        userId,
        email,
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7일
    });
    const signature = await hashPassword(`${header}.${payload}`);
    return `${header}.${payload}.${signature}`;
}

/**
 * JWT 토큰 검증
 */
export async function verifyToken(token: string): Promise<{ userId: number; email: string } | { error: string } | null> {
    try {
        const trimmed = token.trim();
        const [header, payload, signature] = trimmed.split('.');
        if (!header || !payload || !signature) return null;

        const expectedSignature = await hashPassword(`${header}.${payload}`);

        if (signature !== expectedSignature) {
            console.error('verifyToken: Signature mismatch');
            return { error: 'signature_mismatch' };
        }

        const decodedPayload = JSON.parse(base64UrlToUtf8(payload)) as {
            userId?: number;
            email?: string;
            exp?: number;
        };

        if (typeof decodedPayload.exp !== 'number' || decodedPayload.exp < Date.now()) {
            console.error('verifyToken: Token expired', { exp: decodedPayload.exp, now: Date.now() });
            return { error: 'token_expired' };
        }

        const userId = decodedPayload.userId;
        const email = decodedPayload.email;
        if (userId === undefined || typeof email !== 'string') {
            console.error('verifyToken: Invalid payload structure');
            return { error: 'invalid_payload' };
        }

        return { userId: Number(userId), email };
    } catch (e) {
        console.error('verifyToken: Unexpected error', e);
        return { error: 'unexpected_error' };
    }
}

/**
 * Authorization 헤더에서 토큰 추출
 */
export function extractToken(request: Request): string | null {
    const authHeader = request.headers.get('Authorization')?.trim();
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
        return null;
    }
    const raw = authHeader.slice(7).trim();
    return raw || null;
}

/**
 * 인증 미들웨어 (회원 전용)
 */
export async function requireAuth(request: Request): Promise<{ userId: number; email: string } | Response> {
    const token = extractToken(request);

    if (!token) {
        return errorResponse('인증이 필요합니다', 401);
    }

    const user = await verifyToken(token);

    if (user && 'error' in user) {
        return jsonResponse({ error: '유효하지 않은 토큰입니다', reason: user.error }, 401);
    }

    if (!user) {
        return errorResponse('유효하지 않은 토큰입니다', 401);
    }

    return user as { userId: number; email: string };
}

/**
 * 회원 또는 비회원(세션) 인증
 * - Authorization Bearer 있으면: { userId, email, isGuest: false }
 * - X-Session-ID만 있으면: { sessionId, isGuest: true }
 */
export async function requireAuthOrGuest(request: Request): Promise<
    | { userId: number; email: string; isGuest: false }
    | { sessionId: string; isGuest: true }
    | Response
> {
    const token = extractToken(request);
    if (token) {
        const user = await verifyToken(token);
        if (user && !('error' in user)) return { userId: user.userId, email: user.email, isGuest: false };
        return jsonResponse({ 
            error: '유효하지 않은 토큰입니다', 
            reason: user && 'error' in user ? user.error : 'unknown' 
        }, 401);
    }
    const sessionId = request.headers.get('X-Session-ID');
    if (sessionId && sessionId.trim()) {
        return { sessionId: sessionId.trim(), isGuest: true };
    }
    return errorResponse('인증이 필요합니다. 로그인하거나 비회원 주문 시 브라우저 세션(X-Session-ID)이 필요합니다.', 401);
}

/**
 * 관리자 인증 + Store ID 반환 (Multi-Tenant 격리용)
 * DB에서 사용자의 store_id와 role을 조회하여 반환합니다.
 */
export async function requireAdminAuth(
    request: Request,
    db: any // D1Database (타입 추론 간소화)
): Promise<{ userId: number; email: string; storeId: number; role: string } | Response> {
    const token = extractToken(request);
    if (!token) {
        return errorResponse('인증이 필요합니다', 401);
    }

    const user = await verifyToken(token);
    if (user && 'error' in user) {
        return jsonResponse({ error: '유효하지 않은 토큰입니다', reason: user.error }, 401);
    }
    if (!user) {
        return errorResponse('유효하지 않은 토큰입니다', 401);
    }
    const verifiedUser = user as { userId: number; email: string };

    try {
        let userInfo: { role?: string; store_id?: number } | null = null;
        try {
            userInfo = await db.prepare('SELECT role, store_id FROM users WHERE id = ?')
                .bind(verifiedUser.userId)
                .first() as { role?: string; store_id?: number } | null;
        } catch {
            userInfo = await db.prepare('SELECT role FROM users WHERE id = ?')
                .bind(verifiedUser.userId)
                .first() as { role?: string; store_id?: number } | null;
        }
        if (!userInfo) {
            console.error(`requireAdminAuth: User not found in DB (ID: ${user.userId})`);
            return errorResponse('사용자 정보를 찾을 수 없습니다', 403);
        }
        if (userInfo.role !== 'admin' && userInfo.role !== 'super_admin') {
            console.error(`requireAdminAuth: Insufficient role (ID: ${user.userId}, Role: ${userInfo.role})`);
            return errorResponse('관리자 권한이 필요합니다', 403);
        }
        return {
            userId: verifiedUser.userId,
            email: verifiedUser.email,
            storeId: userInfo.store_id ?? 1,
            role: userInfo.role ?? 'user'
        };
    } catch (e) {
        console.error('requireAdminAuth DB error:', e);
        return errorResponse('인증 처리 중 오류가 발생했습니다', 500);
    }
}
