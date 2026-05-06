import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
    const { env } = getCloudflareContext();
    if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 });

    const auth = await requireAdminAuth(req, env.DB);
    if (auth instanceof Response) return auth;
    const { storeId } = auth;

    try {
        const result = await env.DB.prepare(
            'SELECT * FROM email_templates WHERE store_id = ? ORDER BY id DESC'
        ).bind(storeId).all();
        return NextResponse.json({ success: true, data: result.results || [] });
    } catch (e) {
        console.error('GET /api/admin/email-templates', e);
        return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const { env } = getCloudflareContext();
    if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 });

    const auth = await requireAdminAuth(req, env.DB);
    if (auth instanceof Response) return auth;
    const { storeId } = auth;

    try {
        const body = await req.json();
        const { name, subject, html_content, text_content } = body;

        if (!name || !subject) {
            return NextResponse.json({ error: 'Name and subject are required' }, { status: 400 });
        }

        const result = await env.DB.prepare(`
            INSERT INTO email_templates (store_id, name, subject, html_content, text_content)
            VALUES (?, ?, ?, ?, ?)
            RETURNING *
        `).bind(storeId, name.trim(), subject.trim(), html_content || null, text_content || null).first();

        return NextResponse.json({ success: true, data: result });
    } catch (e) {
        console.error('POST /api/admin/email-templates', e);
        return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }
}
