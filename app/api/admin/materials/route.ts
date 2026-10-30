import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest, NextResponse } from 'next/server';
import { materialsErrorResponse } from '@/lib/materials-api';
import { requireAdminAuth } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
    const { env } = getCloudflareContext();
    if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 });

    // 인증 및 store_id 획득
    const auth = await requireAdminAuth(req, env.DB);
    if (auth instanceof Response) return auth;
    const { storeId } = auth;

    try {
        const { results } = await env.DB.prepare(
            "SELECT * FROM materials WHERE store_id = ? ORDER BY type ASC, sort_order ASC, name ASC"
        ).bind(storeId).all();

        return NextResponse.json({ success: true, data: results });
    } catch (error) {
        console.error('GET /api/admin/materials', error);
        const { body, status } = materialsErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}

export async function POST(req: NextRequest) {
    const { env } = getCloudflareContext();
    if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 });

    const auth = await requireAdminAuth(req, env.DB);
    if (auth instanceof Response) return auth;
    const { storeId } = auth;

    try {
        const body = await req.json() as any;
        const { name, type, pricePerGram, pricePerMl, density, colors, description } = body;
        // 장비(출력방식) type과 맞춘다. 없으면 FDM/SLA/DLP·등록된 장비 코드만 허용
        const rawType = String(type || 'FDM').trim().toUpperCase();
        let safeType = rawType;
        if (!/^[A-Z][A-Z0-9_-]{1,15}$/.test(rawType)) safeType = 'FDM';
        else if (!['FDM', 'SLA', 'DLP'].includes(rawType)) {
            const exists = await env.DB.prepare(
                'SELECT 1 AS ok FROM printer_equipment WHERE store_id = ? AND UPPER(type) = ? LIMIT 1'
            )
                .bind(storeId, rawType)
                .first<{ ok?: number }>();
            if (!exists) {
                return NextResponse.json(
                    { error: `출력방식 "${rawType}" 장비가 없습니다. 먼저 장비 설정에서 추가하세요.` },
                    { status: 400 }
                );
            }
        }
        const pricePerMlVal = (pricePerMl != null && pricePerMl !== '') ? Number(pricePerMl) : null;

        const result = await env.DB.prepare(
            `INSERT INTO materials (name, type, price_per_gram, price_per_ml, density, colors, description, is_active, store_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`
        ).bind(name, safeType, pricePerGram, pricePerMlVal, density, JSON.stringify(colors || ['#FFFFFF']), description || null, storeId).run();

        return NextResponse.json({ success: true, id: result.meta.last_row_id });
    } catch (error) {
        console.error('POST /api/admin/materials', error);
        const { body, status } = materialsErrorResponse(error, 'Failed to create material');
        return NextResponse.json(body, { status });
    }
}

export async function DELETE(req: NextRequest) {
    const { env } = getCloudflareContext();
    if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 });

    const auth = await requireAdminAuth(req, env.DB);
    if (auth instanceof Response) return auth;
    const { storeId } = auth;

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        // 내 스토어의 재료인지 확인 후 삭제
        await env.DB.prepare(
            "DELETE FROM materials WHERE id = ? AND store_id = ?"
        ).bind(id, storeId).run();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DELETE /api/admin/materials', error);
        const { body, status } = materialsErrorResponse(error, 'Failed to delete material');
        return NextResponse.json(body, { status });
    }
}
