import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
    try {
        const { env } = getCloudflareContext();
        if (!env?.DB) {
            return NextResponse.json({ error: 'DB를 사용할 수 없습니다' }, { status: 503 });
        }

        const admin = await requireAdminAuth(request, env.DB);
        if (admin instanceof Response) return admin;

        const url = new URL(request.url);
        const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
        const limit = Math.min(50, Math.max(10, parseInt(url.searchParams.get('limit') || '20')));
        const offset = (page - 1) * limit;

        let items: any[] = [];
        let total = 0;
        try {
            const [rows, countRow] = await Promise.all([
                env.DB.prepare(
                    `SELECT * FROM gallery_items
                     WHERE store_id = ?
                     ORDER BY sort_order DESC, created_at DESC
                     LIMIT ? OFFSET ?`
                ).bind(admin.storeId, limit, offset).all(),
                env.DB.prepare(
                    `SELECT COUNT(*) as cnt FROM gallery_items WHERE store_id = ?`
                ).bind(admin.storeId).first<{ cnt: number }>(),
            ]);
            items = (rows.results as any[]) ?? [];
            total = countRow?.cnt ?? 0;
        } catch (e) {
            console.error('Gallery items fetch failed (table might not exist)', e);
        }

        return NextResponse.json({
            success: true,
            data: {
                items,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page * limit < total,
                },
            },
        });
    } catch (e) {
        console.error('GET /api/admin/gallery', e);
        return NextResponse.json({ error: '갤러리 관리 목록 조회 실패' }, { status: 500 });
    }
}
