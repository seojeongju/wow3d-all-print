import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';

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

  // 인증 및 store_id 획득
  const auth = await requireAdminAuth(req, env.DB);
  if (auth instanceof Response) return auth;
  const { storeId } = auth;

  try {
    // 해당 문의가 이 스토어 소속인지 확인
    const check = await env.DB.prepare('SELECT id FROM inquiries WHERE id = ? AND store_id = ?')
      .bind(numId, storeId).first();
    if (!check) {
      return NextResponse.json({ error: 'Inquiry not found or access denied' }, { status: 404 });
    }

    const body = (await req.json()) as { status?: string; admin_note?: string };
    const status = typeof body?.status === 'string' && ALLOWED_STATUS.includes(body.status) ? body.status : null;
    const adminNote = typeof body?.admin_note === 'string' ? body.admin_note : null;

    if (status !== null && adminNote !== null) {
      await env.DB.prepare(
        `UPDATE inquiries SET status = ?, admin_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND store_id = ?`
      )
        .bind(status, adminNote, numId, storeId)
        .run();
    } else if (status !== null) {
      await env.DB.prepare(`UPDATE inquiries SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND store_id = ?`)
        .bind(status, numId, storeId)
        .run();
    } else if (adminNote !== null) {
      await env.DB.prepare(`UPDATE inquiries SET admin_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND store_id = ?`)
        .bind(adminNote, numId, storeId)
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
