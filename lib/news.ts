export const NEWS_CATEGORIES = ['material', 'equipment', 'industry', 'support', 'case', 'company'] as const
export type NewsCategory = (typeof NEWS_CATEGORIES)[number]

export const NEWS_CATEGORY_LABEL_KO: Record<NewsCategory, string> = {
    material: '소재',
    equipment: '장비',
    industry: '산업 동향',
    support: '지원사업',
    case: '활용 사례',
    company: '와우3D 소식',
}

export type NewsStatus = 'draft' | 'published'

export type NewsFaq = { q: string; a: string }
export type NewsLink = { title: string; href: string }

export type NewsPost = {
    id: number
    slug: string
    title: string
    category: NewsCategory
    /** 핵심 요약 줄 목록 */
    summary: string[]
    bodyHtml: string
    insight: string
    metaDescription: string
    sourceName: string
    sourceUrl: string
    /** YYYY-MM-DD */
    sourcePublishedAt: string
    coverUrl: string | null
    coverR2Key: string | null
    coverAlt: string
    tags: string[]
    faqs: NewsFaq[]
    relatedLinks: NewsLink[]
    status: NewsStatus
    /** UTC 'YYYY-MM-DD HH:MM:SS' */
    publishedAt: string | null
    createdAt: string
    updatedAt: string
}

export const NEWS_PAGE_SIZE = 12

export function isNewsCategory(v: unknown): v is NewsCategory {
    return typeof v === 'string' && (NEWS_CATEGORIES as readonly string[]).includes(v)
}

export function newsMediaUrlFromKey(r2Key: string | null | undefined): string | null {
    const key = (r2Key || '').trim()
    if (!key) return null
    return `/api/news/media/${key.startsWith('news/') ? key.slice('news/'.length) : key}`
}

export function parseJsonList<T>(raw: unknown, fallback: T[]): T[] {
    if (Array.isArray(raw)) return raw as T[]
    if (typeof raw !== 'string' || !raw.trim()) return fallback
    try {
        const v = JSON.parse(raw)
        return Array.isArray(v) ? (v as T[]) : fallback
    } catch {
        return fallback
    }
}

export function summaryToLines(raw: string | null | undefined): string[] {
    return (raw || '')
        .split('\n')
        .map((l) => l.replace(/^[\s\-•·*]+/, '').trim())
        .filter(Boolean)
}

export function normalizeNewsSlug(raw: string): string {
    let s = String(raw || '').trim()
    for (let i = 0; i < 2; i++) {
        try {
            if (/%[0-9A-Fa-f]{2}/.test(s)) s = decodeURIComponent(s)
            else break
        } catch {
            break
        }
    }
    return s.trim()
}

export function slugifyNewsTitle(title: string): string {
    return title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]+/gi, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60)
}

export function sanitizeNewsSlug(raw: string): string {
    return String(raw || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9가-힣-]+/gi, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80)
}

export function stripHtmlText(html: string | null | undefined): string {
    return (html || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim()
}

/** 메타 설명: 직접 입력값 → 요약 → 본문 순 */
export function resolveNewsDescription(post: Pick<NewsPost, 'metaDescription' | 'summary' | 'bodyHtml'>): string {
    const base = post.metaDescription.trim() || post.summary.join(' ') || stripHtmlText(post.bodyHtml)
    return base.length > 160 ? `${base.slice(0, 157)}…` : base
}

/** D1 datetime('now') 형식(UTC) → ISO 8601 */
export function utcSqlToIso(v: string | null | undefined): string | null {
    if (!v) return null
    const s = v.includes('T') ? v : `${v.replace(' ', 'T')}Z`
    const d = new Date(s)
    return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

/** UTC SQL 시각 → 한국 날짜 'YYYY.MM.DD' */
export function formatNewsDateKo(v: string | null | undefined): string {
    const iso = utcSqlToIso(v)
    if (!iso) return ''
    const kst = new Date(new Date(iso).getTime() + 9 * 3600 * 1000)
    const y = kst.getUTCFullYear()
    const m = String(kst.getUTCMonth() + 1).padStart(2, '0')
    const d = String(kst.getUTCDate()).padStart(2, '0')
    return `${y}.${m}.${d}`
}

/** 관리자 datetime-local(KST) → UTC SQL */
export function kstLocalToUtcSql(local: string): string | null {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local || '')
    if (!m) return null
    const utc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] - 9, +m[5])
    return new Date(utc).toISOString().slice(0, 19).replace('T', ' ')
}

/** UTC SQL → 관리자 datetime-local(KST) */
export function utcSqlToKstLocal(v: string | null | undefined): string {
    const iso = utcSqlToIso(v)
    if (!iso) return ''
    return new Date(new Date(iso).getTime() + 9 * 3600 * 1000).toISOString().slice(0, 16)
}

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const IMAGE_MAX_BYTES = 15 * 1024 * 1024

