import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth, successResponse, errorResponse } from '@/lib/api-utils';
import { referrerHost, trafficSourceHint, trafficSourceLabel } from '@/lib/traffic-source-labels';

type CountRow = { label: string; count: number };

type SampleRow = {
    created_at: string;
    medium: string | null;
    campaign: string | null;
    referrer_url: string | null;
    path: string | null;
};

/**
 * GET /api/admin/traffic/sources/[source]
 * Query: days=30 (1~90)
 * 유입 소스별 medium·campaign·path·referrer 집계
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ source: string }> }
) {
    const { env } = getCloudflareContext();
    if (!env?.DB) return errorResponse('DB not available', 503);

    const auth = await requireAdminAuth(req, env.DB);
    if (auth instanceof Response) return auth;

    const { source: rawSource } = await params;
    const source = decodeURIComponent(rawSource || '').trim();
    if (!source) return errorResponse('유입 소스가 필요합니다', 400);

    const daysRaw = parseInt(req.nextUrl.searchParams.get('days') || '30', 10);
    const days = Number.isFinite(daysRaw) ? Math.min(90, Math.max(1, daysRaw)) : 30;
    const since = `-${days} days`;

    try {
        const totalRow = await env.DB.prepare(
            `
            SELECT COUNT(*) AS cnt
            FROM traffic_logs
            WHERE LOWER(TRIM(source)) = LOWER(TRIM(?))
              AND created_at >= date('now', ?)
            `
        )
            .bind(source, since)
            .first<{ cnt: number }>();

        const totalCount = Number(totalRow?.cnt ?? 0);

        const byMedium = await env.DB.prepare(
            `
            SELECT COALESCE(NULLIF(TRIM(medium), ''), 'none') AS label, COUNT(*) AS count
            FROM traffic_logs
            WHERE LOWER(TRIM(source)) = LOWER(TRIM(?))
              AND created_at >= date('now', ?)
            GROUP BY label
            ORDER BY count DESC
            LIMIT 20
            `
        )
            .bind(source, since)
            .all() as { results: CountRow[] };

        const byCampaign = await env.DB.prepare(
            `
            SELECT COALESCE(NULLIF(TRIM(campaign), ''), '(없음)') AS label, COUNT(*) AS count
            FROM traffic_logs
            WHERE LOWER(TRIM(source)) = LOWER(TRIM(?))
              AND created_at >= date('now', ?)
            GROUP BY label
            ORDER BY count DESC
            LIMIT 20
            `
        )
            .bind(source, since)
            .all() as { results: CountRow[] };

        const byPath = await env.DB.prepare(
            `
            SELECT COALESCE(NULLIF(TRIM(path), ''), '/') AS label, COUNT(*) AS count
            FROM traffic_logs
            WHERE LOWER(TRIM(source)) = LOWER(TRIM(?))
              AND created_at >= date('now', ?)
            GROUP BY label
            ORDER BY count DESC
            LIMIT 20
            `
        )
            .bind(source, since)
            .all() as { results: CountRow[] };

        const referrerRows = await env.DB.prepare(
            `
            SELECT referrer_url, COUNT(*) AS count
            FROM traffic_logs
            WHERE LOWER(TRIM(source)) = LOWER(TRIM(?))
              AND created_at >= date('now', ?)
            GROUP BY referrer_url
            ORDER BY count DESC
            LIMIT 30
            `
        )
            .bind(source, since)
            .all() as { results: { referrer_url: string | null; count: number }[] };

        const byReferrerHost: CountRow[] = [];
        const hostMap = new Map<string, number>();
        for (const row of referrerRows.results ?? []) {
            const host = referrerHost(row.referrer_url);
            hostMap.set(host, (hostMap.get(host) ?? 0) + Number(row.count));
        }
        for (const [label, count] of hostMap.entries()) {
            byReferrerHost.push({ label, count });
        }
        byReferrerHost.sort((a, b) => b.count - a.count);

        const recent = await env.DB.prepare(
            `
            SELECT created_at, medium, campaign, referrer_url, path
            FROM traffic_logs
            WHERE LOWER(TRIM(source)) = LOWER(TRIM(?))
              AND created_at >= date('now', ?)
            ORDER BY created_at DESC
            LIMIT 15
            `
        )
            .bind(source, since)
            .all() as { results: SampleRow[] };

        return successResponse({
            source,
            label: trafficSourceLabel(source),
            hint: trafficSourceHint(source),
            days,
            totalCount,
            byMedium: byMedium.results ?? [],
            byCampaign: byCampaign.results ?? [],
            byPath: byPath.results ?? [],
            byReferrerHost: byReferrerHost.slice(0, 15),
            recentSamples: (recent.results ?? []).map((r) => ({
                createdAt: r.created_at,
                medium: r.medium,
                campaign: r.campaign,
                referrerUrl: r.referrer_url,
                referrerHost: referrerHost(r.referrer_url),
                path: r.path,
            })),
        });
    } catch (e) {
        console.error('GET /api/admin/traffic/sources/[source]', e);
        return errorResponse('유입 상세 조회 실패', 500);
    }
}
