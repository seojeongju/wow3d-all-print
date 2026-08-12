import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { Env } from '@/env';
import { errorResponse, successResponse, generateSessionId } from '@/lib/api-utils';
import type { QuoteData } from '@/lib/types';
import { normalizeAmountBeforeSave } from '@/lib/amount-display';
import { clampFdmInfillPercent } from '@/lib/fdm-quote';
import { resolveServerFdmQuote } from '@/lib/server-fdm-quote';
import { resolveServerResinQuote } from '@/lib/server-resin-quote';

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
        const sessionId = request.headers.get('X-Session-ID')?.trim();
        const userId = request.headers.get('X-User-ID')?.trim();

        if (!sessionId && !userId) {
            return successResponse([], '인증 정보 없음');
        }

        let query: string;
        let bindings: QuoteQueryBinding[];

        if (userId) {
            const parsed = parseInt(userId, 10);
            if (Number.isNaN(parsed)) return errorResponse('유효하지 않은 X-User-ID', 400);
            query = 'SELECT * FROM quotes WHERE user_id = ? AND volume_cm3 > 0 ORDER BY created_at DESC';
            bindings = [parsed];
        } else {
            query = 'SELECT * FROM quotes WHERE session_id = ? AND volume_cm3 > 0 ORDER BY created_at DESC';
            bindings = [sessionId ?? null];
        }

        // D1 Database가 있는 경우에만 실행
        if (env && env.DB) {
            const result = await env.DB.prepare(query).bind(...bindings).all();
            return successResponse(result.results || []);
        }

        // 로컬 개발 환경에서는 빈 배열 반환
        return successResponse([]);
    } catch (error: unknown) {
        console.error('GET /api/quotes error:', error);
        return errorResponse(getErrorMessage(error, '견적 조회 실패'), 500);
    }
}

// CHECK 제약용: 부동소수·허용값 보정
const FDM_LAYER = [0.1, 0.2, 0.3] as const;
const SLA_LAYER = [0.025, 0.05, 0.1] as const;
const FDM_MAT = ['PLA', 'ABS', 'PETG', 'TPU'] as const;
const RESIN = ['Standard', 'Tough', 'Clear', 'Flexible'] as const;
type QuoteQueryBinding = string | number | null;
type QuoteRunResult = { success?: boolean; error?: string; meta?: { last_row_id?: number } };

function getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error) return error.message || fallback;
    return fallback;
}

