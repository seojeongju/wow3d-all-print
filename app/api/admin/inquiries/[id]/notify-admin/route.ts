import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';
import { notifyAdminNewInquiry } from '@/lib/inquiry-admin-notify';
import { findInquiryForStore, recordAdminNotifyResult } from '@/lib/inquiry-replies';

/**
 * POST /api/admin/inquiries/[id]/notify-admin - 관리자 알림 메일 재발송
 * 누락된 알림을 다시 받아 「메일 답장」으로 답변할 수 있게 한다.
 */
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const { env } = getCloudflareContext();
    if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 });

    const inquiryId = parseInt(id, 10);
    if (!Number.isInteger(inquiryId) || inquiryId < 1) {
        return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const auth = await requireAdminAuth(req, env.DB);
    if (auth instanceof Response) return auth;

    try {
        const row = await findInquiryForStore(env.DB, inquiryId, auth.storeId);
        if (!row) return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });

        const envRecord = env as unknown as Record<string, unknown>;
        const isExpert = row.category === 'development';
        const result = await notifyAdminNewInquiry(
            {
                inquiryId,
                name: String(row.name || ''),
                email: String(row.email || ''),
                phone: (row.phone as string | null) ?? null,
                category: (row.category as string | null) ?? null,
                categoryLabel: isExpert ? '전문가 제품개발' : undefined,
                subject: (row.subject as string | null) ?? null,
                message: String(row.message || ''),
                fileUrl: (row.file_url as string | null) ?? null,
                source: isExpert ? 'expert' : 'contact',
                replyToken: (row.reply_token as string | null) ?? null,
                resend: true,
            },
            envRecord,
            env.DB
        );
        await recordAdminNotifyResult(env.DB, inquiryId, result);

        if (!result.ok) {
            return NextResponse.json({ success: false, error: result.error }, { status: 502 });
        }
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('POST /api/admin/inquiries/[id]/notify-admin', e);
        return NextResponse.json({ error: '관리자 알림 재발송 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
