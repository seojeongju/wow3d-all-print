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

/**
 * JWT 토큰 생성 (간단한 구현)
 */
export async function generateToken(userId: number, email: string): Promise<string> {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
        userId,
        email,
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7일
    }));
    const signature = await hashPassword(`${header}.${payload}`);
    return `${header}.${payload}.${signature}`;
}

/**
 * JWT 토큰 검증
 */
export async function verifyToken(token: string): Promise<{ userId: number; email: string } | null> {
    try {
        const [header, payload, signature] = token.split('.');
        const expectedSignature = await hashPassword(`${header}.${payload}`);

        if (signature !== expectedSignature) {
            return null;
        }

        const decodedPayload = JSON.parse(atob(payload));

        if (decodedPayload.exp < Date.now()) {
            return null;
        }

        return {
            userId: decodedPayload.userId,
            email: decodedPayload.email,
        };
    } catch {
        return null;
    }
}

/**
 * Authorization 헤더에서 토큰 추출
 */
export function extractToken(request: Request): string | null {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
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

    if (!user) {
        return errorResponse('유효하지 않은 토큰입니다', 401);
    }

    return user;
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
        if (user) return { userId: user.userId, email: user.email, isGuest: false };
        return errorResponse('유효하지 않은 토큰입니다', 401);
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
    if (!user) {
        return errorResponse('유효하지 않은 토큰입니다', 401);
    }

    // DB에서 사용자 정보 조회 (store_id, role)
    try {
        const userInfo = await db.prepare('SELECT role, store_id FROM users WHERE id = ?')
            .bind(user.userId)
            .first() as { role?: string; store_id?: number } | null;

        if (!userInfo) {
            return errorResponse('사용자 정보를 찾을 수 없습니다', 403);
        }

        // 관리자 권한 체크 (선택: admin 또는 super_admin만 허용)
        if (userInfo.role !== 'admin' && userInfo.role !== 'super_admin') {
            return errorResponse('관리자 권한이 필요합니다', 403);
        }

        return {
            userId: user.userId,
            email: user.email,
            storeId: userInfo.store_id ?? 1, // 기본값 1 (마이그레이션 안 된 경우 대비)
            role: userInfo.role ?? 'user'
        };
    } catch (e) {
        console.error('requireAdminAuth DB error:', e);
        return errorResponse('인증 처리 중 오류가 발생했습니다', 500);
    }
}
