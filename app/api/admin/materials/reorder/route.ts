import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/api-utils';

export async function PUT(req: NextRequest) {
    const { env } = getCloudflareContext();
    if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 });

    const auth = await requireAdminAuth(req, env.DB);
    if (auth instanceof Response) return auth;
    const { storeId } = auth;

    try {
        const body = await req.json();
        const { orderedIds } = body as { orderedIds: number[] };

        if (!orderedIds || !Array.isArray(orderedIds)) {
            return NextResponse.json({ error: '유효한 아이디 배열이 필요합니다.' }, { status: 400 });
        }

        // D1은 batch update를 지원하므로 순서대로 저장
        const stmts = orderedIds.map((id, index) =>
            env.DB.prepare('UPDATE materials SET sort_order = ? WHERE id = ? AND store_id = ?').bind(index, id, storeId)
        );

        await env.DB.batch(stmts);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('PUT /api/admin/materials/reorder', error);
        return NextResponse.json({ error: '순서 변경에 실패했습니다.' }, { status: 500 });
    }
}
