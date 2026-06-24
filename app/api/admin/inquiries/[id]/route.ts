import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';
import { notifyUserInquiryReplied } from '@/lib/inquiry-user-notify';

const ALLOWED_STATUS = ['new', 'read', 'replied', 'closed'];
const STORE_INQUIRIES = '(store_id = ? OR store_id IS NULL)';

function isMissingStoreIdColumn(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /no such column:\s*store_id/i.test(msg);
}

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
    const body = (await req.json()) as { status?: string; admin_note?: string };
    const status = typeof body?.status === 'string' && ALLOWED_STATUS.includes(body.status) ? body.status : null;
    const adminNote = typeof body?.admin_note === 'string' ? body.admin_note : null;

    if (status === null && adminNote === null) {
      return NextResponse.json({ error: 'status or admin_note required' }, { status: 400 });
    }

    const runUpdate = async (useStoreScope: boolean) => {
      const whereId = useStoreScope ? `id = ? AND ${STORE_INQUIRIES}` : 'id = ?';
      const idBinds = useStoreScope ? [numId, storeId] : [numId];

      if (status !== null && adminNote !== null) {
        await env.DB.prepare(
          `UPDATE inquiries SET status = ?, admin_note = ?, updated_at = CURRENT_TIMESTAMP WHERE ${whereId}`
        )
          .bind(status, adminNote, ...idBinds)
          .run();
      } else if (status !== null) {
        await env.DB.prepare(
          `UPDATE inquiries SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE ${whereId}`
        )
          .bind(status, ...idBinds)
          .run();
      } else if (adminNote !== null) {
        await env.DB.prepare(
          `UPDATE inquiries SET admin_note = ?, updated_at = CURRENT_TIMESTAMP WHERE ${whereId}`
        )
          .bind(adminNote, ...idBinds)
          .run();
      }
    };

    let existingInquiry: any = null;
    let useStoreScope = true;

    try {
      existingInquiry = await env.DB.prepare(
        `SELECT name, email, subject, message, status, admin_note FROM inquiries WHERE id = ? AND ${STORE_INQUIRIES}`
      )
        .bind(numId, storeId)
        .first();
      if (!existingInquiry) {
        return NextResponse.json({ error: 'Inquiry not found or access denied' }, { status: 404 });
      }
    } catch (e) {
      if (!isMissingStoreIdColumn(e)) throw e;
      useStoreScope = false;
      existingInquiry = await env.DB.prepare('SELECT name, email, subject, message, status, admin_note FROM inquiries WHERE id = ?')
        .bind(numId)
        .first();
      if (!existingInquiry) {
        return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
      }
    }

    await runUpdate(useStoreScope);

    // 문의 답변 완료 메일 전송 트리거
    const finalStatus = status !== null ? status : existingInquiry.status;
    const finalAdminNote = adminNote !== null ? adminNote : existingInquiry.admin_note;
    const isRepliedNow = finalStatus === 'replied';
    const noteChanged = adminNote !== null && adminNote !== existingInquiry.admin_note;
    const statusChangedToReplied = status !== null && status === 'replied' && existingInquiry.status !== 'replied';

    if (isRepliedNow && finalAdminNote && (statusChangedToReplied || noteChanged)) {
      try {
        await notifyUserInquiryReplied(
          {
            inquiryId: numId,
            name: existingInquiry.name,
            email: existingInquiry.email,
            subject: existingInquiry.subject,
            message: existingInquiry.message,
            replyMessage: finalAdminNote,
          },
          env as any
        );
      } catch (mailErr) {
        console.error('Failed to send inquiry reply notification email:', mailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error('PATCH /api/admin/inquiries/[id]', e);
    return NextResponse.json({ error: 'Failed to update', detail }, { status: 500 });
  }
}
