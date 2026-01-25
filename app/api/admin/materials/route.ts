import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest, NextResponse } from 'next/server';
import { materialsErrorResponse } from '@/lib/materials-api';

export async function GET(req: NextRequest) {
    const { env } = getCloudflareContext();
    if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 });
    try {
        const { results } = await env.DB.prepare(
            "SELECT * FROM materials ORDER BY type, name"
        ).all();

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
    try {
        const body = await req.json() as any;
        const { name, type, pricePerGram, density, colors, description } = body;
        const allowedTypes = ['FDM', 'SLA', 'DLP'];
        const safeType = allowedTypes.includes(String(type || '').toUpperCase()) ? String(type).toUpperCase() : 'FDM';

        const result = await env.DB.prepare(
            `INSERT INTO materials (name, type, price_per_gram, density, colors, description) 
             VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(name, safeType, pricePerGram, density, JSON.stringify(colors || ['#FFFFFF']), description || null).run();

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
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await env.DB.prepare(
            "DELETE FROM materials WHERE id = ?"
        ).bind(id).run();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DELETE /api/admin/materials', error);
        const { body, status } = materialsErrorResponse(error, 'Failed to delete material');
        return NextResponse.json(body, { status });
    }
}
