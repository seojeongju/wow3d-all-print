import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';
import {
    extFromFile,
    showcaseMediaUrlFromKey,
    validateShowcaseUpload,
} from '@/lib/showcase';

/** 관리자: 예시에 미디어(이미지/영상) 추가 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const exampleId = parseInt(idStr, 10);
        if (!Number.isFinite(exampleId)) return NextResponse.json({ error: '잘못된 ID' }, { status: 400 });

        const { env } = getCloudflareContext();
        if (!env?.DB || !env.BUCKET) {
            return NextResponse.json({ error: 'DB 또는 R2 없음' }, { status: 503 });
        }

        const admin = await requireAdminAuth(request, env.DB);
        if (admin instanceof Response) return admin;

        const ex = await env.DB.prepare(`SELECT id FROM showcase_examples WHERE id = ? AND store_id = ?`)
            .bind(exampleId, admin.storeId)
            .first<{ id: number }>();
        if (!ex) return NextResponse.json({ error: '예시를 찾을 수 없습니다' }, { status: 404 });

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const kindRaw = (formData.get('kind') as string | null)?.toLowerCase() || 'image';
        const kind = kindRaw === 'video' ? 'video' : 'image';

        if (!file) return NextResponse.json({ error: '파일이 필요합니다' }, { status: 400 });

        const err = validateShowcaseUpload(kind, file);
        if (err) return NextResponse.json({ error: err }, { status: 400 });

        const ext = extFromFile(file, kind);
        const r2Key = `showcase/${admin.storeId}/examples/${exampleId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const buf = await file.arrayBuffer();
        await env.BUCKET.put(r2Key, buf, {
            httpMetadata: { contentType: file.type || (kind === 'video' ? 'video/mp4' : 'image/jpeg') },
        });

        const maxSort = await env.DB.prepare(
            `SELECT COALESCE(MAX(sort_order), -1) as m FROM showcase_example_media WHERE example_id = ?`
        )
            .bind(exampleId)
            .first<{ m: number }>();
        const sortOrder = (maxSort?.m ?? -1) + 1;

        const ins = await env.DB.prepare(
            `INSERT INTO showcase_example_media (example_id, kind, r2_key, mime_type, sort_order)
             VALUES (?, ?, ?, ?, ?)`
        )
            .bind(exampleId, kind, r2Key, file.type || null, sortOrder)
            .run();

        const mediaId = (ins.meta as { last_row_id?: number })?.last_row_id;

        return NextResponse.json(
            {
                success: true,
                data: {
                    id: mediaId,
                    kind,
                    r2_key: r2Key,
                    url: showcaseMediaUrlFromKey(r2Key),
                    mime_type: file.type || null,
                    sort_order: sortOrder,
                },
            },
            { status: 201 }
        );
    } catch (e) {
        console.error('POST showcase example media', e);
        return NextResponse.json({ error: '업로드 실패' }, { status: 500 });
    }
}

/** 관리자: 예시 미디어 목록 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const exampleId = parseInt(idStr, 10);
        if (!Number.isFinite(exampleId)) return NextResponse.json({ error: '잘못된 ID' }, { status: 400 });

        const { env } = getCloudflareContext();
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 });

        const admin = await requireAdminAuth(request, env.DB);
        if (admin instanceof Response) return admin;

        const ex = await env.DB.prepare(`SELECT id FROM showcase_examples WHERE id = ? AND store_id = ?`)
            .bind(exampleId, admin.storeId)
            .first<{ id: number }>();
        if (!ex) return NextResponse.json({ error: '예시를 찾을 수 없습니다' }, { status: 404 });

        const res = await env.DB.prepare(
            `SELECT id, kind, r2_key, mime_type, sort_order FROM showcase_example_media WHERE example_id = ? ORDER BY sort_order ASC, id ASC`
        )
            .bind(exampleId)
            .all();

        const items = ((res.results as Record<string, unknown>[]) || []).map((m) => ({
            id: m.id as number,
            kind: m.kind as string,
            r2_key: m.r2_key as string,
            url: showcaseMediaUrlFromKey(String(m.r2_key)),
            mime_type: (m.mime_type as string) || null,
            sort_order: m.sort_order as number,
        }));

        return NextResponse.json({ success: true, data: { items } });
    } catch (e) {
        console.error('GET showcase example media', e);
        return NextResponse.json({ error: '조회 실패' }, { status: 500 });
    }
}
