import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';
import {
    extFromFile,
    isShowcaseSlug,
    showcaseMediaUrlFromKey,
    validateShowcaseUpload,
} from '@/lib/showcase';

/** 관리자: 카테고리 카드/히어로 이미지 업로드 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        if (!isShowcaseSlug(slug)) {
            return NextResponse.json({ error: '알 수 없는 카테고리' }, { status: 400 });
        }

        const { env } = getCloudflareContext();
        if (!env?.DB || !env.BUCKET) {
            return NextResponse.json({ error: 'DB 또는 R2 없음' }, { status: 503 });
        }

        const admin = await requireAdminAuth(request, env.DB);
        if (admin instanceof Response) return admin;

        const formData = await request.formData();
        const file = formData.get('image') as File | null;
        if (!file) return NextResponse.json({ error: '이미지 파일이 필요합니다' }, { status: 400 });

        const err = validateShowcaseUpload('image', file);
        if (err) return NextResponse.json({ error: err }, { status: 400 });

        const ext = extFromFile(file, 'image');
        const r2Key = `showcase/${admin.storeId}/category/${slug}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const buf = await file.arrayBuffer();
        await env.BUCKET.put(r2Key, buf, {
            httpMetadata: { contentType: file.type || 'image/jpeg' },
        });

        const prev = await env.DB.prepare(
            `SELECT card_image_key FROM showcase_category_content WHERE store_id = ? AND category_slug = ?`
        )
            .bind(admin.storeId, slug)
            .first<{ card_image_key: string | null }>();

        const oldKey = prev?.card_image_key?.trim();
        if (oldKey && oldKey !== r2Key) {
            try {
                await env.BUCKET.delete(oldKey);
            } catch {
                /* ignore */
            }
        }

        await env.DB.prepare(
            `INSERT INTO showcase_category_content (store_id, category_slug, card_image_key, updated_at)
             VALUES (?, ?, ?, datetime('now'))
             ON CONFLICT(store_id, category_slug) DO UPDATE SET
               card_image_key = excluded.card_image_key,
               updated_at = datetime('now')`
        )
            .bind(admin.storeId, slug, r2Key)
            .run();

        return NextResponse.json({
            success: true,
            data: { card_image_key: r2Key, cardImageUrl: showcaseMediaUrlFromKey(r2Key) },
        });
    } catch (e) {
        console.error('POST card-image', e);
        return NextResponse.json({ error: '업로드 실패' }, { status: 500 });
    }
}
