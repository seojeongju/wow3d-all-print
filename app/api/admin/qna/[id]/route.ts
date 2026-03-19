import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { env } = getCloudflareContext();
    if (!env?.DB) return Response.json({ error: 'DB not available' }, { status: 503 });

    const auth = await requireAdminAuth(req, env.DB);
    if (auth instanceof Response) return auth;
    const { storeId } = auth;

    const body = await req.json();
    const { question, answer, category, is_published, display_order } = body;

    // Build update statement dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (question !== undefined) { updates.push('question = ?'); values.push(question); }
    if (answer !== undefined) { updates.push('answer = ?'); values.push(answer); }
    if (category !== undefined) { updates.push('category = ?'); values.push(category); }
    if (is_published !== undefined) { updates.push('is_published = ?'); values.push(is_published ? 1 : 0); }
    if (display_order !== undefined) { updates.push('display_order = ?'); values.push(display_order); }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');

    if (updates.length === 0) return Response.json({ error: 'No fields to update' }, { status: 400 });

    const query = `UPDATE qna SET ${updates.join(', ')} WHERE id = ? AND store_id = ?`;
    values.push(params.id, storeId);

    const { success } = await env.DB.prepare(query).bind(...values).run();

    return Response.json({ success: true });
  } catch (e) {
    console.error('PATCH /api/admin/qna/[id]', e);
    return Response.json({ error: 'Failed to update Q&A' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { env } = getCloudflareContext();
    if (!env?.DB) return Response.json({ error: 'DB not available' }, { status: 503 });

    const auth = await requireAdminAuth(req, env.DB);
    if (auth instanceof Response) return auth;
    const { storeId } = auth;

    const { success } = await env.DB.prepare(
      `DELETE FROM qna WHERE id = ? AND store_id = ?`
    ).bind(params.id, storeId).run();

    return Response.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/admin/qna/[id]', e);
    return Response.json({ error: 'Failed to delete Q&A' }, { status: 500 });
  }
}
