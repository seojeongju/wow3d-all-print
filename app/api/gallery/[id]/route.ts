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
