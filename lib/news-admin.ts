import {
    AI_INSIGHT_MARKER,
    isNewsCategory,
    isSafeHref,
    kstLocalToUtcSql,
    sanitizeNewsSlug,
    slugifyNewsTitle,
    summaryToLines,
    type NewsCategory,
    type NewsFaq,
    type NewsLink,
    type NewsStatus,
} from '@/lib/news'

export type NewsWriteInput = {
    slug: string
    title: string
    category: NewsCategory
    summary: string
    bodyHtml: string | null
    insight: string | null
    metaDescription: string | null
    sourceName: string | null
    sourceUrl: string | null
    sourcePublishedAt: string | null
    coverAlt: string | null
    tagsJson: string
    faqJson: string
    relatedLinksJson: string
    status: NewsStatus
    /** 발행 시각(UTC SQL). null이면 발행 시점에 현재 시각 사용 */
    publishedAt: string | null
}

function text(v: unknown, max: number): string {
    return String(v ?? '').trim().slice(0, max)
}

function textOrNull(v: unknown, max: number): string | null {
    const s = text(v, max)
    return s || null
}

/** 관리자 요청 본문 검증·정규화 */
export function parseNewsWriteBody(body: Record<string, unknown>): NewsWriteInput | { error: string } {
    const title = text(body.title, 200)
    if (!title) return { error: '제목은 필수입니다' }

    const slug = sanitizeNewsSlug(text(body.slug, 120) || slugifyNewsTitle(title))
    if (!slug) return { error: '주소(슬러그)가 올바르지 않습니다' }

    const status: NewsStatus = body.status === 'published' ? 'published' : 'draft'
    const summaryLines = summaryToLines(text(body.summary, 2000))
    const bodyHtml = textOrNull(body.bodyHtml, 200_000)
    const insight = textOrNull(body.insight, 5000)

    if (status === 'published') {
        if (summaryLines.length === 0) return { error: '발행하려면 핵심 요약이 필요합니다' }
        if (!bodyHtml && !insight) return { error: '발행하려면 본문 또는 와우3D 실무 관점이 필요합니다' }
        if (insight?.includes(AI_INSIGHT_MARKER)) {
            return { error: '와우3D 실무 관점이 AI 초안 상태입니다. 직접 다듬고 [AI 초안] 표시를 지운 뒤 발행하세요' }
        }
    }

    const sourceUrl = textOrNull(body.sourceUrl, 1000)
    if (sourceUrl && !/^https?:\/\//i.test(sourceUrl)) {
        return { error: '출처 링크는 http(s):// 로 시작해야 합니다' }
    }
    const sourcePublishedAt = textOrNull(body.sourcePublishedAt, 10)
    if (sourcePublishedAt && !/^\d{4}-\d{2}-\d{2}$/.test(sourcePublishedAt)) {
        return { error: '출처 날짜 형식이 올바르지 않습니다' }
    }

    const tags = (Array.isArray(body.tags) ? body.tags : String(body.tags ?? '').split(','))
        .map((t) => String(t).trim())
        .filter(Boolean)
        .slice(0, 15)

    const faqs: NewsFaq[] = (Array.isArray(body.faqs) ? body.faqs : [])
        .map((f) => ({ q: text((f as NewsFaq)?.q, 300), a: text((f as NewsFaq)?.a, 2000) }))
        .filter((f) => f.q && f.a)
        .slice(0, 10)

    const relatedLinks: NewsLink[] = (Array.isArray(body.relatedLinks) ? body.relatedLinks : [])
        .map((l) => ({ title: text((l as NewsLink)?.title, 120), href: text((l as NewsLink)?.href, 500) }))
        .filter((l) => l.title && l.href && isSafeHref(l.href))
        .slice(0, 8)

    const publishedLocal = text(body.publishedAtLocal, 20)
    const publishedAt = publishedLocal ? kstLocalToUtcSql(publishedLocal) : null
    if (publishedLocal && !publishedAt) return { error: '발행 일시 형식이 올바르지 않습니다' }

    return {
        slug,
        title,
        category: isNewsCategory(body.category) ? body.category : 'industry',
        summary: summaryLines.join('\n'),
        bodyHtml,
        insight,
        metaDescription: textOrNull(body.metaDescription, 300),
        sourceName: textOrNull(body.sourceName, 120),
        sourceUrl,
        sourcePublishedAt,
        coverAlt: textOrNull(body.coverAlt, 200),
        tagsJson: JSON.stringify(tags),
        faqJson: JSON.stringify(faqs),
        relatedLinksJson: JSON.stringify(relatedLinks),
        status,
        publishedAt,
    }
}

export function newsTableMissingResponseBody() {
    return {
        error: 'news_posts 테이블이 없습니다. migrations/schema_news.sql 을 실행하세요.',
        code: 'TABLE_MISSING',
    }
}
