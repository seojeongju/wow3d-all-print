import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

/** 메인 화면 공개 지표 — 방문자마다 10초 주기로 부르므로 isolate 안에서 잠깐 재사용한다 */
const CACHE_MS = 3_000;
const RECENT_QUOTE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
let cached: { at: number; data: PublicStats } | null = null;

type PublicStats = {
    members: number;
    /** 최근 7일 견적 페이지 조회수(PV) */
    weekQuoteViews: number;
    /** 집계 기준 시각 (ISO) */
    updatedAt: string;
};

/** D1 CURRENT_TIMESTAMP 형식(UTC, 'YYYY-MM-DD HH:MM:SS') */
function toD1Timestamp(ms: number): string {
    return new Date(ms).toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * GET /api/stats/public - 누적 가입 회원 수 · 최근 1주일 견적 페이지 조회수(PV)
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
            env.DB.prepare(`SELECT COUNT(*) AS c FROM traffic_logs WHERE path = '/quote' AND created_at >= ?`).bind(
                toD1Timestamp(Date.now() - RECENT_QUOTE_WINDOW_MS)
            ),
        ]);

        const data: PublicStats = {
            members: Number(members.results?.[0]?.c ?? 0),
            weekQuoteViews: Number(quoteViews.results?.[0]?.c ?? 0),
            updatedAt: new Date().toISOString(),
        };
        cached = { at: Date.now(), data };
        return NextResponse.json({ success: true, data }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (e) {
        console.error('GET /api/stats/public', e);
        return NextResponse.json({ error: '지표를 불러오지 못했습니다.' }, { status: 500 });
    }
}
