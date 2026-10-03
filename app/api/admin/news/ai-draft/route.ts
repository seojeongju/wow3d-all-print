import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAdminAuth } from '@/lib/api-utils'
import { fetchArticle, generateNewsAiDraft } from '@/lib/news-ai'
import { normalizeArticleUrl, scoreRelevance } from '@/lib/news-sources'
import { slugifyNewsTitle } from '@/lib/news'

type Body = { candidateId?: number; url?: string; adminNote?: string }

type CandidateRow = { id: number; url: string; title: string; source_name: string | null; published_at: string | null }

/**
 * POST /api/admin/news/ai-draft
 * 후보 기사(candidateId) 또는 관리자가 붙여넣은 기사 URL로 AI 초안을 만들어 임시저장한다.
 */
export async function POST(request: NextRequest) {
    try {
        const { env } = getCloudflareContext()
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 })
        const admin = await requireAdminAuth(request, env.DB)
        if (admin instanceof Response) return admin
        const db = env.DB

        const body = (await request.json().catch(() => ({}))) as Body
        let candidate: CandidateRow | null = null

        if (body.candidateId) {
            candidate = await db
                .prepare(`SELECT id, url, title, source_name, published_at FROM news_candidates WHERE store_id = ? AND id = ?`)
                .bind(admin.storeId, Number(body.candidateId))
                .first<CandidateRow>()
            if (!candidate) return NextResponse.json({ error: '후보 기사를 찾을 수 없습니다' }, { status: 404 })
        } else {
            const url = normalizeArticleUrl(String(body.url ?? ''))
            if (!url) return NextResponse.json({ error: '올바른 기사 주소(http/https)를 입력하세요' }, { status: 400 })
            candidate = await db
                .prepare(`SELECT id, url, title, source_name, published_at FROM news_candidates WHERE store_id = ? AND url = ?`)
                .bind(admin.storeId, url)
                .first<CandidateRow>()
            if (!candidate) candidate = { id: 0, url, title: '', source_name: null, published_at: null }
        }

        const article = await fetchArticle(candidate.url)
        if (!article.title && candidate.title) article.title = candidate.title
        if (!article.publishedAt && candidate.published_at) article.publishedAt = candidate.published_at.slice(0, 10)
        const sourceName = candidate.source_name || article.siteName

        const envVars = env as unknown as Record<string, string | undefined>
        const draft = await generateNewsAiDraft(article, { OPENAI_API_KEY: envVars.OPENAI_API_KEY }, String(body.adminNote ?? ''))

        const baseSlug = draft.slug || slugifyNewsTitle(draft.title) || `news-${Date.now()}`
        let postId = 0
        for (let attempt = 0; attempt < 5 && !postId; attempt++) {
            const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`
            try {
                const inserted = await db
                    .prepare(
                        `INSERT INTO news_posts (
                            store_id, slug, title, category, summary, body_html, insight, meta_description,
                            source_name, source_url, source_published_at, cover_alt,
                            tags_json, faq_json, related_links_json, status, published_at, updated_at
                         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, 'draft', NULL, datetime('now'))`
                    )
                    .bind(
                        admin.storeId,
                        slug,
                        draft.title,
                        draft.category,
                        draft.summary.join('\n'),
                        draft.bodyHtml,
                        draft.insight,
                        draft.metaDescription,
                        sourceName,
                        article.url,
                        article.publishedAt,
                        JSON.stringify(draft.tags),
                        JSON.stringify(draft.faqs),
                        JSON.stringify(draft.relatedLinks)
                    )
                    .run()
                postId = Number((inserted.meta as { last_row_id?: number })?.last_row_id || 0)
            } catch (e) {
                if (!/UNIQUE/i.test(e instanceof Error ? e.message : '')) throw e
            }
        }
        if (!postId) return NextResponse.json({ error: '주소(슬러그) 중복으로 저장하지 못했습니다' }, { status: 409 })

        if (candidate.id) {
            await db
                .prepare(`UPDATE news_candidates SET status = 'drafted', draft_post_id = ? WHERE id = ?`)
                .bind(postId, candidate.id)
                .run()
        } else {
            /** 직접 입력한 URL도 이력으로 남겨 같은 기사 중복 작성을 막음 */
            await db
                .prepare(
                    `INSERT OR IGNORE INTO news_candidates
                        (store_id, source_type, source_name, title, url, summary, language, published_at, relevance, status, draft_post_id)
                     VALUES (?, 'manual', ?, ?, ?, '', 'ko', NULL, ?, 'drafted', ?)`
                )
                .bind(admin.storeId, sourceName, article.title || draft.title, article.url, scoreRelevance(article.title, ''), postId)
                .run()
        }

        return NextResponse.json({ success: true, data: { id: postId } })
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        if (/no such table/i.test(msg)) {
            return NextResponse.json({ error: '뉴스 테이블이 없습니다. 마이그레이션을 먼저 실행하세요.' }, { status: 503 })
        }
        console.error('POST admin news ai-draft', e)
        return NextResponse.json({ error: msg || 'AI 초안 생성 실패' }, { status: 500 })
    }
}
