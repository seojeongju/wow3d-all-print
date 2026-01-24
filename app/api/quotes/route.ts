import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { Env } from '@/env';
import { jsonResponse, errorResponse, successResponse, generateSessionId } from '@/lib/api-utils';
import type { QuoteData } from '@/lib/types';

/**
 * GET /api/quotes - 견적 목록 조회
 */
export async function GET(request: NextRequest) {
    try {
        let env: { DB?: Env['DB'] } | undefined;
        try {
            env = getCloudflareContext().env;
        } catch {
            env = undefined;
        }


        // 세션 ID 또는 사용자 ID로 필터링
        const sessionId = request.headers.get('X-Session-ID');
        const userId = request.headers.get('X-User-ID');

        if (!sessionId && !userId) {
            return errorResponse('세션 ID 또는 사용자 ID가 필요합니다', 400);
        }

        let query: string;
        let bindings: any[];

        if (userId) {
            const parsed = parseInt(userId, 10);
            if (Number.isNaN(parsed)) return errorResponse('유효하지 않은 X-User-ID', 400);
            query = 'SELECT * FROM quotes WHERE user_id = ? ORDER BY created_at DESC';
            bindings = [parsed];
        } else {
            query = 'SELECT * FROM quotes WHERE session_id = ? ORDER BY created_at DESC';
            bindings = [sessionId];
        }

        // D1 Database가 있는 경우에만 실행
        if (env && env.DB) {
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

// CHECK 제약용: 부동소수·허용값 보정
const FDM_LAYER = [0.1, 0.2, 0.3] as const;
const SLA_LAYER = [0.025, 0.05, 0.1] as const;
const FDM_MAT = ['PLA', 'ABS', 'PETG', 'TPU'] as const;
const RESIN = ['Standard', 'Tough', 'Clear', 'Flexible'] as const;

function snapFdmLayer(v: unknown): typeof FDM_LAYER[number] | null {
    if (v == null || v === '') return null;
    const n = Math.round(Number(v) * 10) / 10;
    return FDM_LAYER.includes(n as any) ? (n as typeof FDM_LAYER[number]) : null;
}
function snapSlaLayer(v: unknown): typeof SLA_LAYER[number] | null {
    if (v == null || v === '') return null;
    const n = Math.round(Number(v) * 1000) / 1000;
    return SLA_LAYER.includes(n as any) ? (n as typeof SLA_LAYER[number]) : null;
}
function snapFdmMaterial(v: unknown): string | null {
    if (v == null || v === '') return null;
    const s = String(v).toUpperCase();
    return FDM_MAT.includes(s as any) ? s : null;
}
function snapResinType(v: unknown): string | null {
    if (v == null || v === '') return null;
    const s = String(v);
    return RESIN.includes(s as any) ? s : null;
}
function clampFdmInfill(v: unknown): number | null {
    if (v == null || v === '') return null;
    const n = Math.round(Number(v));
    return n >= 10 && n <= 100 ? n : null;
}

/**
 * POST /api/quotes - 견적 저장
 */
export async function POST(request: NextRequest) {
    try {
        let env: { DB?: Env['DB'] } | undefined;
        try {
            env = getCloudflareContext().env;
        } catch {
            env = undefined;
        }

        const body = await request.json() as QuoteData;

        // 필수 필드 검증
        if (!body.fileName || body.volumeCm3 == null || !body.printMethod || body.totalPrice == null) {
            return errorResponse('필수 필드가 누락되었습니다', 400);
        }

        // 세션 ID 또는 사용자 ID
        let sessionId = request.headers.get('X-Session-ID');
        const userId = request.headers.get('X-User-ID');

        // 세션 ID가 없으면 생성
        if (!sessionId && !userId) {
            sessionId = generateSessionId();
        }

        // userId: NaN이면 null
        const uid = userId ? (() => { const p = parseInt(userId, 10); return Number.isNaN(p) ? null : p; })() : null;

        // NOT NULL 및 CHECK 대응: 숫자/정수/허용값 보정
        const fileSize = Math.floor(Number(body.fileSize) || 0);
        const volumeCm3 = Number(body.volumeCm3) || 0;
        const surfaceAreaCm2 = Number(body.surfaceAreaCm2) || 0;
        const dimensionsX = Number(body.dimensionsX) || 0;
        const dimensionsY = Number(body.dimensionsY) || 0;
        const dimensionsZ = Number(body.dimensionsZ) || 0;
        const totalPrice = Number(body.totalPrice) || 0;
        const estimatedTimeHours = Number(body.estimatedTimeHours) || 0;
        const fdmLayerHeight = snapFdmLayer(body.fdmLayerHeight);
        const layerThickness = snapSlaLayer(body.layerThickness);
        const fdmMaterial = snapFdmMaterial(body.fdmMaterial);
        const resinType = snapResinType(body.resinType);
        const fdmInfill = clampFdmInfill(body.fdmInfill);

        // D1 Database가 있는 경우에만 실행
        if (env && env.DB) {
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

            const runResult = await env.DB.prepare(query)
                .bind(
                    uid,
                    sessionId ?? null,
                    body.fileName,
                    fileSize,
                    body.fileUrl || null,
                    volumeCm3,
                    surfaceAreaCm2,
                    dimensionsX,
                    dimensionsY,
                    dimensionsZ,
                    body.printMethod,
                    fdmMaterial,
                    fdmInfill,
                    fdmLayerHeight,
                    body.fdmSupport ? 1 : 0,
                    resinType,
                    layerThickness,
                    body.postProcessing ? 1 : 0,
                    totalPrice,
                    estimatedTimeHours
                )
                .run();

            const r = runResult as { success?: boolean; error?: string; meta?: { last_row_id?: number } };
            if (r && r.success === false && r.error) throw new Error(r.error);

            return successResponse(
                {
                    id: (runResult?.meta as { last_row_id?: number })?.last_row_id ?? 0,
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
        const msg = error?.message || (error?.cause?.message) || '견적 저장 실패';
        console.error('POST /api/quotes error:', msg, error?.cause ?? error);
        return errorResponse(msg, 500);
    }
}
