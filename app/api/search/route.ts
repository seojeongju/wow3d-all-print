import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { errorResponse, successResponse } from '@/lib/api-utils'
import { searchSite, toSearchLocale, type SearchLocale } from '@/lib/search'

const MAX_QUERY_LENGTH = 100
const POPULAR_DAYS = 30
/** 공개 인기 검색어는 서로 다른 방문자 N명 이상이 찾은 검색어만 노출 */
const POPULAR_MIN_VISITORS = 3
const POPULAR_LIMIT = 8

async function loadPopular(locale: SearchLocale): Promise<string[]> {
    try {
        const { env } = await getCloudflareContext({ async: true })
        if (!env?.DB) return []
        const { results } = await env.DB.prepare(
            `SELECT normalized, COUNT(DISTINCT COALESCE(visitor_id, id)) AS visitors
             FROM search_logs
             WHERE locale = ? AND result_count > 0 AND created_at > datetime('now', ?)
             GROUP BY normalized
             HAVING visitors >= ?
             ORDER BY visitors DESC
             LIMIT ?`
        )
            .bind(locale, `-${POPULAR_DAYS} days`, POPULAR_MIN_VISITORS, POPULAR_LIMIT)
            .all<{ normalized: string }>()
        return (results ?? []).map((r: { normalized: string }) => r.normalized)
    } catch {
        return []
    }
}

/**
 * GET /api/search?q=&locale=ko|en&limit= - 사이트 통합 검색
 * GET /api/search?popular=1&locale= - 인기 검색어
 */
export async function GET(req: NextRequest) {
    const params = req.nextUrl.searchParams
    const locale = toSearchLocale(params.get('locale'))

    if (params.get('popular') === '1') {
        const popular = await loadPopular(locale)
        return successResponse({ popular })
    }

    const q = (params.get('q') || '').trim().slice(0, MAX_QUERY_LENGTH)
    if (!q) return successResponse({ hits: [], terms: [], total: 0, corrected: null })
    const limit = Math.min(50, Math.max(1, parseInt(params.get('limit') || '30', 10) || 30))

    try {
        const result = await searchSite(q, locale, limit)
        return successResponse(result)
    } catch (e) {
        console.error('GET /api/search', e)
        return errorResponse('검색 중 오류가 발생했습니다', 500)
    }
}
