import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { processAutoOrderStatusTransitions } from '@/lib/order-auto-status';

function isAuthorizedCron(req: NextRequest, envSecret?: string): boolean {
    const headerSecret = req.headers.get('x-cron-secret');
    const authHeader = req.headers.get('authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const secret = envSecret || process.env.CRON_SECRET || '';
    if (!secret) return false;
    return headerSecret === secret || bearer === secret;
}

/**
 * POST /api/cron/order-auto-status
 * Cloudflare Cron 또는 수동 호출로 배송 상태 자동 전환 실행
 */
export async function POST(req: NextRequest) {
    const { env } = getCloudflareContext();
    if (!env?.DB) {
        return NextResponse.json({ error: 'DB not available' }, { status: 503 });
    }

    if (!isAuthorizedCron(req, (env as { CRON_SECRET?: string }).CRON_SECRET)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await processAutoOrderStatusTransitions(env.DB);
    return NextResponse.json({ success: true, ...result });
}
