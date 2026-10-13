// API 유틸리티 함수들
import { getCloudflareContext } from '@opennextjs/cloudflare';

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
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Seoul',
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());
    const year = parts.find((p) => p.type === 'year')?.value ?? '00';
    const month = parts.find((p) => p.type === 'month')?.value ?? '01';
    const day = parts.find((p) => p.type === 'day')?.value ?? '01';
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `WOW${year}${month}${day}${random}`;
}

/** Cloudflare Workers의 PBKDF2 반복 횟수 상한 */
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_PREFIX = 'pbkdf2';

function bytesToBase64Url(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(segment: string): Uint8Array {
    let b64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4;
    if (pad) b64 += '='.repeat(4 - pad);
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

/** 길이가 같으면 내용과 무관하게 같은 시간이 걸리는 비교 */
function timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}

async function sha256Hex(text: string): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
        key,
        256
    );
    return new Uint8Array(bits);
}

/**
 * 비밀번호 해시 생성 — PBKDF2-SHA256 + 회원별 무작위 솔트
 * 저장 형식: pbkdf2$<반복 횟수>$<솔트>$<해시>
 */
export async function hashPassword(password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
    return `${PBKDF2_PREFIX}$${PBKDF2_ITERATIONS}$${bytesToBase64Url(salt)}$${bytesToBase64Url(hash)}`;
}

/** 구 형식(솔트 없는 SHA-256)이라 로그인 성공 시 새 형식으로 다시 저장해야 하는지 */
export function passwordNeedsRehash(stored: string): boolean {
    return !stored.startsWith(`${PBKDF2_PREFIX}$`);
}

/**
 * 비밀번호 검증 — PBKDF2 형식과 구 SHA-256 형식 모두 지원
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
    if (!stored) return false;
    if (stored.startsWith(`${PBKDF2_PREFIX}$`)) {
        const [, iterRaw, saltRaw, hashRaw] = stored.split('$');
        const iterations = Number(iterRaw);
        if (!saltRaw || !hashRaw || !Number.isInteger(iterations) || iterations < 1) return false;
        const hash = await pbkdf2(password, base64UrlToBytes(saltRaw), iterations);
        return timingSafeEqual(bytesToBase64Url(hash), hashRaw);
    }
    return timingSafeEqual(await sha256Hex(password), stored);
}

/**
 * 토큰 서명 비밀키 (Workers secret JWT_SECRET)
 * - 운영에서 없으면 null → 토큰 발급·검증 모두 거부
 * - 로컬 개발(next dev)에서만 고정 개발용 키 사용
 */
function getJwtSecret(): string | null {
    let secret: string | undefined;
    try {
        const env = getCloudflareContext().env as unknown as Record<string, unknown>;
        if (typeof env.JWT_SECRET === 'string') secret = env.JWT_SECRET;
    } catch {
        /* Cloudflare 컨텍스트 밖(스크립트 등) */
    }
    secret = secret || process.env.JWT_SECRET;
    if (secret && secret.length >= 32) return secret;
    if (process.env.NODE_ENV !== 'production') return 'wow3d-local-dev-only-jwt-secret-not-for-production';
    console.error('JWT_SECRET이 설정되지 않았거나 32자 미만입니다');
    return null;
}

async function signJwt(data: string, secret: string): Promise<string> {
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
    return bytesToBase64Url(new Uint8Array(sig));
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
 * JWT 토큰 생성 (HS256 — JWT_SECRET으로 HMAC 서명)
 */
export async function generateToken(userId: number, email: string): Promise<string> {
    const secret = getJwtSecret();
    if (!secret) throw new Error('JWT_SECRET 미설정');
    const header = jsonToBase64Url({ alg: 'HS256', typ: 'JWT' });
    const payload = jsonToBase64Url({
        userId,
        email,
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7일
    });
    const signature = await signJwt(`${header}.${payload}`, secret);
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

        const secret = getJwtSecret();
        if (!secret) return { error: 'server_misconfigured' };
        const expectedSignature = await signJwt(`${header}.${payload}`, secret);

        if (!timingSafeEqual(signature, expectedSignature)) {
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
