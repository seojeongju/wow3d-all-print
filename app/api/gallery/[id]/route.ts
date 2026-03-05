import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

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
            };

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

            let imageUrl = null;
            if (imageFile && env.BUCKET) {
                const ext = imageFile.name.split('.').pop() || 'jpg';
                const r2Key = `gallery/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
                const buf = await imageFile.arrayBuffer();
                await env.BUCKET.put(r2Key, buf, {
                    httpMetadata: { contentType: imageFile.type || 'image/jpeg' },
                });
                imageUrl = r2Key;
            }

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
