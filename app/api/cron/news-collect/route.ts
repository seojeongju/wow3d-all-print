import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { collectNewsCandidates, resolveNaverKeys } from '@/lib/news-sources'
import { listCollectPresets, markPresetRun } from '@/lib/news-collect-presets'
import { newsIndexNowUrls, submitIndexNow } from '@/lib/indexnow'

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
        const naverKeys = resolveNaverKeys(env as unknown as Record<string, unknown>)
        const result = await collectNewsCandidates(env.DB, 1, naverKeys)
        if (result.errors.length > 0) console.warn('[news-collect]', result.errors)

        /** 관리자가 "매일 자동 수집"으로 저장한 조건도 차례로 수집 — 한 조건이 실패해도 나머지는 계속 */
        const presets: { id: number; name: string; added: number; error?: string }[] = []
        let autoPresets: Awaited<ReturnType<typeof listCollectPresets>> = []
        try {
            autoPresets = await listCollectPresets(env.DB, 1, true)
        } catch (e) {
            console.warn('[news-collect] 프리셋 조회 실패(마이그레이션 확인)', e)
        }
        for (const p of autoPresets) {
            try {
                const r = await collectNewsCandidates(env.DB, 1, naverKeys, p.config)
                await markPresetRun(env.DB, p.id, r.added)
                presets.push({ id: p.id, name: p.name, added: r.added })
                if (r.errors.length > 0) console.warn('[news-collect]', p.name, r.errors)
            } catch (e) {
                presets.push({ id: p.id, name: p.name, added: 0, error: e instanceof Error ? e.message : String(e) })
            }
        }
        /** 예약 발행 글(저장 시각보다 발행 시각이 늦은 글)이 지난 하루 사이 공개됐으면 검색엔진에 알림 */
        let indexNowCount = 0
        try {
            const { results: scheduled } = await env.DB.prepare(
                `SELECT slug FROM news_posts
                 WHERE status = 'published' AND published_at > datetime('now', '-1 day')
                   AND published_at <= datetime('now') AND updated_at < published_at`
            ).all<{ slug: string }>()
            const slugs = (scheduled ?? []).map((r: { slug: string }) => r.slug)
            if (slugs.length) {
                await submitIndexNow(newsIndexNowUrls(...slugs))
                indexNowCount = slugs.length
            }
        } catch (e) {
            console.warn('[news-collect] 예약 발행 IndexNow 실패', e)
        }

        return NextResponse.json({ success: true, ...result, presets, indexNowCount })
    } catch (e) {
        console.error('[news-collect] failed', e)
        return NextResponse.json({ error: e instanceof Error ? e.message : '수집 실패' }, { status: 500 })
    }
}
