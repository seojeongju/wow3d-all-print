import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';

/** 관리자: 예시 미디어 1건 삭제 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ mediaId: string }> }
) {
    try {
        const { mediaId: midStr } = await params;
        const mediaId = parseInt(midStr, 10);
        if (!Number.isFinite(mediaId)) return NextResponse.json({ error: '잘못된 ID' }, { status: 400 });

        const { env } = getCloudflareContext();
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 });

        const admin = await requireAdminAuth(request, env.DB);
        if (admin instanceof Response) return admin;

        const row = await env.DB.prepare(
            `SELECT m.id, m.r2_key FROM showcase_example_media m
             INNER JOIN showcase_examples e ON e.id = m.example_id
             WHERE m.id = ? AND e.store_id = ?`
        )
            .bind(mediaId, admin.storeId)
            .first<{ id: number; r2_key: string }>();

        if (!row) return NextResponse.json({ error: '찾을 수 없음' }, { status: 404 });

        if (env.BUCKET) {
            try {
                await env.BUCKET.delete(row.r2_key);
            } catch {
                /* ignore */
            }
        }

        await env.DB.prepare(`DELETE FROM showcase_example_media WHERE id = ?`).bind(mediaId).run();

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('DELETE example-media', e);
        return NextResponse.json({ error: '삭제 실패' }, { status: 500 });
    }
}
