import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { processInquiryEmailReply } from '@/lib/inquiry-email-reply';

/**
 * POST /api/internal/inquiry-email-reply
 * Cloudflare Email Routing → Worker에서 호출 (관리자 메일 답장 처리)
 */
export async function POST(req: NextRequest) {
    const { env } = getCloudflareContext();
    if (!env?.DB) {
        return NextResponse.json({ error: 'DB not available' }, { status: 503 });
    }

    const envRecord = env as unknown as Record<string, unknown>;
    const secret =
        req.headers.get('x-inquiry-email-secret') ||
        req.headers.get('x-cron-secret') ||
        '';
    const expected =
        envRecord.INQUIRY_EMAIL_SECRET ||
        envRecord.CRON_SECRET ||
        process.env.INQUIRY_EMAIL_SECRET ||
        process.env.CRON_SECRET ||
        '';

    if (!expected || secret !== expected) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: {
        inquiryId?: number;
        token?: string;
        replyMessage?: string;
        fromEmail?: string;
    } = {};
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const inquiryId = Number(body.inquiryId);
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    const replyMessage = typeof body.replyMessage === 'string' ? body.replyMessage : '';
    const fromEmail = typeof body.fromEmail === 'string' ? body.fromEmail : '';

    if (!Number.isInteger(inquiryId) || inquiryId < 1 || !token || !fromEmail) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const result = await processInquiryEmailReply(env.DB, envRecord, {
        inquiryId,
        token,
        replyMessage,
        fromEmail,
    });

    if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
        success: true,
        userNotified: result.userNotified,
        alreadyReplied: result.alreadyReplied,
    });
}
