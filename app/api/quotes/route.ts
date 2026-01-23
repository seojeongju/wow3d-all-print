import { NextRequest } from 'next/server';
import type { Env } from '@/env';
import { jsonResponse, errorResponse, successResponse, generateSessionId } from '@/lib/api-utils';
import type { QuoteData } from '@/lib/types';

// Edge Runtime 사용 (Cloudflare Pages 호환)
export const runtime = 'edge';

/**
 * GET /api/quotes - 견적 목록 조회
 */
export async function GET(request: NextRequest) {
    try {
        const env = (process.env as any) as Env;

        // 세션 ID 또는 사용자 ID로 필터링
        const sessionId = request.headers.get('X-Session-ID');
        const userId = request.headers.get('X-User-ID');

        if (!sessionId && !userId) {
            return errorResponse('세션 ID 또는 사용자 ID가 필요합니다', 400);
        }

        let query: string;
        let bindings: any[];

        if (userId) {
            query = 'SELECT * FROM quotes WHERE user_id = ? ORDER BY created_at DESC';
            bindings = [parseInt(userId)];
        } else {
            query = 'SELECT * FROM quotes WHERE session_id = ? ORDER BY created_at DESC';
            bindings = [sessionId];
        }

        // D1 Database가 있는 경우에만 실행
        if (env.DB) {
            const result = await env.DB.prepare(query).bind(...bindings).all();
            return successResponse(result.results || []);
        }

        // 로컬 개발 환경에서는 빈 배열 반환
        return successResponse([]);
    } catch (error: any) {
        console.error('GET /api/quotes error:', error);
        return errorResponse(error.message || '견적 조회 실패', 500);
    }
}

/**
 * POST /api/quotes - 견적 저장
 */
export async function POST(request: NextRequest) {
    try {
        const env = (process.env as any) as Env;
        const body = await request.json() as QuoteData;

        // 필수 필드 검증
        if (!body.fileName || !body.volumeCm3 || !body.printMethod || !body.totalPrice) {
            return errorResponse('필수 필드가 누락되었습니다', 400);
        }

        // 세션 ID 또는 사용자 ID
        let sessionId = request.headers.get('X-Session-ID');
        const userId = request.headers.get('X-User-ID');

        // 세션 ID가 없으면 생성
        if (!sessionId && !userId) {
            sessionId = generateSessionId();
        }

        // D1 Database가 있는 경우에만 실행
        if (env.DB) {
            const query = `
        INSERT INTO quotes (
          user_id, session_id, file_name, file_size, file_url,
          volume_cm3, surface_area_cm2, dimensions_x, dimensions_y, dimensions_z,
          print_method,
          fdm_material, fdm_infill, fdm_layer_height, fdm_support,
          resin_type, layer_thickness, post_processing,
          total_price, estimated_time_hours
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

            const result = await env.DB.prepare(query)
                .bind(
                    userId ? parseInt(userId) : null,
                    sessionId,
                    body.fileName,
                    body.fileSize,
                    body.fileUrl || null,
                    body.volumeCm3,
                    body.surfaceAreaCm2,
                    body.dimensionsX,
                    body.dimensionsY,
                    body.dimensionsZ,
                    body.printMethod,
                    body.fdmMaterial || null,
                    body.fdmInfill || null,
                    body.fdmLayerHeight || null,
                    body.fdmSupport ? 1 : 0,
                    body.resinType || null,
                    body.layerThickness || null,
                    body.postProcessing ? 1 : 0,
                    body.totalPrice,
                    body.estimatedTimeHours
                )
                .run();

            return successResponse(
                {
                    id: result.meta.last_row_id,
                    sessionId: sessionId || undefined
                },
                '견적이 저장되었습니다'
            );
        }

        // 로컬 개발 환경
        return successResponse(
            {
                id: Math.floor(Math.random() * 10000),
                sessionId: sessionId || undefined
            },
            '견적이 저장되었습니다 (개발 모드)'
        );
    } catch (error: any) {
        console.error('POST /api/quotes error:', error);
        return errorResponse(error.message || '견적 저장 실패', 500);
    }
}
