import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';
import { uploadGalleryImage } from '@/lib/gallery-upload';
import { getPublicGalleryItemById } from '@/lib/gallery-public';

type Params = { params: Promise<{ id: string }> };

/** GET /api/gallery/[id] — 공개 갤러리 단일 항목 */
export async function GET(_request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const item = await getPublicGalleryItemById(decodeURIComponent(id));
        if (!item) {
            return NextResponse.json({ error: '갤러리 항목을 찾을 수 없습니다' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: item });
    } catch (e) {
        console.error('GET /api/gallery/[id]', e);
        return NextResponse.json({ error: '갤러리 조회 실패' }, { status: 500 });
    }
}

// PUT /api/gallery/[id]  (Admin)
export async function PUT(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const { env } = getCloudflareContext();
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 });

        const admin = await requireAdminAuth(request, env.DB);
        if (admin instanceof Response) return admin;

        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            const body = await request.json() as {
                title?: string; description?: string; material?: string;
                print_method?: string; tags?: string; is_visible?: number; sort_order?: number;
                source_image_url?: string | null;
            };

            try {
                await env.DB.prepare(
                    `UPDATE gallery_items SET title=COALESCE(?,title), description=COALESCE(?,description),
                     material=COALESCE(?,material), print_method=COALESCE(?,print_method),
                     tags=COALESCE(?,tags), is_visible=COALESCE(?,is_visible),
                     sort_order=COALESCE(?,sort_order),
                     source_image_url=COALESCE(?,source_image_url),
                     updated_at=datetime('now')
                     WHERE id=? AND store_id=?`
                ).bind(
                    body.title ?? null, body.description ?? null, body.material ?? null,
                    body.print_method ?? null, body.tags ?? null,
                    body.is_visible ?? null, body.sort_order ?? null,
                    body.source_image_url ?? null,
                    parseInt(id), admin.storeId
                ).run();
            } catch (colErr: any) {
                if (colErr.message?.includes('source_image_url') || colErr.message?.includes('no such column')) {
                    await env.DB.prepare(
                        `UPDATE gallery_items SET title=COALESCE(?,title), description=COALESCE(?,description),
                         material=COALESCE(?,material), print_method=COALESCE(?,print_method),
                         tags=COALESCE(?,tags), is_visible=COALESCE(?,is_visible),
                         sort_order=COALESCE(?,sort_order), updated_at=datetime('now')
                         WHERE id=? AND store_id=?`
                    ).bind(
                        body.title ?? null, body.description ?? null, body.material ?? null,
                        body.print_method ?? null, body.tags ?? null,
                        body.is_visible ?? null, body.sort_order ?? null,
                        parseInt(id), admin.storeId
                    ).run();
                } else {
                    throw colErr;
                }
            }

            return NextResponse.json({ success: true });
        } else if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();

            const title = formData.has('title') ? (formData.get('title') as string).trim() : null;
            const description = formData.has('description') ? (formData.get('description') as string).trim() : null;
            const material = formData.has('material') ? (formData.get('material') as string).trim() : null;
            const printMethod = formData.has('print_method') ? (formData.get('print_method') as string).trim() : null;
            const tagsRaw = formData.has('tags') ? (formData.get('tags') as string).trim() : null;

            const sortOrderStr = formData.get('sort_order') as string;
            const sortOrder = sortOrderStr ? parseInt(sortOrderStr, 10) : null;
            const isVisibleStr = formData.get('is_visible') as string;
            const isVisible = isVisibleStr ? parseInt(isVisibleStr, 10) : null;

            const imageFile = formData.get('image') as File | null;
            const sourceImageFile = formData.get('source_image') as File | null;
            const clearSourceImage = formData.get('clear_source_image') === '1';

            let imageUrl = null;
            if (imageFile && env.BUCKET) {
                imageUrl = await uploadGalleryImage(env.BUCKET, imageFile);
            }

            let sourceImageUrl: string | null | undefined = undefined;
            if (clearSourceImage) {
                sourceImageUrl = null;
            } else if (sourceImageFile && env.BUCKET) {
                sourceImageUrl = await uploadGalleryImage(env.BUCKET, sourceImageFile, 'gallery/source');
            }

            try {
                await env.DB.prepare(
                    `UPDATE gallery_items SET title=COALESCE(?,title), description=COALESCE(?,description),
                     image_url=COALESCE(?,image_url),
                     source_image_url=CASE WHEN ? = 1 THEN NULL WHEN ? IS NOT NULL THEN ? ELSE source_image_url END,
                     material=COALESCE(?,material), print_method=COALESCE(?,print_method),
                     tags=COALESCE(?,tags), is_visible=COALESCE(?,is_visible),
                     sort_order=COALESCE(?,sort_order), updated_at=datetime('now')
                     WHERE id=? AND store_id=?`
                ).bind(
                    title, description, imageUrl,
                    clearSourceImage ? 1 : 0,
                    sourceImageUrl,
                    sourceImageUrl,
                    material, printMethod, tagsRaw,
                    Number.isNaN(isVisible) ? null : isVisible,
                    Number.isNaN(sortOrder) ? null : sortOrder,
                    parseInt(id), admin.storeId
                ).run();
            } catch (colErr: any) {
                if (colErr.message?.includes('source_image_url') || colErr.message?.includes('no such column')) {
                    await env.DB.prepare(
                        `UPDATE gallery_items SET title=COALESCE(?,title), description=COALESCE(?,description),
                         image_url=COALESCE(?,image_url),
                         material=COALESCE(?,material), print_method=COALESCE(?,print_method),
                         tags=COALESCE(?,tags), is_visible=COALESCE(?,is_visible),
                         sort_order=COALESCE(?,sort_order), updated_at=datetime('now')
                         WHERE id=? AND store_id=?`
                    ).bind(
                        title, description, imageUrl, material, printMethod, tagsRaw,
                        Number.isNaN(isVisible) ? null : isVisible,
                        Number.isNaN(sortOrder) ? null : sortOrder,
                        parseInt(id), admin.storeId
                    ).run();
                } else {
                    throw colErr;
                }
            }

            return NextResponse.json({ success: true, ...(imageUrl && { data: { imageUrl } }) });
        } else {
            return NextResponse.json({ error: '지원하지 않는 Content-Type' }, { status: 400 });
        }
    } catch (e) {
        console.error('PUT /api/gallery/[id]', e);
        return NextResponse.json({ error: '수정 실패' }, { status: 500 });
    }
}

// DELETE /api/gallery/[id]  (Admin)
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const { env } = getCloudflareContext();
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 });

        const admin = await requireAdminAuth(request, env.DB);
        if (admin instanceof Response) return admin;

        await env.DB.prepare(
            `DELETE FROM gallery_items WHERE id=? AND store_id=?`
        ).bind(parseInt(id), admin.storeId).run();

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('DELETE /api/gallery/[id]', e);
        return NextResponse.json({ error: '삭제 실패' }, { status: 500 });
    }
}