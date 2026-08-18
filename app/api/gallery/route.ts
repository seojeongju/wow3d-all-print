import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';
import { getPublicGallery } from '@/lib/gallery-public';
import { uploadGalleryImage } from '@/lib/gallery-upload';

// ─────────────────────────────────────────────
// GET /api/gallery?page=1&limit=8&store_id=1
// 공개 갤러리 목록 조회
// ─────────────────────────────────────────────
export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
        const limit = Math.min(50, Math.max(4, parseInt(url.searchParams.get('limit') || '8')));
        const storeIdParam = url.searchParams.get('store_id');
        const storeId = storeIdParam ? parseInt(storeIdParam) : null;
        const tagParam = url.searchParams.get('tag');
        const tag = tagParam === 'photo-to-3d' ? 'photo-to-3d' as const : null;

        const result = await getPublicGallery({ page, limit, storeId, tag });

        return NextResponse.json({
            success: true,
            data: {
                items: result.items,
                pagination: result.pagination,
                debug: { storeIdUsed: storeIdParam },
            },
        });
    } catch (e) {
        console.error('GET /api/gallery', e);
        return NextResponse.json({ error: '갤러리 조회 실패' }, { status: 500 });
    }
}

// ─────────────────────────────────────────────
// POST /api/gallery  (Admin 전용)
// ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
    try {
        const { env } = getCloudflareContext();
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 });

        const admin = await requireAdminAuth(request, env.DB);
        if (admin instanceof Response) return admin;

        const formData = await request.formData();
        const imageFile = formData.get('image') as File | null;
        const sourceImageFile = formData.get('source_image') as File | null;
        const title = (formData.get('title') as string | null)?.trim() || '';
        const description = (formData.get('description') as string | null)?.trim() || '';
        const material = (formData.get('material') as string | null)?.trim() || '';
        const printMethod = (formData.get('print_method') as string | null)?.trim() || '';
        const tagsRaw = (formData.get('tags') as string | null)?.trim() || '[]';

        if (!title) return NextResponse.json({ error: '제목을 입력해주세요' }, { status: 400 });
        if (!imageFile) return NextResponse.json({ error: '이미지 파일이 필요합니다' }, { status: 400 });

        let imageUrl = '';
        if (env.BUCKET) {
            imageUrl = await uploadGalleryImage(env.BUCKET, imageFile);
        } else {
            return NextResponse.json({ error: 'R2 BUCKET이 없습니다' }, { status: 503 });
        }

        let sourceImageUrl: string | null = null;
        if (sourceImageFile && env.BUCKET) {
            sourceImageUrl = await uploadGalleryImage(env.BUCKET, sourceImageFile, 'gallery/source');
        }

        let result: any;
        const storeIdToUse = admin.storeId ?? 1;

        try {
            result = await env.DB.prepare(
                `INSERT INTO gallery_items (store_id, title, description, image_url, source_image_url, material, print_method, tags, created_by_user_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(storeIdToUse, title, description, imageUrl, sourceImageUrl, material, printMethod, tagsRaw, admin.userId).run();
        } catch (colErr: any) {
            if (colErr.message?.includes('source_image_url') || colErr.message?.includes('no such column')) {
                result = await env.DB.prepare(
                    `INSERT INTO gallery_items (store_id, title, description, image_url, material, print_method, tags, created_by_user_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
                ).bind(storeIdToUse, title, description, imageUrl, material, printMethod, tagsRaw, admin.userId).run();
            } else if (colErr.message?.includes('created_by_user_id') || colErr.message?.includes('no such column')) {
                result = await env.DB.prepare(
                    `INSERT INTO gallery_items (store_id, title, description, image_url, material, print_method, tags)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`
                ).bind(storeIdToUse, title, description, imageUrl, material, printMethod, tagsRaw).run();
            } else {
                throw colErr;
            }
        }

        const newId = result.meta?.last_row_id;
        return NextResponse.json({
            success: true,
            data: { id: newId, imageUrl, storeId: storeIdToUse },
        }, { status: 201 });
    } catch (e) {
        console.error('POST /api/gallery', e);
        return NextResponse.json({ error: '갤러리 등록 실패' }, { status: 500 });
    }
}
