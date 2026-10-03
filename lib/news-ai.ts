/**
 * 최신 동향 AI 초안 — 원문 본문을 서버가 직접 가져와 그 안의 사실만으로 와우3D 형식 초안을 만든다.
 * 결과는 항상 임시저장(draft)으로만 저장하고, 실무 관점은 사람이 보완해야 발행할 수 있다.
 */
import { sanitizeDetailHtml } from '@/lib/sanitize-html'
import {
    AI_INSIGHT_MARKER,
    isNewsCategory,
    NEWS_LINK_PRESETS,
    type NewsCategory,
    type NewsFaq,
    type NewsLink,
} from '@/lib/news'
import { decodeEntities, htmlToPlain, normalizeArticleUrl } from '@/lib/news-sources'

const USER_AGENT = 'Mozilla/5.0 (compatible; WOW3D-NewsBot/1.0; +https://www.wow3dp.co.kr)'
const ARTICLE_MAX_CHARS = 9000
const OPENAI_MODEL = 'gpt-4o-mini'

export type ArticleSource = {
    url: string
    title: string
    siteName: string
    publishedAt: string | null
    text: string
}

export type NewsAiDraft = {
    title: string
    slug: string
    category: NewsCategory
    summary: string[]
    bodyHtml: string
    insight: string
    faqs: NewsFaq[]
    tags: string[]
    metaDescription: string
    relatedLinks: NewsLink[]
}

type AiEnv = {
    OPENAI_API_KEY?: string
}

export function resolveOpenAiKey(env: AiEnv): string {
    const fromProcess = typeof process !== 'undefined' ? process.env?.OPENAI_API_KEY?.trim() : ''
    return fromProcess || env.OPENAI_API_KEY?.trim() || ''
}

/** 내부망·로컬 주소 요청 차단 */
function isBlockedHost(hostname: string): boolean {
    const h = hostname.toLowerCase()
    if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.internal') || h.endsWith('.local')) return true
    if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(h)) return true
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true
    if (h.startsWith('[') || h.includes(':')) return true
    return false
}

function metaContent(html: string, key: string): string {
    const re = new RegExp(
        `<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`,
        'i'
    )
    const m = re.exec(html)
    return decodeEntities((m?.[1] ?? m?.[2] ?? '').trim())
}

/** 기사 HTML에서 본문 문단만 추출 */
export function extractArticleText(html: string): string {
    const cleaned = html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
        .replace(/<(nav|header|footer|aside|form|figure)[\s\S]*?<\/\1>/gi, ' ')
    const scope = /<article[\s\S]*?<\/article>/i.exec(cleaned)?.[0] ?? cleaned
    const paragraphs = (scope.match(/<(p|h2|h3|li)[^>]*>[\s\S]*?<\/\1>/gi) ?? [])
        .map((p) => htmlToPlain(p))
        .filter((p) => p.length >= 25 && !/^(copyright|ⓒ|©|저작권자|무단전재)/i.test(p))
    const text = paragraphs.length >= 3 ? paragraphs.join('\n') : htmlToPlain(scope)
    return text.slice(0, ARTICLE_MAX_CHARS)
}

export async function fetchArticle(rawUrl: string): Promise<ArticleSource> {
    const url = normalizeArticleUrl(rawUrl)
    if (!url) throw new Error('http(s) 기사 주소가 아닙니다')
    if (isBlockedHost(new URL(url).hostname)) throw new Error('허용되지 않는 주소입니다')

    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 15000)
    let html: string
    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
            redirect: 'follow',
            signal: ctrl.signal,
        })
        if (!res.ok) throw new Error(`원문을 가져오지 못했습니다 (HTTP ${res.status})`)
        if (isBlockedHost(new URL(res.url || url).hostname)) throw new Error('허용되지 않는 주소입니다')
        html = (await res.text()).slice(0, 2_000_000)
    } finally {
        clearTimeout(timer)
    }

    const title = metaContent(html, 'og:title') || htmlToPlain(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? '')
    const siteName = metaContent(html, 'og:site_name') || new URL(url).hostname.replace(/^www\./, '')
    const publishedRaw = metaContent(html, 'article:published_time') || metaContent(html, 'pubdate') || metaContent(html, 'date')
    const d = publishedRaw ? new Date(publishedRaw) : null
    const publishedAt = d && !Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : null

    return { url, title: title.slice(0, 300), siteName: siteName.slice(0, 120), publishedAt, text: extractArticleText(html) }
}

