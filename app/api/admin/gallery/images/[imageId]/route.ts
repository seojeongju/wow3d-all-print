import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';

/** 관리자: 갤러리 추가 이미지 1건 삭제 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ imageId: string }> }
) {
    try {
        const { imageId: idStr } = await params;
        const imageId = parseInt(idStr, 10);
        if (!Number.isFinite(imageId)) {
            return NextResponse.json({ error: '잘못된 ID' }, { status: 400 });
        }

        const { env } = getCloudflareContext();
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 });

        const admin = await requireAdminAuth(request, env.DB);
        if (admin instanceof Response) return admin;

        const row = await env.DB.prepare(
            `SELECT i.id, i.r2_key FROM gallery_item_images i
             INNER JOIN gallery_items g ON g.id = i.gallery_item_id
             WHERE i.id = ? AND g.store_id = ?`
        )
            .bind(imageId, admin.storeId)
            .first<{ id: number; r2_key: string }>();

        if (!row) return NextResponse.json({ error: '찾을 수 없음' }, { status: 404 });

        if (env.BUCKET) {
            try {
                await env.BUCKET.delete(row.r2_key);
            } catch {
                /* ignore */
            }
        }

        await env.DB.prepare(`DELETE FROM gallery_item_images WHERE id = ?`).bind(imageId).run();

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('DELETE gallery image', e);
        return NextResponse.json({ error: '삭제 실패' }, { status: 500 });
    }
}
