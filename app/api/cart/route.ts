import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { Env } from '@/env';
import {
    errorResponse,
    successResponse,
    generateSessionId,
    extractToken,
    verifyToken,
} from '@/lib/api-utils';

async function resolveCartOwner(request: NextRequest): Promise<{
    userId: number | null;
    sessionId: string | null;
}> {
    const token = extractToken(request);
    if (token) {
        const user = await verifyToken(token);
        if (user && !('error' in user)) {
            return {
                userId: user.userId,
                sessionId: request.headers.get('X-Session-ID')?.trim() || null,
            };
        }
    }

    const headerUserId = request.headers.get('X-User-ID');
    const parsed = headerUserId ? parseInt(headerUserId, 10) : NaN;
    const sessionId = request.headers.get('X-Session-ID')?.trim() || null;

    return {
        userId: Number.isInteger(parsed) && parsed > 0 ? parsed : null,
        sessionId,
    };
}

/**
 * GET /api/cart - 장바구니 조회
 */
export async function GET(request: NextRequest) {
    try {
        let env: { DB?: Env['DB'] } | undefined;
        try {
            env = getCloudflareContext().env;
        } catch {
            env = undefined;
        }

        const { userId, sessionId } = await resolveCartOwner(request);

        if (!sessionId && !userId) {
            return successResponse([], '인증 정보 없음');
        }

        if (!env?.DB) {
            return successResponse([]);
        }

        let result;
        if (userId && sessionId) {
            result = await env.DB.prepare(
                `SELECT c.*, q.*
                 FROM cart c
                 JOIN quotes q ON c.quote_id = q.id
                 WHERE c.user_id = ? OR c.session_id = ?
                 ORDER BY c.created_at DESC`
            )
                .bind(userId, sessionId)
                .all();
        } else if (userId) {
            result = await env.DB.prepare(
                `SELECT c.*, q.*
                 FROM cart c
                 JOIN quotes q ON c.quote_id = q.id
                 WHERE c.user_id = ?
                 ORDER BY c.created_at DESC`
            )
                .bind(userId)
                .all();
        } else {
            result = await env.DB.prepare(
                `SELECT c.*, q.*
                 FROM cart c
                 JOIN quotes q ON c.quote_id = q.id
                 WHERE c.session_id = ?
                 ORDER BY c.created_at DESC`
            )
                .bind(sessionId)
                .all();
        }

        return successResponse(result.results || []);
    } catch (error: any) {
        console.error('GET /api/cart error:', error);
        return errorResponse(error.message || '장바구니 조회 실패', 500);
    }
}

/**
 * POST /api/cart - 장바구니에 추가
 */
