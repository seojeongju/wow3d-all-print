import koMessages from '@/messages/ko.json'
import enMessages from '@/messages/en.json'
import { SERVICE_LANDINGS } from '@/lib/seo-service-pages'
import { SERVICE_LANDINGS_EN } from '@/lib/seo-service-pages-en'
import { NEW_SEO_GUIDES } from '@/lib/seo-guide-pages'
import { NEW_SEO_GUIDES_EN } from '@/lib/seo-guide-pages-en'
import { USE_CASES } from '@/lib/use-case-pages'
import { BEST_MATERIALS_GUIDE_SLUGS } from '@/lib/best-materials-guides'
import {
    getPhotoTo3DFaqs,
    getPhotoTo3DGuideDescription,
    getPhotoTo3DGuideTitle,
} from '@/lib/seo-photo-to-3d'
import { getContentDates } from '@/lib/content-dates'
import { getGuideKeyAnswer } from '@/lib/guide-key-answers'
import { absoluteUrl } from '@/lib/site-url'

/**
 * llms.txt · llms-full.txt 공통 콘텐츠 수집.
 * 페이지 설정·번역 메시지에서 제목·설명·FAQ를 직접 읽어, 가이드를 추가하면 AI용 목록에도 자동 반영된다.
 */
export type LlmsLocale = 'ko' | 'en'
export type LlmsFaq = { q: string; a: string }
export type LlmsDoc = {
    path: string
    url: string
    title: string
    description: string
    modified: string | null
    faqs: LlmsFaq[]
}

type Messages = Record<string, unknown>

function messagesOf(locale: LlmsLocale): Messages {
    return (locale === 'en' ? enMessages : koMessages) as Messages
}

/** "A.B.C" 경로로 메시지 값 조회 */
function pick(messages: Messages, keyPath: string[]): unknown {
    let cur: unknown = messages
    for (const k of keyPath) {
        if (!cur || typeof cur !== 'object') return undefined
        cur = (cur as Record<string, unknown>)[k]
    }
    return cur
}

function asText(v: unknown): string {
    return typeof v === 'string' ? v : ''
}

function asFaqs(v: unknown): LlmsFaq[] {
    if (!Array.isArray(v)) return []
    return v
        .map((f) => ({ q: asText((f as LlmsFaq)?.q), a: asText((f as LlmsFaq)?.a) }))
        .filter((f) => f.q && f.a)
}

function localizedPath(path: string, locale: LlmsLocale) {
    if (locale === 'ko') return path
    return path === '/' ? '/en' : `/en${path}`
}

function makeDoc(
    locale: LlmsLocale,
    path: string,
    title: string,
    description: string,
    faqs: LlmsFaq[]
): LlmsDoc {
    const lp = localizedPath(path, locale)
    return {
        path: lp,
        url: absoluteUrl(lp),
        title,
        description,
        modified: getContentDates(path)?.modified ?? null,
        faqs,
    }
}

/** 번역 메시지 네임스페이스 하나로 구성된 개별 가이드 페이지 */
const MESSAGE_GUIDES: Array<{ path: string; keyPath: string[]; faqKeyPath?: string[] }> = [
    { path: '/guides/3d-printing-quote-guide', keyPath: ['QuoteGuide'] },
    { path: '/guides/3d-printing-price-examples', keyPath: ['PriceExamplesGuide'] },
    { path: '/guides/fdm-vs-sla-vs-dlp', keyPath: ['ProcessCompareGuide'], faqKeyPath: ['PrintMethods', 'faqs'] },
    { path: '/guides/3d-printing-file-preparation', keyPath: ['FilePrepGuide'] },
    { path: '/guides/3d-printing-turnaround-time', keyPath: ['TurnaroundGuide'] },
    { path: '/guides/pla-vs-abs-vs-petg', keyPath: ['FilamentCompareGuide'] },
    { path: '/guides/standard-vs-tough-vs-clear-vs-flexible-resin', keyPath: ['ResinCompareGuide'] },
    ...BEST_MATERIALS_GUIDE_SLUGS.map((slug) => ({
        path: `/guides/${slug}`,
        keyPath: ['BestMaterialsGuides', slug],
    })),
]

export function getGuideDocs(locale: LlmsLocale): LlmsDoc[] {
    const m = messagesOf(locale)
    const fromMessages = MESSAGE_GUIDES.map((g) => {
        const base = pick(m, g.keyPath)
        const title = asText(pick(m, [...g.keyPath, 'articleHeadline'])) || asText(pick(m, [...g.keyPath, 'metaTitle']))
        const description = asText(pick(m, [...g.keyPath, 'metaDescription']))
        const faqs = asFaqs(g.faqKeyPath ? pick(m, g.faqKeyPath) : (base as Messages | undefined)?.faqs)
        return makeDoc(locale, g.path, title, description, faqs)
    })

    const photo = makeDoc(
        locale,
        '/guides/photo-to-3d-printing-quote',
        getPhotoTo3DGuideTitle(locale),
        getPhotoTo3DGuideDescription(locale),
        asFaqs(getPhotoTo3DFaqs(locale))
    )

    // 화면 상단 핵심 답변이 있으면 설명 뒤에 붙여 AI가 결론을 바로 읽게 함
    const dynamicGuides = (locale === 'en' ? NEW_SEO_GUIDES_EN : NEW_SEO_GUIDES).map((g) => {
        const keyAnswer = getGuideKeyAnswer(g.slug, locale)
        return makeDoc(locale, g.path, g.title, keyAnswer ? `${g.description} ${keyAnswer}` : g.description, asFaqs(g.faqs))
    })

    return [photo, ...fromMessages, ...dynamicGuides].filter((d) => d.title)
}

export function getServiceDocs(locale: LlmsLocale): LlmsDoc[] {
    return (locale === 'en' ? SERVICE_LANDINGS_EN : SERVICE_LANDINGS).map((s) =>
        makeDoc(locale, s.path, s.title, s.description, asFaqs(s.faqs))
    )
}

export function getUseCaseDocs(locale: LlmsLocale): LlmsDoc[] {
    return USE_CASES.map((u) => {
        const c = u[locale]
        return makeDoc(locale, u.path, c.title, c.description, asFaqs(c.faqs))
    })
}

/** 자동견적 페이지 FAQ (화면 하단 QuoteSeoSection과 동일) */
export function getQuoteFaqs(locale: LlmsLocale): LlmsFaq[] {
    return asFaqs(pick(messagesOf(locale), ['Quote', 'faqs']))
}

/** llms.txt 목록 한 줄 */
export function llmsLine(doc: LlmsDoc): string {
    const updated = doc.modified ? ` (updated ${doc.modified})` : ''
    return `- [${doc.title}](${doc.url})${updated}: ${doc.description}`
}
