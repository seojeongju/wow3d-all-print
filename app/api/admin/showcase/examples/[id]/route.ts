import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';
import { parseFeaturesJson, showcaseMediaUrlFromKey } from '@/lib/showcase';

async function assertExampleOwner(
    db: { prepare: (sql: string) => { bind: (...args: unknown[]) => { first: <T>() => Promise<T | null> } } },
    storeId: number,
    id: number
): Promise<{ id: number; category_slug: string } | null> {
    const row = await db
        .prepare(`SELECT id, category_slug FROM showcase_examples WHERE id = ? AND store_id = ?`)
        .bind(id, storeId)
        .first<{ id: number; category_slug: string }>();
    return row || null;
}

/** 관리자: 예시 수정 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr, 10);
        if (!Number.isFinite(id)) return NextResponse.json({ error: '잘못된 ID' }, { status: 400 });

        const { env } = getCloudflareContext();
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 });

        const admin = await requireAdminAuth(request, env.DB);
        if (admin instanceof Response) return admin;

        const ex = await assertExampleOwner(env.DB, admin.storeId, id);
        if (!ex) return NextResponse.json({ error: '찾을 수 없음' }, { status: 404 });

        const body = (await request.json()) as {
            title?: string;
            description?: string;
            features?: string[];
            sort_order?: number;
            is_visible?: boolean;
        };

        const title = typeof body.title === 'string' ? body.title.trim() : undefined;
        if (title !== undefined && !title) {
            return NextResponse.json({ error: '제목은 비울 수 없습니다' }, { status: 400 });
        }

        const cur = await env.DB.prepare(
            `SELECT title, description, features_json, sort_order, is_visible FROM showcase_examples WHERE id = ?`
        )
            .bind(id)
            .first<{
                title: string;
                description: string | null;
                features_json: string | null;
                sort_order: number;
                is_visible: number;
            }>();

        if (!cur) return NextResponse.json({ error: '찾을 수 없음' }, { status: 404 });

        const nextTitle = title ?? cur.title;
        const nextDesc =
            typeof body.description === 'string' ? body.description.trim() : (cur.description ?? '');
        let nextFeatures = cur.features_json;
        if (Array.isArray(body.features)) {
            nextFeatures =
                body.features.length > 0
                    ? JSON.stringify(body.features.filter((x) => typeof x === 'string' && x.trim()))
                    : null;
        }
        const nextSort =
            typeof body.sort_order === 'number' && Number.isFinite(body.sort_order)
                ? Math.floor(body.sort_order)
                : cur.sort_order;
        const nextVis =
            typeof body.is_visible === 'boolean' ? (body.is_visible ? 1 : 0) : cur.is_visible;

        await env.DB.prepare(
            `UPDATE showcase_examples SET title = ?, description = ?, features_json = ?, sort_order = ?, is_visible = ?, updated_at = datetime('now')
             WHERE id = ? AND store_id = ?`
        )
            .bind(nextTitle, nextDesc || null, nextFeatures, nextSort, nextVis, id, admin.storeId)
            .run();

        return NextResponse.json({
            success: true,
            data: {
                id,
                title: nextTitle,
                description: nextDesc,
                features: parseFeaturesJson(nextFeatures),
                sort_order: nextSort,
                is_visible: nextVis === 1,
            },
        });
    } catch (e) {
        console.error('PUT showcase example', e);
        return NextResponse.json({ error: '수정 실패' }, { status: 500 });
    }
}

/** 관리자: 예시 삭제 (미디어 R2 포함) */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr, 10);
        if (!Number.isFinite(id)) return NextResponse.json({ error: '잘못된 ID' }, { status: 400 });

        const { env } = getCloudflareContext();
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 });

        const admin = await requireAdminAuth(request, env.DB);
        if (admin instanceof Response) return admin;

        const ex = await assertExampleOwner(env.DB, admin.storeId, id);
        if (!ex) return NextResponse.json({ error: '찾을 수 없음' }, { status: 404 });

        const mediaRows = await env.DB.prepare(`SELECT r2_key FROM showcase_example_media WHERE example_id = ?`)
            .bind(id)
            .all();

        if (env.BUCKET) {
            for (const m of (mediaRows.results as { r2_key: string }[]) || []) {
                try {
                    await env.BUCKET.delete(m.r2_key);
                } catch {
                    /* ignore */
                }
            }
        }

        await env.DB.prepare(`DELETE FROM showcase_example_media WHERE example_id = ?`).bind(id).run();
        await env.DB.prepare(`DELETE FROM showcase_examples WHERE id = ? AND store_id = ?`)
            .bind(id, admin.storeId)
            .run();

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('DELETE showcase example', e);
        return NextResponse.json({ error: '삭제 실패' }, { status: 500 });
    }
}
