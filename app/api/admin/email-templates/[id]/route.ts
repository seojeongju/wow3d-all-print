import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';
import {
    DEFAULT_QUOTATION_TEMPLATE_ID,
    DEFAULT_QUOTATION_TEMPLATE_KEY,
    isDefaultQuotationTemplateId,
} from '@/lib/email-template-defaults';

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
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

        if (isDefaultQuotationTemplateId(id)) {
            try {
                const result = await env.DB.prepare(`
                    INSERT INTO email_templates (store_id, name, subject, html_content, text_content, template_key, is_system)
                    VALUES (?, ?, ?, ?, ?, ?, 1)
                    ON CONFLICT(store_id, template_key)
                    DO UPDATE SET
                        name = excluded.name,
                        subject = excluded.subject,
                        html_content = excluded.html_content,
                        text_content = excluded.text_content,
                        updated_at = CURRENT_TIMESTAMP
                    RETURNING *
                `).bind(
                    storeId,
                    name.trim(),
                    subject.trim(),
                    html_content || null,
                    text_content || null,
                    DEFAULT_QUOTATION_TEMPLATE_KEY
                ).first();
                return NextResponse.json({ success: true, data: result });
            } catch {
                const existing = await env.DB.prepare(
                    'SELECT id FROM email_templates WHERE store_id = ? AND template_key = ? LIMIT 1'
                ).bind(storeId, DEFAULT_QUOTATION_TEMPLATE_KEY).first() as { id?: number } | null;

                if (existing?.id) {
                    const result = await env.DB.prepare(`
                        UPDATE email_templates
                        SET name = ?, subject = ?, html_content = ?, text_content = ?, template_key = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ? AND store_id = ?
                        RETURNING *
                    `).bind(
                        name.trim(),
                        subject.trim(),
                        html_content || null,
                        text_content || null,
                        DEFAULT_QUOTATION_TEMPLATE_KEY,
                        existing.id,
                        storeId
                    ).first();
                    return NextResponse.json({ success: true, data: result });
                }

                const result = await env.DB.prepare(`
                    INSERT INTO email_templates (store_id, name, subject, html_content, text_content)
                    VALUES (?, ?, ?, ?, ?)
                    RETURNING *
                `).bind(storeId, name.trim(), subject.trim(), html_content || null, text_content || null).first() as Record<string, unknown> | null;

                if (result?.id) {
                    try {
                        await env.DB.prepare(
                            'UPDATE email_templates SET template_key = ?, is_system = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND store_id = ?'
                        ).bind(DEFAULT_QUOTATION_TEMPLATE_KEY, result.id, storeId).run();
                    } catch { /* ignore old schema fallback */ }
                }
                return NextResponse.json({ success: true, data: result });
            }
        }

        const numId = parseInt(id, 10);
        if (!Number.isInteger(numId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

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

    if (id === DEFAULT_QUOTATION_TEMPLATE_ID) {
        return NextResponse.json({ error: '기본 템플릿은 삭제할 수 없습니다' }, { status: 400 });
    }

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
