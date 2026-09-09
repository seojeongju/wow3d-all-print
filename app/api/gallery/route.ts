import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';
import { getPublicGallery } from '@/lib/gallery-public';
import { uploadGalleryImage } from '@/lib/gallery-upload';
import { insertGalleryExtraImage } from '@/lib/gallery-images';

function isUploadable(f: FormDataEntryValue | null): f is File {
    return typeof File !== 'undefined' && f instanceof File && f.size > 0;
}

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
// image(단일) 또는 images(다중) — 첫 장은 대표, 나머지는 gallery_item_images
// ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
    try {
        const { env } = getCloudflareContext();
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 });

        const admin = await requireAdminAuth(request, env.DB);
        if (admin instanceof Response) return admin;

        const formData = await request.formData();
        const sourceImageFile = formData.get('source_image');
        const title = (formData.get('title') as string | null)?.trim() || '';
        const description = (formData.get('description') as string | null)?.trim() || '';
        const material = (formData.get('material') as string | null)?.trim() || '';
        const printMethod = (formData.get('print_method') as string | null)?.trim() || '';
        const tagsRaw = (formData.get('tags') as string | null)?.trim() || '[]';

        const imageFiles = [
            ...formData.getAll('images'),
            ...formData.getAll('image'),
        ].filter(isUploadable);

        const uniqueFiles: File[] = [];
        const seenNames = new Set<string>();
        for (const f of imageFiles) {
            const key = `${f.name}:${f.size}:${f.lastModified}`;
            if (seenNames.has(key)) continue;
            seenNames.add(key);
            uniqueFiles.push(f);
        }

        if (!title) return NextResponse.json({ error: '제목을 입력해주세요' }, { status: 400 });
        if (uniqueFiles.length === 0) {
            return NextResponse.json({ error: '이미지 파일이 필요합니다' }, { status: 400 });
        }
        if (!env.BUCKET) {
            return NextResponse.json({ error: 'R2 BUCKET이 없습니다' }, { status: 503 });
        }

        const [coverFile, ...extraFiles] = uniqueFiles;
        const imageUrl = await uploadGalleryImage(env.BUCKET, coverFile);

        let sourceImageUrl: string | null = null;
        if (isUploadable(sourceImageFile)) {
            sourceImageUrl = await uploadGalleryImage(env.BUCKET, sourceImageFile, 'gallery/source');
        }

        let result: { meta?: { last_row_id?: number } };
        const storeIdToUse = admin.storeId ?? 1;

        try {
            result = await env.DB.prepare(
                `INSERT INTO gallery_items (store_id, title, description, image_url, source_image_url, material, print_method, tags, created_by_user_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(storeIdToUse, title, description, imageUrl, sourceImageUrl, material, printMethod, tagsRaw, admin.userId).run();
        } catch (colErr: unknown) {
            const msg = colErr instanceof Error ? colErr.message : String(colErr);
            if (msg.includes('source_image_url') || msg.includes('no such column')) {
                result = await env.DB.prepare(
                    `INSERT INTO gallery_items (store_id, title, description, image_url, material, print_method, tags, created_by_user_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
                ).bind(storeIdToUse, title, description, imageUrl, material, printMethod, tagsRaw, admin.userId).run();
            } else if (msg.includes('created_by_user_id') || msg.includes('no such column')) {
                result = await env.DB.prepare(
                    `INSERT INTO gallery_items (store_id, title, description, image_url, material, print_method, tags)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`
                ).bind(storeIdToUse, title, description, imageUrl, material, printMethod, tagsRaw).run();
            } else {
                throw colErr;
            }
        }

        const newId = result.meta?.last_row_id;
        const extraKeys: string[] = [];

        if (newId && extraFiles.length > 0) {
            for (const file of extraFiles) {
                const key = await uploadGalleryImage(env.BUCKET, file);
                try {
                    await insertGalleryExtraImage(env.DB, Number(newId), key, file.type || null);
                    extraKeys.push(key);
                } catch (e: unknown) {
                    const msg = e instanceof Error ? e.message : String(e);
                    if (msg.includes('no such table')) {
                        console.warn('gallery_item_images 테이블 없음 — 추가 이미지 저장 생략');
                        break;
                    }
                    throw e;
                }
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                id: newId,
                imageUrl,
                extraImages: extraKeys,
                storeId: storeIdToUse,
            },
        }, { status: 201 });
    } catch (e) {
        console.error('POST /api/gallery', e);
        return NextResponse.json({ error: '갤러리 등록 실패' }, { status: 500 });
    }
}
