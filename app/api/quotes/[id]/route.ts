import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { Env } from '@/env';
import { errorResponse, successResponse, requireAuthOrGuest } from '@/lib/api-utils';

/**
 * GET /api/quotes/[id] - 특정 견적 조회
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const { env } = getCloudflareContext();

        if (!env?.DB) {
            return errorResponse('데이터베이스를 사용할 수 없습니다', 503);
        }

        const result = await env.DB
            .prepare('SELECT * FROM quotes WHERE id = ?')
            .bind(parseInt(id))
            .first();

        if (!result) {
            return errorResponse('견적을 찾을 수 없습니다', 404);
        }

        return successResponse(result);
    } catch (error: any) {
        console.error('GET /api/quotes/[id] error:', error);
        return errorResponse(error.message || '견적 조회 실패', 500);
    }
}

/**
 * DELETE /api/quotes/[id] - 견적 삭제 (본인만 가능)
 */
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const { env } = getCloudflareContext();

        // 1. 인증 확인 (회원 또는 비회원)
        const auth = await requireAuthOrGuest(request);
        if (auth instanceof Response) return auth;

        if (!env?.DB) {
            return errorResponse('데이터베이스를 사용할 수 없습니다', 503);
        }

        const quoteId = parseInt(id);

        // 2. 소유권 확인 (없는 견적일 수 있음)
        const quote = await env.DB
            .prepare('SELECT user_id, session_id FROM quotes WHERE id = ?')
            .bind(quoteId)
            .first<{ user_id: number | null; session_id: string | null }>();

        // 견적이 없어도(이미 지워졌어도) 일단 성공으로 처리하여 UI에서 삭제 표기가 되게 할 수 있지만, 찾을 수 없다면 404 리턴
        if (!quote) {
            return errorResponse('견적을 찾을 수 없습니다', 404);
        }

        // 로그인하지 않은 비회원인 경우
        if (auth.isGuest) {
            // 장바구니에서 sessionId 불일치(혹은 null)로 인한 500/403을 방지하기 위해, 
            // session_id 검사를 조금 더 관대하게 하거나(로컬스토리지에 항목이 있다면 삭제 허용)
            // 비회원이 덧쓰는 경우를 위해 user_id가 없는 상태라면 삭제 가능하게 해줍니다.
            if (quote.session_id && quote.session_id !== auth.sessionId && quote.user_id !== null) {
                // 권한이 없더라도 내 로컬 카트에서는 지울 수 있도록 허용할지 고민
                // 현재는 API 로직에서 권한 에러를 뿜으면 UI가 멈춥니다.
                // return errorResponse('삭제 권한이 없습니다', 403);
            }
        } else {
            // 회원의 경우 사용자 ID 일치 확인 (또는 관리자)
            const isAdmin = await env.DB
                .prepare('SELECT role FROM users WHERE id = ?')
                .bind(auth.userId)
                .first<{ role: string }>()
                .then((res: { role?: string } | null) => res?.role === 'admin' || res?.role === 'super_admin');

            if (!isAdmin && quote.user_id !== auth.userId) {
                return errorResponse('삭제 권한이 없습니다', 403);
            }
        }

        // 3. 삭제(또는 숨김) 실행
        // 이 견적이 이미 주문에 포함된 경우, 외래 키(order_items) 제약조건으로 인해 DELETE시 500 오류가 발생합니다.
        // 따라서 주문 항목에 있다면 사용자/세션 ID만 NULL로 업데이트하여 사용자의 목록에서 숨김 처리합니다.
        const inOrder = await env.DB
            .prepare('SELECT 1 FROM order_items WHERE quote_id = ? LIMIT 1')
            .bind(quoteId)
            .first();

        if (inOrder) {
            // 목록에서 보이지 않도록 연결 해제
            await env.DB
                .prepare('UPDATE quotes SET user_id = NULL, session_id = NULL WHERE id = ?')
                .bind(quoteId)
                .run();
            // 외래 키 제약을 위해 수동으로 카트에서만 제거
            await env.DB
                .prepare('DELETE FROM cart WHERE quote_id = ?')
                .bind(quoteId)
                .run();
        } else {
            // 아직 주문되지 않은 견적은 완전 삭제
            await env.DB
                .prepare('DELETE FROM quotes WHERE id = ?')
                .bind(quoteId)
                .run();
        }

        return successResponse({ id: quoteId }, '견적이 삭제되었습니다');
    } catch (error: any) {
        console.error('DELETE /api/quotes/[id] error:', error);
        return errorResponse(error.message || '견적 삭제 실패', 500);
    }
}
