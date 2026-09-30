import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { errorResponse, successResponse, requireAuthOrGuest } from '@/lib/api-utils';

const PRINT_METHODS = new Set(['fdm', 'sla', 'dlp']);
const THUMBNAIL_PREFIXES = ['data:image/jpeg;base64,', 'data:image/webp;base64,'];
const THUMBNAIL_MAX_LENGTH = 60_000;
const MAX_PRICE_KRW = 100_000_000;
/** 비회원 세션 하나가 1시간에 만들 수 있는 기록 수 상한 (스팸 방지) */
const HOURLY_INSERT_LIMIT = 120;

type EstimateBody = {
    id?: unknown;
    fileName?: unknown;
    fileSize?: unknown;
    dimensionsX?: unknown;
    dimensionsY?: unknown;
    dimensionsZ?: unknown;
    volumeCm3?: unknown;
    surfaceAreaCm2?: unknown;
    printMethod?: unknown;
    materialName?: unknown;
    layerHeight?: unknown;
    fdmInfill?: unknown;
    totalPrice?: unknown;
    estimatedTimeHours?: unknown;
    guideSource?: unknown;
    thumbnail?: unknown;
    quoteId?: unknown;
};

function num(v: unknown, max = 1e9): number {
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(n, max);
}

function text(v: unknown, max: number): string | null {
    if (v == null) return null;
    const s = String(v).trim().slice(0, max);
    return s || null;
}

function positiveInt(v: unknown): number | null {
    const n = Number(v);
    return Number.isInteger(n) && n > 0 ? n : null;
}

function parseThumbnail(v: unknown): string | null {
    if (typeof v !== 'string' || v.length > THUMBNAIL_MAX_LENGTH) return null;
    return THUMBNAIL_PREFIXES.some((p) => v.startsWith(p)) ? v : null;
}

/**
 * POST /api/quote-estimates - 자동견적 확인 기록 (회원·비회원)
 * - id 없음: 새 기록 생성, id 있음: 본인 기록이면 최신 조건으로 갱신
 * - thumbnail / quoteId 만 보내면 해당 필드만 갱신
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await requireAuthOrGuest(request);
        if (auth instanceof Response) return auth;

        const { env } = getCloudflareContext();
        if (!env?.DB) return errorResponse('DB를 사용할 수 없습니다', 503);

        const body = (await request.json().catch(() => ({}))) as EstimateBody;
        const userId = auth.isGuest ? null : auth.userId;
        const sessionId = auth.isGuest ? auth.sessionId : null;
        const ownerSql = auth.isGuest ? 'session_id = ?' : 'user_id = ?';
        const ownerBind = auth.isGuest ? auth.sessionId : auth.userId;

        const id = positiveInt(body.id);
        const thumbnail = parseThumbnail(body.thumbnail);

        let quoteId = positiveInt(body.quoteId);
        if (quoteId) {
            const owned = await env.DB.prepare(`SELECT id FROM quotes WHERE id = ? AND ${ownerSql}`)
                .bind(quoteId, ownerBind)
                .first();
            if (!owned) quoteId = null;
        }

        const printMethod = text(body.printMethod, 8);
        const fileName = text(body.fileName, 200);
        const hasEstimate = Boolean(fileName && printMethod && PRINT_METHODS.has(printMethod));

        // 썸네일·견적 연결만 갱신
        if (id && !hasEstimate) {
            if (!thumbnail && !quoteId) return errorResponse('갱신할 내용이 없습니다', 400);
            await env.DB.prepare(
                `UPDATE quote_estimate_logs
                 SET thumbnail_data = COALESCE(?, thumbnail_data), quote_id = COALESCE(?, quote_id)
                 WHERE id = ? AND ${ownerSql}`
            )
                .bind(thumbnail, quoteId, id, ownerBind)
                .run();
            return successResponse({ id });
        }

        if (!hasEstimate) return errorResponse('필수 정보가 누락되었습니다', 400);

        const totalPrice = Math.round(num(body.totalPrice, MAX_PRICE_KRW));
        if (totalPrice <= 0) return errorResponse('견적 금액이 없습니다', 400);

        const fields = [
            fileName,
            Math.floor(num(body.fileSize, 2_000_000_000)),
            num(body.dimensionsX, 100_000),
            num(body.dimensionsY, 100_000),
            num(body.dimensionsZ, 100_000),
            num(body.volumeCm3, 1e7),
            num(body.surfaceAreaCm2, 1e8),
            printMethod,
            text(body.materialName, 80),
            body.layerHeight == null ? null : num(body.layerHeight, 10),
            body.fdmInfill == null ? null : Math.round(num(body.fdmInfill, 100)),
            totalPrice,
            num(body.estimatedTimeHours, 10_000),
        ] as const;

        if (id) {
            const res = await env.DB.prepare(
                `UPDATE quote_estimate_logs SET
                    file_name = ?, file_size = ?, dimensions_x = ?, dimensions_y = ?, dimensions_z = ?,
                    volume_cm3 = ?, surface_area_cm2 = ?, print_method = ?, material_name = ?,
                    layer_height = ?, fdm_infill = ?, total_price = ?, estimated_time_hours = ?,
                    change_count = change_count + 1,
                    thumbnail_data = COALESCE(?, thumbnail_data),
                    quote_id = COALESCE(?, quote_id),
                    updated_at = datetime('now')
                 WHERE id = ? AND ${ownerSql}`
            )
                .bind(...fields, thumbnail, quoteId, id, ownerBind)
                .run();
            if ((res.meta as { changes?: number })?.changes) return successResponse({ id });
        }

        const recent = await env.DB.prepare(
            `SELECT COUNT(*) AS cnt FROM quote_estimate_logs
             WHERE ${ownerSql} AND created_at >= datetime('now', '-1 hour')`
        )
            .bind(ownerBind)
            .first<{ cnt?: number }>();
        if (Number(recent?.cnt ?? 0) >= HOURLY_INSERT_LIMIT) {
            return errorResponse('요청이 너무 많습니다', 429);
        }

        const inserted = await env.DB.prepare(
            `INSERT INTO quote_estimate_logs (
                user_id, session_id,
                file_name, file_size, dimensions_x, dimensions_y, dimensions_z,
                volume_cm3, surface_area_cm2, print_method, material_name,
                layer_height, fdm_infill, total_price, estimated_time_hours,
                thumbnail_data, quote_id, guide_source
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
            .bind(userId, sessionId, ...fields, thumbnail, quoteId, text(body.guideSource, 80))
            .run();

        const newId = (inserted.meta as { last_row_id?: number })?.last_row_id ?? 0;
        return successResponse({ id: newId });
    } catch (e) {
        console.error('POST /api/quote-estimates', e);
        return errorResponse('견적 기록 저장 실패', 500);
    }
}
