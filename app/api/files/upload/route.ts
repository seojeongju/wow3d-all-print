import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { buildQuoteR2Key, sanitizeR2FileName } from '@/lib/r2-quote-file';
import {
    copyMeshyJobResultToQuote,
    meshyJobOwnedBy,
    parseMeshyJobIdFromFileName,
    type MeshyJobFileRow,
} from '@/lib/meshy-r2';
import { requireAuthOrGuest } from '@/lib/api-utils';

/**
 * POST /api/files/upload - 파일을 R2에 업로드
 * FormData: file (File), quoteId (optional)
 * Returns: { fileUrl: string } - R2 key (quotes/{quoteId}/{fileName} 형식)
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await requireAuthOrGuest(request);
        if (auth instanceof Response) return auth;

        const { env } = getCloudflareContext();
        if (!env?.DB) {
            return NextResponse.json({ error: 'DB를 사용할 수 없습니다' }, { status: 503 });
        }
        if (!env?.BUCKET) {
            return NextResponse.json({ error: 'R2 BUCKET을 사용할 수 없습니다' }, { status: 503 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const quoteIdParam = formData.get('quoteId');
        const meshyJobIdParam = formData.get('meshyJobId');

        let meshyJobId = meshyJobIdParam ? parseInt(String(meshyJobIdParam), 10) : NaN;
        if (!Number.isInteger(meshyJobId) || meshyJobId <= 0) {
            const fromName = file ? parseMeshyJobIdFromFileName(file.name) : null;
            if (fromName) meshyJobId = fromName;
        }
        const hasMeshyJob = Number.isInteger(meshyJobId) && meshyJobId > 0;

        if (!file && !hasMeshyJob) {
            return NextResponse.json({ error: '파일이 없습니다' }, { status: 400 });
        }

        let quoteId: number | null = null;
        if (quoteIdParam) {
            const parsed = parseInt(String(quoteIdParam), 10);
            if (Number.isInteger(parsed)) {
                quoteId = parsed;
            }
        }

        const preferredName = file
            ? sanitizeR2FileName(file.name)
            : hasMeshyJob
              ? `meshy-${meshyJobId}.stl`
              : 'model.stl';

        if (!quoteId) {
            const uid = auth.isGuest ? null : auth.userId;
            const sessionId = auth.isGuest ? auth.sessionId : null;
            const result = await env.DB.prepare(
                'INSERT INTO quotes (user_id, session_id, file_name, file_size, volume_cm3, surface_area_cm2, dimensions_x, dimensions_y, dimensions_z, print_method, total_price, estimated_time_hours) VALUES (?, ?, ?, ?, 0, 0, 0, 0, 0, ?, 0, 0)'
            )
                .bind(uid, sessionId, preferredName, file?.size ?? 0, 'fdm')
                .run();
            quoteId = (result.meta as { last_row_id?: number })?.last_row_id ?? 0;
            if (quoteId === 0) {
                return NextResponse.json({ error: '견적 생성 실패' }, { status: 500 });
            }
        }

        // 사진→AI 3D: R2 meshy/ 경로에서 quotes/ 로 서버 복사 (클라이언트 재업로드 실패 방지)
        if (hasMeshyJob) {
            const job = await env.DB.prepare(
                `SELECT id, user_id, session_id, status, result_file_key, result_file_name FROM meshy_jobs WHERE id = ?`
            )
                .bind(meshyJobId)
                .first<MeshyJobFileRow>();

            if (!job) {
                return NextResponse.json({ error: 'Meshy 작업을 찾을 수 없습니다' }, { status: 404 });
            }
            if (!meshyJobOwnedBy(job, auth)) {
                return NextResponse.json({ error: 'Meshy 작업 권한이 없습니다' }, { status: 403 });
            }

            const copied = await copyMeshyJobResultToQuote(env, meshyJobId, quoteId, preferredName);
            if ('error' in copied) {
                if (!file) {
                    return NextResponse.json({ error: copied.error }, { status: copied.status });
                }
                // Meshy 복사 실패 시 아래 일반 업로드로 폴백
            } else {
                return NextResponse.json({
                    success: true,
                    data: {
                        fileUrl: copied.fileUrl,
                        quoteId,
                        fileName: copied.fileName,
                    },
                });
            }
        }

        if (!file) {
            return NextResponse.json({ error: '파일이 없습니다' }, { status: 400 });
        }

        const safeName = sanitizeR2FileName(file.name);

        const r2Key = buildQuoteR2Key(quoteId, safeName);
        try {
            const payload =
                typeof file.stream === 'function' ? file.stream() : await file.arrayBuffer();
            await env.BUCKET.put(r2Key, payload, {
                httpMetadata: {
                    contentType: file.type || 'application/octet-stream',
                },
            });
        } catch (e) {
            console.error('[files/upload] R2 put failed', e);
            return NextResponse.json(
                {
                    error: '모델 파일이 커서 업로드에 실패했습니다. 잠시 후 다시 시도하거나 관리자에게 문의해 주세요.',
                    quoteId,
                },
                { status: 500 }
            );
        }

        await env.DB.prepare(
            'UPDATE quotes SET file_url = ?, file_name = COALESCE(?, file_name) WHERE id = ?'
        )
            .bind(r2Key, safeName, quoteId)
            .run();

        return NextResponse.json({
            success: true,
            data: {
                fileUrl: r2Key,
                quoteId,
                fileName: safeName,
            },
        });
    } catch (e) {
        const message = e instanceof Error ? e.message : '파일 업로드 실패';
        console.error('POST /api/files/upload', e);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
