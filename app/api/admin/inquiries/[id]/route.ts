import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

const ALLOWED_STATUS = ['new', 'read', 'replied', 'closed'];

/**
 * PATCH /api/admin/inquiries/[id] - 문의 상태·메모 변경
 * Body: { status?: string, admin_note?: string }
 */
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { env } = getCloudflareContext();
  if (!env?.DB) {
    return NextResponse.json({ error: 'DB not available' }, { status: 503 });
  }

  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  try {
    const body = (await req.json()) as { status?: string; admin_note?: string };
    const status = typeof body?.status === 'string' && ALLOWED_STATUS.includes(body.status) ? body.status : null;
    const adminNote = typeof body?.admin_note === 'string' ? body.admin_note : null;

    if (status !== null && adminNote !== null) {
      await env.DB.prepare(
        `UPDATE inquiries SET status = ?, admin_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      )
        .bind(status, adminNote, numId)
        .run();
    } else if (status !== null) {
      await env.DB.prepare(`UPDATE inquiries SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .bind(status, numId)
        .run();
    } else if (adminNote !== null) {
      await env.DB.prepare(`UPDATE inquiries SET admin_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .bind(adminNote, numId)
        .run();
    } else {
      return NextResponse.json({ error: 'status or admin_note required' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('PATCH /api/admin/inquiries/[id]', e);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
