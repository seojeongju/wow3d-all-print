import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';
import { isShowcaseSlug, parseFeaturesJson } from '@/lib/showcase';

/** 관리자: 카테고리별 예시 목록 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        if (!isShowcaseSlug(slug)) {
            return NextResponse.json({ error: '알 수 없는 카테고리' }, { status: 400 });
        }

        const { env } = getCloudflareContext();
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 });

        const admin = await requireAdminAuth(request, env.DB);
        if (admin instanceof Response) return admin;

        const rows = await env.DB.prepare(
            `SELECT id, title, description, features_json, sort_order, is_visible, created_at
             FROM showcase_examples
             WHERE store_id = ? AND category_slug = ?
             ORDER BY sort_order ASC, id ASC`
        )
            .bind(admin.storeId, slug)
            .all();

        const items = ((rows.results as Record<string, unknown>[]) || []).map((ex) => ({
            id: ex.id as number,
            title: ex.title as string,
            description: (ex.description as string) || '',
            features: parseFeaturesJson(ex.features_json as string | null),
            sort_order: ex.sort_order as number,
            is_visible: (ex.is_visible as number) === 1,
            created_at: ex.created_at as string,
        }));

        return NextResponse.json({ success: true, data: { items } });
    } catch (e) {
        console.error('GET admin showcase examples', e);
        return NextResponse.json({ error: '목록 조회 실패' }, { status: 500 });
    }
}

/** 관리자: 예시 추가 */
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
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 });

        const admin = await requireAdminAuth(request, env.DB);
        if (admin instanceof Response) return admin;

        const body = (await request.json()) as {
            title?: string;
            description?: string;
            features?: string[];
            sort_order?: number;
            is_visible?: boolean;
        };

        const title = (body.title || '').trim();
        if (!title) return NextResponse.json({ error: '제목은 필수입니다' }, { status: 400 });

        const description = typeof body.description === 'string' ? body.description.trim() : '';
        const featuresJson =
            Array.isArray(body.features) && body.features.length
                ? JSON.stringify(body.features.filter((x) => typeof x === 'string' && x.trim()))
                : null;
        const sortOrder = Number.isFinite(body.sort_order) ? Math.floor(body.sort_order!) : 0;
        const isVisible = body.is_visible !== false ? 1 : 0;

        const result = await env.DB.prepare(
            `INSERT INTO showcase_examples (store_id, category_slug, title, description, features_json, sort_order, is_visible, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
        )
            .bind(admin.storeId, slug, title, description || null, featuresJson, sortOrder, isVisible)
            .run();

        const newId = (result.meta as { last_row_id?: number })?.last_row_id;
        return NextResponse.json({ success: true, data: { id: newId } }, { status: 201 });
    } catch (e) {
        console.error('POST admin showcase examples', e);
        return NextResponse.json({ error: '등록 실패 (마이그레이션 적용 여부 확인)' }, { status: 500 });
    }
}
