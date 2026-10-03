import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { collectNewsCandidates, resolveNaverKeys } from '@/lib/news-sources'

function isAuthorizedCron(req: NextRequest, envSecret?: string): boolean {
    const headerSecret = req.headers.get('x-cron-secret')
    const authHeader = req.headers.get('authorization')
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : ''
    const secret = envSecret || process.env.CRON_SECRET || ''
    if (!secret) return false
    return headerSecret === secret || bearer === secret
}

/**
 * POST /api/cron/news-collect
 * 매일 크론으로 최신 동향 후보 기사 수집 (AI 호출 없음)
 */
export async function POST(req: NextRequest) {
    const { env } = getCloudflareContext()
    if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 })
    if (!isAuthorizedCron(req, (env as { CRON_SECRET?: string }).CRON_SECRET)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    try {
        const result = await collectNewsCandidates(env.DB, 1, resolveNaverKeys(env as unknown as Record<string, unknown>))
        if (result.errors.length > 0) console.warn('[news-collect]', result.errors)
        return NextResponse.json({ success: true, ...result })
    } catch (e) {
        console.error('[news-collect] failed', e)
        return NextResponse.json({ error: e instanceof Error ? e.message : '수집 실패' }, { status: 500 })
    }
}
