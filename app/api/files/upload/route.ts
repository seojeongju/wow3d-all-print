import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAuth, requireAuthOrGuest } from '@/lib/api-utils';

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

        if (!file) {
            return NextResponse.json({ error: '파일이 없습니다' }, { status: 400 });
        }

        let quoteId: number | null = null;
        if (quoteIdParam) {
            const parsed = parseInt(String(quoteIdParam), 10);
            if (Number.isInteger(parsed)) {
                quoteId = parsed;
            }
        }

        // quoteId가 있으면 해당 견적의 파일로 저장
        // 없으면 임시 quoteId 생성 (나중에 견적 저장 시 업데이트)
        if (!quoteId) {
            // 임시 quoteId 생성 (나중에 견적 저장 시 실제 quoteId로 업데이트)
            const uid = auth.isGuest ? null : auth.userId;
            const sessionId = auth.isGuest ? auth.sessionId : null;
            const result = await env.DB.prepare(
                'INSERT INTO quotes (user_id, session_id, file_name, file_size, volume_cm3, surface_area_cm2, dimensions_x, dimensions_y, dimensions_z, print_method, total_price, estimated_time_hours) VALUES (?, ?, ?, ?, 0, 0, 0, 0, 0, ?, 0, 0)'
            )
                .bind(uid, sessionId, file.name, file.size, 'fdm')
                .run();
            quoteId = (result.meta as { last_row_id?: number })?.last_row_id ?? 0;
            if (quoteId === 0) {
                return NextResponse.json({ error: '견적 생성 실패' }, { status: 500 });
            }
        }

        // R2에 파일 업로드
        const r2Key = `quotes/${quoteId}/${file.name}`;
        const arrayBuffer = await file.arrayBuffer();
        await env.BUCKET.put(r2Key, arrayBuffer, {
            httpMetadata: {
                contentType: file.type || 'application/octet-stream',
            },
        });

        // quotes 테이블의 file_url 업데이트
        await env.DB.prepare('UPDATE quotes SET file_url = ? WHERE id = ?')
            .bind(r2Key, quoteId)
            .run();

        return NextResponse.json({
            success: true,
            data: {
                fileUrl: r2Key,
                quoteId,
            },
        });
    } catch (e) {
        console.error('POST /api/files/upload', e);
        return NextResponse.json({ error: '파일 업로드 실패' }, { status: 500 });
    }
}
