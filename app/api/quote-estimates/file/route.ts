import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { errorResponse, successResponse, requireAuthOrGuest } from '@/lib/api-utils';
import { sanitizeR2FileName } from '@/lib/r2-quote-file';

const MODEL_EXT = new Set(['stl', 'obj', '3mf', 'ply', 'step', 'stp']);

function isModelFileName(name: string): boolean {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    return MODEL_EXT.has(ext);
}

/** 관리자 3D 뷰용. 견적 페이지를 멈추지 않도록 너무 큰 파일은 올리지 않는다 */
const MAX_FILE_BYTES = 50 * 1024 * 1024;

/**
 * POST /api/quote-estimates/file - 견적 확인 기록에 원본 모델 연결
 * FormData: id, file
 * 본인 기록만. 이미 파일이 있으면 다시 올리지 않는다.
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await requireAuthOrGuest(request);
        if (auth instanceof Response) return auth;

        const { env } = getCloudflareContext();
        if (!env?.DB) return errorResponse('DB를 사용할 수 없습니다', 503);
        if (!env?.BUCKET) return errorResponse('파일 스토리지를 사용할 수 없습니다', 503);

        const form = await request.formData();
        const id = Number(form.get('id'));
        const file = form.get('file');
        if (!Number.isInteger(id) || id <= 0) return errorResponse('기록 번호가 없습니다', 400);
        if (!(file instanceof File) || file.size <= 0) return errorResponse('파일이 없습니다', 400);
        if (file.size > MAX_FILE_BYTES) return errorResponse('파일이 너무 커서 3D 미리보기용으로 남기지 않습니다', 413);
        if (!isModelFileName(file.name)) return errorResponse('3D로 열 수 있는 형식이 아닙니다', 400);

        const ownerSql = auth.isGuest ? 'session_id = ?' : 'user_id = ?';
        const ownerBind = auth.isGuest ? auth.sessionId : auth.userId;

        let row: { id: number; file_key: string | null } | null;
        try {
            row = await env.DB.prepare(
                `SELECT id, file_key FROM quote_estimate_logs WHERE id = ? AND ${ownerSql}`
            )
                .bind(id, ownerBind)
                .first<{ id: number; file_key: string | null }>();
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            if (msg.includes('no such column') && msg.includes('file_key')) {
                return errorResponse(
                    '모델 파일 컬럼이 없습니다 (migrations/schema_quote_estimate_logs_file_key.sql 적용 필요)',
                    503
                );
            }
            throw e;
        }
        if (!row) return errorResponse('기록을 찾을 수 없습니다', 404);
        if (row.file_key) return successResponse({ fileKey: row.file_key });

        const safeName = sanitizeR2FileName(file.name);
        const fileKey = `estimate-logs/${id}/${safeName}`;
        const payload = typeof file.stream === 'function' ? file.stream() : await file.arrayBuffer();
        await env.BUCKET.put(fileKey, payload, {
            httpMetadata: { contentType: file.type || 'application/octet-stream' },
        });

        try {
            await env.DB.prepare(
                `UPDATE quote_estimate_logs SET file_key = ? WHERE id = ? AND ${ownerSql} AND (file_key IS NULL OR file_key = '')`
            )
                .bind(fileKey, id, ownerBind)
                .run();
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            await env.BUCKET.delete(fileKey).catch(() => undefined);
            if (msg.includes('no such column') && msg.includes('file_key')) {
                return errorResponse(
                    '모델 파일 컬럼이 없습니다 (migrations/schema_quote_estimate_logs_file_key.sql 적용 필요)',
                    503
                );
            }
            throw e;
        }

        return successResponse({ fileKey });
    } catch (e) {
        console.error('POST /api/quote-estimates/file', e);
        return errorResponse('모델 파일 저장 실패', 500);
    }
}
