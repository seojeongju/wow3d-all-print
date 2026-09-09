import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';
import { uploadGalleryImage } from '@/lib/gallery-upload';
import {
    galleryImageDisplayUrl,
    insertGalleryExtraImage,
} from '@/lib/gallery-images';

type Params = { params: Promise<{ id: string }> };

function isUploadable(f: FormDataEntryValue | null): f is File {
    return typeof File !== 'undefined' && f instanceof File && f.size > 0;
}

/** 관리자: 갤러리 항목 추가 이미지 목록 */
export async function GET(_request: NextRequest, { params }: Params) {
    try {
        const { id: idStr } = await params;
        const itemId = parseInt(idStr, 10);
        if (!Number.isFinite(itemId)) {
            return NextResponse.json({ error: '잘못된 ID' }, { status: 400 });
        }

        const { env } = getCloudflareContext();
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 });

        const admin = await requireAdminAuth(_request, env.DB);
        if (admin instanceof Response) return admin;

        const item = await env.DB.prepare(
            `SELECT id, image_url FROM gallery_items WHERE id = ? AND store_id = ?`
        )
            .bind(itemId, admin.storeId)
            .first<{ id: number; image_url: string }>();
        if (!item) return NextResponse.json({ error: '항목을 찾을 수 없습니다' }, { status: 404 });

        let extras: {
            id: number;
            r2_key: string;
            url: string;
            mime_type: string | null;
            sort_order: number;
        }[] = [];

        try {
            const res = await env.DB.prepare(
                `SELECT id, r2_key, mime_type, sort_order FROM gallery_item_images
                 WHERE gallery_item_id = ? ORDER BY sort_order ASC, id ASC`
            )
                .bind(itemId)
                .all();
            extras = ((res.results as Record<string, unknown>[]) || []).map((m) => ({
                id: m.id as number,
                r2_key: m.r2_key as string,
                url: galleryImageDisplayUrl(String(m.r2_key)),
                mime_type: (m.mime_type as string) || null,
                sort_order: m.sort_order as number,
            }));
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            if (!msg.includes('no such table')) throw e;
        }

        return NextResponse.json({
            success: true,
            data: {
                cover: {
                    url: galleryImageDisplayUrl(item.image_url),
                    r2_key: item.image_url,
                },
                items: extras,
            },
        });
    } catch (e) {
        console.error('GET gallery images', e);
        return NextResponse.json({ error: '조회 실패' }, { status: 500 });
    }
}

/** 관리자: 갤러리 항목에 이미지 추가 (여러 장) */
export async function POST(request: NextRequest, { params }: Params) {
    try {
        const { id: idStr } = await params;
        const itemId = parseInt(idStr, 10);
        if (!Number.isFinite(itemId)) {
            return NextResponse.json({ error: '잘못된 ID' }, { status: 400 });
        }

        const { env } = getCloudflareContext();
        if (!env?.DB || !env.BUCKET) {
            return NextResponse.json({ error: 'DB 또는 R2 없음' }, { status: 503 });
        }

        const admin = await requireAdminAuth(request, env.DB);
        if (admin instanceof Response) return admin;

        const item = await env.DB.prepare(
            `SELECT id FROM gallery_items WHERE id = ? AND store_id = ?`
        )
            .bind(itemId, admin.storeId)
            .first<{ id: number }>();
        if (!item) return NextResponse.json({ error: '항목을 찾을 수 없습니다' }, { status: 404 });

        const formData = await request.formData();
        const files = [
            ...formData.getAll('images'),
            ...formData.getAll('image'),
            ...formData.getAll('file'),
        ].filter(isUploadable);

        if (files.length === 0) {
            return NextResponse.json({ error: '이미지 파일이 필요합니다' }, { status: 400 });
        }

        const uploaded: { id?: number; r2_key: string; url: string }[] = [];

        for (const file of files) {
            const r2Key = await uploadGalleryImage(env.BUCKET, file);
            try {
                const mediaId = await insertGalleryExtraImage(
                    env.DB,
                    itemId,
                    r2Key,
                    file.type || null
                );
                uploaded.push({
                    id: mediaId,
                    r2_key: r2Key,
                    url: galleryImageDisplayUrl(r2Key),
                });
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                if (msg.includes('no such table')) {
                    return NextResponse.json(
                        {
                            error:
                                'gallery_item_images 테이블이 없습니다. 마이그레이션을 적용해 주세요.',
                        },
                        { status: 503 }
                    );
                }
                throw e;
            }
        }

        return NextResponse.json({ success: true, data: { items: uploaded } }, { status: 201 });
    } catch (e) {
        console.error('POST gallery images', e);
        return NextResponse.json({ error: '업로드 실패' }, { status: 500 });
    }
}