export function validateNewsImage(file: File): string | null {
    const t = (file.type || '').toLowerCase()
    if (!IMAGE_TYPES.has(t) && !/\.(jpe?g|png|webp|gif)$/i.test(file.name)) {
        return 'JPG, PNG, WebP, GIF만 업로드할 수 있습니다'
    }
    if (file.size > IMAGE_MAX_BYTES) return '이미지는 최대 15MB까지 가능합니다'
    return null
}

export function newsImageExt(file: File): string {
    const n = file.name.toLowerCase()
    if (n.endsWith('.png')) return 'png'
    if (n.endsWith('.webp')) return 'webp'
    if (n.endsWith('.gif')) return 'gif'
    return 'jpg'
}

export function isSafeHref(href: string): boolean {
    const h = href.trim()
    return h.startsWith('/') ? !h.startsWith('//') : /^https?:\/\//i.test(h)
}

export type NewsSeoCheck = { id: string; label: string; ok: boolean; hint: string }

/** 관리자 편집기 SEO·AEO 점검 항목 */
export function evaluateNewsSeo(input: {
    title: string
    summaryLines: string[]
    insight: string
    metaDescription: string
    hasCover: boolean
    coverAlt: string
    sourceUrl: string
    category: NewsCategory
    relatedCount: number
    faqCount: number
}): NewsSeoCheck[] {
    const titleLen = input.title.trim().length
    const metaLen = (input.metaDescription.trim() || input.summaryLines.join(' ')).length
    return [
        {
            id: 'title',
            label: '제목 15~60자',
            ok: titleLen >= 15 && titleLen <= 60,
            hint: `현재 ${titleLen}자 — 검색 결과에서 잘리지 않는 길이`,
        },
        {
            id: 'summary',
            label: '핵심 요약 3~5줄',
            ok: input.summaryLines.length >= 3 && input.summaryLines.length <= 5,
            hint: `현재 ${input.summaryLines.length}줄 — AI 답변이 가장 많이 인용하는 부분`,
        },
        {
            id: 'insight',
            label: '와우3D 실무 관점 80자 이상',
            ok: input.insight.trim().length >= 80,
            hint: '직접 경험·관점이 있어야 단순 요약 콘텐츠로 분류되지 않습니다',
        },
        {
            id: 'meta',
            label: '검색 설명 50~160자',
            ok: metaLen >= 50 && metaLen <= 160,
            hint: `현재 ${metaLen}자 (비우면 핵심 요약으로 자동 생성)`,
        },
        {
            id: 'cover',
            label: '대표 이미지와 대체 텍스트',
            ok: input.hasCover && input.coverAlt.trim().length > 0,
            hint: '직접 촬영·제작한 이미지 사용 (기사 사진 무단 사용 금지)',
        },
        {
            id: 'source',
            label: '원문 출처 링크',
            ok: input.category === 'company' || /^https?:\/\//i.test(input.sourceUrl.trim()),
            hint: '외부 기사 기반이면 출처를 반드시 표기',
        },
        {
            id: 'related',
            label: '관련 페이지 링크 1개 이상',
            ok: input.relatedCount >= 1,
            hint: '가이드·소재·서비스로 내부 링크 연결',
        },
        {
            id: 'faq',
            label: 'FAQ 1개 이상',
            ok: input.faqCount >= 1,
            hint: 'FAQ 구조화 데이터로 AI 답변 노출 기회 확대',
        },
    ]
}

/** 관련 링크 빠른 선택용 내부 페이지 */
export const NEWS_LINK_PRESETS: NewsLink[] = [
    { title: '3D프린팅 자동견적', href: '/quote' },
    { title: '소재 안내', href: '/materials' },
    { title: '출력 방식 비교', href: '/print-methods' },
    { title: 'PLA·ABS·PETG·PC 소재 비교', href: '/guides/pla-vs-abs-vs-petg' },
    { title: 'SLA·DLP 레진 4종 비교', href: '/guides/standard-vs-tough-vs-clear-vs-flexible-resin' },
    { title: '3D 프린팅 공정 비교', href: '/guides/fdm-vs-sla-vs-dlp' },
    { title: '3D프린팅 비용 계산 방법', href: '/guides/3d-printing-quote-guide' },
    { title: '3D프린팅 가격을 줄이는 방법', href: '/guides/how-to-reduce-3d-printing-cost' },
    { title: '내열·내충격 부품용 소재 추천', href: '/guides/best-materials-for-heat-resistant-and-impact-resistant-parts' },
    { title: '시제품용 소재 추천', href: '/guides/best-materials-for-3d-printing-prototypes' },
    { title: '시제품 제작 서비스', href: '/services/prototype' },
    { title: '소량 양산 서비스', href: '/services/small-batch' },
    { title: '캡스톤디자인 시제품 제작', href: '/services/capstone' },
    { title: '사진(이미지)으로 3D 프린팅 견적', href: '/guides/photo-to-3d-printing-quote' },
    { title: '제품개발 문의', href: '/expert' },
    { title: '출력 갤러리', href: '/gallery' },
]
