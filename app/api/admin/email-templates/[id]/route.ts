import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const { env } = getCloudflareContext();
    if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 });

    const auth = await requireAdminAuth(req, env.DB);
    if (auth instanceof Response) return auth;
    const { storeId } = auth;

    const numId = parseInt(id, 10);
    if (!Number.isInteger(numId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    try {
        const body = await req.json();
        const { name, subject, html_content, text_content } = body;

        if (!name || !subject) {
            return NextResponse.json({ error: 'Name and subject are required' }, { status: 400 });
        }

        const result = await env.DB.prepare(`
            UPDATE email_templates 
            SET name = ?, subject = ?, html_content = ?, text_content = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND store_id = ?
            RETURNING *
        `).bind(name.trim(), subject.trim(), html_content || null, text_content || null, numId, storeId).first();

        if (!result) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: result });
    } catch (e) {
        console.error('PUT /api/admin/email-templates/[id]', e);
        return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const { env } = getCloudflareContext();
    if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 });

    const auth = await requireAdminAuth(req, env.DB);
    if (auth instanceof Response) return auth;
    const { storeId } = auth;

    const numId = parseInt(id, 10);
    if (!Number.isInteger(numId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    try {
        const result = await env.DB.prepare(`
            DELETE FROM email_templates 
            WHERE id = ? AND store_id = ?
        `).bind(numId, storeId).run();

        if (result.meta.changes === 0) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('DELETE /api/admin/email-templates/[id]', e);
        return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
    }
}