function snapFdmLayer(v: unknown): typeof FDM_LAYER[number] | null {
    if (v == null || v === '') return null;
    const n = Math.round(Number(v) * 10) / 10;
    return FDM_LAYER.includes(n as typeof FDM_LAYER[number]) ? (n as typeof FDM_LAYER[number]) : null;
}
function snapSlaLayer(v: unknown): typeof SLA_LAYER[number] | null {
    if (v == null || v === '') return null;
    const n = Math.round(Number(v) * 1000) / 1000;
    return SLA_LAYER.includes(n as typeof SLA_LAYER[number]) ? (n as typeof SLA_LAYER[number]) : null;
}
function snapFdmMaterial(v: unknown): string | null {
    if (v == null || v === '') return null;
    const s = String(v).trim().toUpperCase();
    return FDM_MAT.includes(s as typeof FDM_MAT[number]) ? s : null;
}
function snapResinType(v: unknown): string | null {
    if (v == null || v === '') return null;
    const s = String(v).trim();
    const hit = RESIN.find((r) => r.toLowerCase() === s.toLowerCase());
    return hit ?? null;
}
/** CHECK와 별도로 고객이 고른 소재 표시명 보존 */
function materialDisplayName(v: unknown): string | null {
    if (v == null || v === '') return null;
    const s = String(v).trim().slice(0, 80);
    return s || null;
}
function guideText(v: unknown, max = 120): string | null {
    if (v == null || v === '') return null;
    const s = String(v).trim().slice(0, max);
    return s || null;
}
function clampFdmInfill(v: unknown): number | null {
    if (v == null || v === '') return null;
    const n = Math.round(Number(v));
    if (!Number.isFinite(n)) return null;
    const clamped = clampFdmInfillPercent(n);
    return clamped >= 10 && clamped <= 100 ? clamped : null;
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
        const fdmLayerHeight = snapFdmLayer(body.fdmLayerHeight);
        const layerThickness = snapSlaLayer(body.layerThickness);
        const fdmMaterial = snapFdmMaterial(body.fdmMaterial);
        const resinType = snapResinType(body.resinType);
        const fdmMaterialName = materialDisplayName(body.fdmMaterial) ?? fdmMaterial;
        const resinTypeName = materialDisplayName(body.resinType) ?? resinType;
        const fdmInfill = clampFdmInfill(body.fdmInfill);
        const guideSource = guideText(body.guideSource, 80);
        const guideTopic = guideText(body.guideTopic, 120);

        let totalPrice = normalizeAmountBeforeSave(Number(body.totalPrice) || 0);
        let estimatedTimeHours = Number(body.estimatedTimeHours) || 0;
        let quotePricingSource: 'server' | 'client' = 'client';

        // D1 Database가 있는 경우에만 실행
        if (env && env.DB) {
            // FDM / SLA / DLP: 서버에서 동일 공식으로 재계산 후 저장 (클라이언트 금액 변조 방어)
            if (body.printMethod === 'fdm') {
                const serverQuote = await resolveServerFdmQuote(env.DB, {
                    volumeCm3,
                    surfaceAreaCm2,
                    heightMm: dimensionsZ,
                    fdmMaterialName: fdmMaterialName,
                    infillPercent: fdmInfill,
                    layerHeightMm: fdmLayerHeight,
                    supportEnabled: !!body.fdmSupport,
                    clientTotalPrice: totalPrice,
                    clientEstimatedHours: estimatedTimeHours,
                });
                totalPrice = normalizeAmountBeforeSave(serverQuote.totalPrice);
                estimatedTimeHours = serverQuote.estimatedTimeHours;
                quotePricingSource = serverQuote.source;
            } else if (body.printMethod === 'sla' || body.printMethod === 'dlp') {
                const serverQuote = await resolveServerResinQuote(env.DB, {
                    method: body.printMethod,
                    volumeCm3,
                    heightMm: dimensionsZ,
                    layerHeightMm: layerThickness,
                    resinTypeName: resinTypeName,
                    postProcessing: !!body.postProcessing,
                    clientTotalPrice: totalPrice,
                    clientEstimatedHours: estimatedTimeHours,
                });
                totalPrice = normalizeAmountBeforeSave(serverQuote.totalPrice);
                estimatedTimeHours = serverQuote.estimatedTimeHours;
                quotePricingSource = serverQuote.source;
            }

            let runResult: QuoteRunResult;
            const baseBind = [
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
                estimatedTimeHours,
                guideSource,
                guideTopic,
            ] as const;
            const legacyBind = baseBind.slice(0, 20);

            if (body.id) {
                // file_url이 요청에 없으면 기존 값 유지 (견적 재저장 시 null로 지워지던 버그 방지)
                try {
                    runResult = await env.DB.prepare(`
                        UPDATE quotes SET 
                            user_id = ?, session_id = ?, file_name = ?, file_size = ?,
                            file_url = COALESCE(?, file_url),
                            volume_cm3 = ?, surface_area_cm2 = ?, dimensions_x = ?, dimensions_y = ?, dimensions_z = ?,
                            print_method = ?,
                            fdm_material = ?, fdm_infill = ?, fdm_layer_height = ?, fdm_support = ?,
                            resin_type = ?, layer_thickness = ?, post_processing = ?,
                            total_price = ?, estimated_time_hours = ?,
                            guide_source = ?, guide_topic = ?,
                            fdm_material_name = ?, resin_type_name = ?,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `).bind(...baseBind, fdmMaterialName, resinTypeName, body.id).run();
                } catch {
                    runResult = await env.DB.prepare(`
                        UPDATE quotes SET 
                            user_id = ?, session_id = ?, file_name = ?, file_size = ?,
                            file_url = COALESCE(?, file_url),
                            volume_cm3 = ?, surface_area_cm2 = ?, dimensions_x = ?, dimensions_y = ?, dimensions_z = ?,
                            print_method = ?,
                            fdm_material = ?, fdm_infill = ?, fdm_layer_height = ?, fdm_support = ?,
                            resin_type = ?, layer_thickness = ?, post_processing = ?,
                            total_price = ?, estimated_time_hours = ?,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `).bind(...legacyBind, body.id).run();
                }
            } else {
                try {
                    runResult = await env.DB.prepare(`
                        INSERT INTO quotes (
                            user_id, session_id, file_name, file_size, file_url,
                            volume_cm3, surface_area_cm2, dimensions_x, dimensions_y, dimensions_z,
                            print_method,
                            fdm_material, fdm_infill, fdm_layer_height, fdm_support,
                            resin_type, layer_thickness, post_processing,
                            total_price, estimated_time_hours,
                            guide_source, guide_topic,
                            fdm_material_name, resin_type_name
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `).bind(...baseBind, fdmMaterialName, resinTypeName).run();
                } catch {
                    runResult = await env.DB.prepare(`
                        INSERT INTO quotes (
                            user_id, session_id, file_name, file_size, file_url,
                            volume_cm3, surface_area_cm2, dimensions_x, dimensions_y, dimensions_z,
                            print_method,
                            fdm_material, fdm_infill, fdm_layer_height, fdm_support,
                            resin_type, layer_thickness, post_processing,
                            total_price, estimated_time_hours
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `).bind(...legacyBind).run();
                }
            }

            const r = runResult;
            if (r && r.success === false && r.error) throw new Error(r.error);

            return successResponse(
                {
                    id: runResult.meta?.last_row_id ?? 0,
                    sessionId: sessionId || undefined,
                    totalPrice,
                    estimatedTimeHours,
                    pricingSource: quotePricingSource,
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
    } catch (error: unknown) {
        const msg = getErrorMessage(error, '견적 저장 실패');
        console.error('POST /api/quotes error:', msg, error);
        return errorResponse(msg, 500);
    }
}
