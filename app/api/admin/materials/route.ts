import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { env } = getCloudflareContext();
    try {
        const { results } = await env.DB.prepare(
            "SELECT * FROM materials ORDER BY type, name"
        ).all();

        return NextResponse.json({ success: true, data: results });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const { env } = getCloudflareContext();
    try {
        const body = await req.json() as any;
        const { name, type, pricePerGram, density, colors } = body;

        const result = await env.DB.prepare(
            `INSERT INTO materials (name, type, price_per_gram, density, colors) 
             VALUES (?, ?, ?, ?, ?)`
        ).bind(name, type, pricePerGram, density, JSON.stringify(colors)).run();

        return NextResponse.json({ success: true, id: result.meta.last_row_id });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create material' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const { env } = getCloudflareContext();
    try {
        // Extract ID from query params since 'DELETE' with body is sometimes problematic or we can use dynamic route
        // But for simplicity using searchParams ?id=123
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await env.DB.prepare(
            "DELETE FROM materials WHERE id = ?"
        ).bind(id).run();

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete material' }, { status: 500 });
    }
}