const SYSTEM_PROMPT = `당신은 (주)와우쓰리디(WOW3D) 3D프린팅 출력·시제품 제작 서비스의 "3D프린팅 최신 동향" 에디터입니다.
제공된 원문 기사에 있는 사실만 사용해, 한국 제조·스타트업·학생 독자를 위한 해설 기사 초안을 JSON으로 작성합니다.

와우쓰리디 소개: 서울 홍대·구미·전주 센터에서 FDM(PLA·PETG·ABS·ASA·TPU·PC)과 SLA·DLP(레진) 3D프린팅 출력, 시제품 제작, 소량 양산, 3D 모델링, 캡스톤디자인 지원, 웹 자동견적 서비스를 제공합니다.

규칙:
1. 원문 문장을 그대로 옮기지 말고 한국어로 새로 쓰세요. 영어 원문은 자연스러운 한국어로 풀어 쓰세요.
2. 원문에 없는 수치·회사명·날짜·인용을 지어내지 마세요. 불확실하면 쓰지 마세요.
3. 과장·광고 문구를 피하고, 독자가 "그래서 내 제품 개발에 무엇이 달라지나"를 알 수 있게 쓰세요.
4. bodyHtml은 <h2>, <p>, <ul>, <li>, <strong>만 사용합니다. 구성: 무슨 일이 있었나 → 핵심 내용 → 3D프린팅 사용자에게 주는 의미. 600~1200자.
5. title은 검색에 잘 걸리는 한국어 제목 20~50자. 핵심 키워드를 앞쪽에 둡니다.
6. summary는 각 1문장인 핵심 요약 3~5개 배열.
7. insight는 와우쓰리디 제작 현장 관점의 시사점 초안 2~4문장(소재 선택·공정·비용·납기 관점). 경험을 사실처럼 지어내지 말고 "~를 검토할 만합니다" 같은 제안형으로 씁니다.
8. faqs는 독자가 검색할 만한 질문과 답변 1~3개. 답변은 2~3문장.
9. tags는 한국어 키워드 3~6개. metaDescription은 70~150자.
10. category는 material(소재)|equipment(장비)|industry(산업 동향)|support(지원사업)|case(활용 사례) 중 하나.
11. relatedHrefs는 아래 내부 페이지 목록 중 관련 있는 href 1~3개.
12. slug는 영문 소문자·숫자·하이픈 3~6단어.

출력은 JSON 객체 하나만:
{"title":"","slug":"","category":"","summary":[""],"bodyHtml":"","insight":"","faqs":[{"q":"","a":""}],"tags":[""],"metaDescription":"","relatedHrefs":[""]}`

function buildUserPrompt(article: ArticleSource, adminNote: string): string {
    const presets = NEWS_LINK_PRESETS.map((l) => `- ${l.href} : ${l.title}`).join('\n')
    return [
        `원문 매체: ${article.siteName}`,
        `원문 제목: ${article.title}`,
        article.publishedAt ? `원문 게시일: ${article.publishedAt}` : '',
        adminNote ? `관리자 메모(반영할 관점): ${adminNote}` : '',
        '',
        '내부 페이지 목록:',
        presets,
        '',
        '원문 본문:',
        article.text,
    ]
        .filter((l) => l !== '')
        .join('\n')
}

function str(v: unknown, max: number): string {
    return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

function toSlug(v: string): string {
    return v
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60)
}

export function parseAiDraft(raw: string): NewsAiDraft | null {
    let data: Record<string, unknown>
    try {
        const json = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)
        data = JSON.parse(json) as Record<string, unknown>
    } catch {
        return null
    }
    const title = str(data.title, 120)
    const bodyHtml = sanitizeDetailHtml(str(data.bodyHtml, 20000))
    if (!title || !bodyHtml) return null

    const presetByHref = new Map(NEWS_LINK_PRESETS.map((l) => [l.href, l]))
    const relatedLinks = (Array.isArray(data.relatedHrefs) ? data.relatedHrefs : [])
        .map((h) => presetByHref.get(String(h).trim()))
        .filter((l): l is NewsLink => Boolean(l))
        .slice(0, 3)
    const category = isNewsCategory(data.category) && data.category !== 'company' ? data.category : 'industry'
    const insightText = str(data.insight, 2000)

    return {
        title,
        slug: toSlug(str(data.slug, 120)),
        category,
        summary: (Array.isArray(data.summary) ? data.summary : [])
            .map((s) => str(s, 200))
            .filter(Boolean)
            .slice(0, 5),
        bodyHtml,
        insight: insightText ? `${AI_INSIGHT_MARKER} 실제 제작 경험으로 다듬은 뒤 이 표시를 지우고 발행하세요.\n${insightText}` : '',
        faqs: (Array.isArray(data.faqs) ? data.faqs : [])
            .map((f) => ({ q: str((f as NewsFaq)?.q, 300), a: str((f as NewsFaq)?.a, 1000) }))
            .filter((f) => f.q && f.a)
            .slice(0, 3),
        tags: (Array.isArray(data.tags) ? data.tags : [])
            .map((t) => str(t, 30))
            .filter(Boolean)
            .slice(0, 6),
        metaDescription: str(data.metaDescription, 160),
        relatedLinks: relatedLinks.length > 0 ? relatedLinks : [NEWS_LINK_PRESETS[0]],
    }
}

function summarizeOpenAiError(status: number, body: string): string {
    if (/insufficient_quota|no credits/i.test(body) || status === 402) return 'OpenAI 크레딧이 부족합니다. Billing에서 충전하세요.'
    if (status === 401) return 'OpenAI 인증 실패(401). OPENAI_API_KEY를 확인하세요.'
    if (status === 429) return 'OpenAI 요청 한도를 초과했습니다. 잠시 후 다시 시도하세요.'
    return `OpenAI 오류 HTTP ${status}`
}

export async function generateNewsAiDraft(
    article: ArticleSource,
    env: AiEnv,
    adminNote = ''
): Promise<NewsAiDraft> {
    if (article.text.length < 200) {
        throw new Error('원문 본문을 충분히 읽지 못했습니다. 다른 기사 주소를 사용하거나 직접 작성해 주세요.')
    }
    const key = resolveOpenAiKey(env)
    if (!key) throw new Error('OPENAI_API_KEY가 설정되지 않았습니다')

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: OPENAI_MODEL,
            temperature: 0.4,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: buildUserPrompt(article, adminNote.slice(0, 500)) },
            ],
        }),
    })
    if (!res.ok) {
        const body = await res.text().catch(() => '')
        console.warn('[news-ai] OpenAI HTTP', res.status, body.slice(0, 300))
        throw new Error(summarizeOpenAiError(res.status, body))
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const draft = parseAiDraft(data.choices?.[0]?.message?.content ?? '')
    if (!draft) throw new Error('AI 응답을 해석하지 못했습니다. 다시 시도해 주세요.')
    return draft
}