export async function POST(request: NextRequest) {
    try {
        let env: { DB?: Env['DB'] } | undefined;
        try {
            env = getCloudflareContext().env;
        } catch {
            env = undefined;
        }

        const body = await request.json();

        if (!body.quoteId) {
            return errorResponse('견적 ID가 필요합니다', 400);
        }

        let { userId, sessionId } = await resolveCartOwner(request);

        if (!sessionId && !userId) {
            sessionId = generateSessionId();
        }

        if (!env?.DB) {
            return successResponse(
                { id: Math.floor(Math.random() * 10000), sessionId },
                '장바구니에 추가되었습니다 (개발 모드)'
            );
        }

        const quoteId = Number(body.quoteId);

        // 회원: user cart 또는 동일 세션 cart 조회 후 승계
        let existingItem: Record<string, unknown> | null = null;
        if (userId && sessionId) {
            existingItem = await env.DB.prepare(
                `SELECT * FROM cart
                 WHERE quote_id = ? AND (user_id = ? OR session_id = ?)
                 ORDER BY CASE WHEN user_id = ? THEN 0 ELSE 1 END
                 LIMIT 1`
            )
                .bind(quoteId, userId, sessionId, userId)
                .first();
        } else if (userId) {
            existingItem = await env.DB.prepare(
                `SELECT * FROM cart WHERE quote_id = ? AND user_id = ?`
            )
                .bind(quoteId, userId)
                .first();
        } else {
            existingItem = await env.DB.prepare(
                `SELECT * FROM cart WHERE quote_id = ? AND session_id = ?`
            )
                .bind(quoteId, sessionId)
                .first();
        }

        // 같은 파일명의 다른 견적(FDM↔SLA 전환으로 ID가 갈라진 경우)은 장바구니에서 제거
        try {
            if (userId && sessionId) {
                await env.DB.prepare(
                    `DELETE FROM cart
                     WHERE (user_id = ? OR session_id = ?)
                       AND quote_id != ?
                       AND quote_id IN (
                         SELECT q.id FROM quotes q
                         WHERE q.file_name = (SELECT file_name FROM quotes WHERE id = ?)
                       )`
                )
                    .bind(userId, sessionId, quoteId, quoteId)
                    .run();
            } else {
                const ownerClause = userId ? 'user_id = ?' : 'session_id = ?';
                const ownerVal = userId ?? sessionId;
                await env.DB.prepare(
                    `DELETE FROM cart
                     WHERE ${ownerClause}
                       AND quote_id != ?
                       AND quote_id IN (
                         SELECT q.id FROM quotes q
                         WHERE q.file_name = (SELECT file_name FROM quotes WHERE id = ?)
                       )`
                )
                    .bind(ownerVal, quoteId, quoteId)
                    .run();
            }
        } catch (e) {
            console.warn('[cart] same-file dedupe skipped', e);
        }

        if (existingItem) {
            const updateOnly = body.updateOnly === true;
            const cartId = (existingItem as { id: number }).id;

            // 세션 cart → 회원 cart 승계
            if (userId && (existingItem as { user_id?: number | null }).user_id == null) {
                await env.DB.prepare(`UPDATE cart SET user_id = ? WHERE id = ?`)
                    .bind(userId, cartId)
                    .run();
            }

            if (updateOnly) {
                return successResponse({ id: cartId }, '장바구니 견적 정보가 갱신되었습니다');
            }

            await env.DB.prepare('UPDATE cart SET quantity = quantity + ? WHERE id = ?')
                .bind(body.quantity || 1, cartId)
                .run();

            return successResponse({ id: cartId }, '수량이 업데이트되었습니다');
        }

        const result = await env.DB.prepare(
            `INSERT INTO cart (user_id, session_id, quote_id, quantity)
             VALUES (?, ?, ?, ?)`
        )
            .bind(userId, sessionId, quoteId, body.quantity || 1)
            .run();

        return successResponse(
            {
                id: result.meta.last_row_id,
                sessionId: sessionId || undefined,
            },
            '장바구니에 추가되었습니다'
        );
    } catch (error: any) {
        console.error('POST /api/cart error:', error);
        return errorResponse(error.message || '장바구니 추가 실패', 500);
    }
}

/**
 * DELETE /api/cart - 장바구니 비우기
 */
export async function DELETE(request: NextRequest) {
    try {
        const { env } = getCloudflareContext();
        const { userId, sessionId } = await resolveCartOwner(request);

        if (!sessionId && !userId) {
            return errorResponse('세션 ID 또는 사용자 ID가 필요합니다', 400);
        }

        if (!env?.DB) {
            return successResponse(null, '장바구니가 비워졌습니다');
        }

        if (userId && sessionId) {
            await env.DB.prepare(`DELETE FROM cart WHERE user_id = ? OR session_id = ?`)
                .bind(userId, sessionId)
                .run();
        } else if (userId) {
            await env.DB.prepare('DELETE FROM cart WHERE user_id = ?').bind(userId).run();
        } else {
            await env.DB.prepare('DELETE FROM cart WHERE session_id = ?').bind(sessionId).run();
        }

        return successResponse(null, '장바구니가 비워졌습니다');
    } catch (error: any) {
        console.error('DELETE /api/cart error:', error);
        return errorResponse(error.message || '장바구니 삭제 실패', 500);
    }
}
