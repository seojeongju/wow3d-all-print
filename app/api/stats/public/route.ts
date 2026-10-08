import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

/** 메인 화면 공개 지표 — 방문자마다 주기적으로 부르므로 isolate 안에서 잠깐 재사용한다 */
const CACHE_MS = 15_000;
let cached: { at: number; data: PublicStats } | null = null;

type PublicStats = {
    members: number;
    todayQuoteViews: number;
    /** 집계 기준 시각 (ISO) */
    updatedAt: string;
};

/** 한국 시간 오늘 0시를 D1 CURRENT_TIMESTAMP 형식(UTC, 'YYYY-MM-DD HH:MM:SS')으로 */
function kstTodayStartUtc(now = new Date()): string {
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const startUtc = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()) - 9 * 60 * 60 * 1000;
    return new Date(startUtc).toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * GET /api/stats/public - 사용 회원 수 · 오늘 견적 페이지 조회수(PV)
 */
export async function GET() {
    const { env } = getCloudflareContext();
    if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 });

    if (cached && Date.now() - cached.at < CACHE_MS) {
        return NextResponse.json({ success: true, data: cached.data }, { headers: { 'Cache-Control': 'no-store' } });
    }

    try {
        const [members, quoteViews] = await env.DB.batch<{ c: number }>([
            env.DB.prepare(
                `SELECT COUNT(*) AS c FROM users WHERE role IS NULL OR role NOT IN ('admin', 'super_admin')`
            ),
            env.DB.prepare(`SELECT COUNT(*) AS c FROM traffic_logs WHERE created_at >= ? AND path = '/quote'`).bind(
                kstTodayStartUtc()
            ),
        ]);

        const data: PublicStats = {
            members: Number(members.results?.[0]?.c ?? 0),
            todayQuoteViews: Number(quoteViews.results?.[0]?.c ?? 0),
            updatedAt: new Date().toISOString(),
        };
        cached = { at: Date.now(), data };
        return NextResponse.json({ success: true, data }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (e) {
        console.error('GET /api/stats/public', e);
        return NextResponse.json({ error: '지표를 불러오지 못했습니다.' }, { status: 500 });
    }
}
