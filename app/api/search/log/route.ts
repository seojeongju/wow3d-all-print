import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { errorResponse, successResponse } from '@/lib/api-utils'
import { normalizeQueryKey, toSearchLocale } from '@/lib/search'

const SOURCES = new Set(['page', 'modal', 'robot'])
/** 같은 방문자가 같은 검색어를 이 시간 안에 다시 찾으면 한 건으로 본다 */
const DEDUPE_WINDOW = '-2 minutes'
/** 방문자 하나가 1시간에 남길 수 있는 기록 수 상한 (스팸 방지) */
const HOURLY_LIMIT = 60

type LogBody = {
    query?: unknown
    resultCount?: unknown
    locale?: unknown
    source?: unknown
    visitorId?: unknown
    logId?: unknown
    clickedUrl?: unknown
}

function parseVisitorId(v: unknown): string | null {
    return typeof v === 'string' && /^[a-z0-9-]{8,64}$/i.test(v) ? v : null
}

function parseClickedUrl(v: unknown): string | null {
    if (typeof v !== 'string') return null
    const s = v.trim()
    return s.startsWith('/') && !s.startsWith('//') && s.length <= 300 ? s : null
}

/**
 * POST /api/search/log - 검색어·클릭 기록
 * - logId + clickedUrl: 기존 기록에 클릭한 결과 저장
 * - 그 외: 검색 기록 생성 (같은 검색어 반복은 합침)
 */
export async function POST(req: NextRequest) {
    try {
        const { env } = await getCloudflareContext({ async: true })
        if (!env?.DB) return errorResponse('DB를 사용할 수 없습니다', 503)

        const body = (await req.json().catch(() => ({}))) as LogBody
        const visitorId = parseVisitorId(body.visitorId)
        const clickedUrl = parseClickedUrl(body.clickedUrl)
        const logId = Number(body.logId)

        if (Number.isInteger(logId) && logId > 0 && clickedUrl && visitorId) {
            await env.DB.prepare(
                `UPDATE search_logs SET clicked_url = ? WHERE id = ? AND visitor_id = ? AND clicked_url IS NULL`
            )
                .bind(clickedUrl, logId, visitorId)
                .run()
            return successResponse({ id: logId })
        }

        const query = typeof body.query === 'string' ? body.query.trim().slice(0, 100) : ''
        const normalized = normalizeQueryKey(query)
        if (!normalized) return errorResponse('검색어가 없습니다', 400)

        const resultCount = Math.max(0, Math.min(1000, Math.floor(Number(body.resultCount) || 0)))
        const locale = toSearchLocale(typeof body.locale === 'string' ? body.locale : null)
        const source = typeof body.source === 'string' && SOURCES.has(body.source) ? body.source : 'page'

        if (visitorId) {
            const recent = await env.DB.prepare(
                `SELECT id FROM search_logs
                 WHERE visitor_id = ? AND normalized = ? AND created_at > datetime('now', ?)
                 ORDER BY id DESC LIMIT 1`
            )
                .bind(visitorId, normalized, DEDUPE_WINDOW)
                .first<{ id: number }>()
            if (recent?.id) {
                if (clickedUrl) {
                    await env.DB.prepare(`UPDATE search_logs SET clicked_url = ? WHERE id = ? AND clicked_url IS NULL`)
                        .bind(clickedUrl, recent.id)
                        .run()
                }
                return successResponse({ id: recent.id })
            }

            const hourly = await env.DB.prepare(
                `SELECT COUNT(*) AS cnt FROM search_logs WHERE visitor_id = ? AND created_at > datetime('now', '-1 hour')`
            )
                .bind(visitorId)
                .first<{ cnt: number }>()
            if (Number(hourly?.cnt ?? 0) >= HOURLY_LIMIT) return errorResponse('요청이 너무 많습니다', 429)
        }

        const inserted = await env.DB.prepare(
            `INSERT INTO search_logs (query, normalized, result_count, locale, source, visitor_id, clicked_url)
             VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`
        )
            .bind(query, normalized, resultCount, locale, source, visitorId, clickedUrl)
            .first<{ id: number }>()

        return successResponse({ id: inserted?.id ?? null })
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes('no such table')) return successResponse({ id: null })
        console.error('POST /api/search/log', e)
        return errorResponse('검색 기록 저장 실패', 500)
    }
}
