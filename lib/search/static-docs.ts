import koMessages from '@/messages/ko.json'
import enMessages from '@/messages/en.json'
import { NEW_SEO_GUIDES } from '@/lib/seo-guide-pages'
import { NEW_SEO_GUIDES_EN } from '@/lib/seo-guide-pages-en'
import { SERVICE_LANDINGS } from '@/lib/seo-service-pages'
import { SERVICE_LANDINGS_EN } from '@/lib/seo-service-pages-en'
import { WOW3D_PRINT_METHODS, REFERENCE_PRINT_METHODS } from '@/lib/print-methods-data'
import { MAKERSPACES } from '@/lib/makerspaces'
import { BEST_MATERIALS_GUIDE_SLUGS } from '@/lib/best-materials-guides'
import type { SearchDoc, SearchDocType } from './engine'

export type SearchLocale = 'ko' | 'en'

type MessageTree = { [key: string]: unknown }

/** 메시지 네임스페이스 하나가 곧 한 페이지인 정적 페이지 목록 */
const NAMESPACE_PAGES: { path: string; ns: string; type: SearchDocType; boost?: number }[] = [
    { path: '/guides/photo-to-3d-printing-quote', ns: 'PhotoTo3DGuide', type: 'guide' },
    { path: '/guides/3d-printing-quote-guide', ns: 'QuoteGuide', type: 'guide' },
    { path: '/guides/3d-printing-file-preparation', ns: 'FilePrepGuide', type: 'guide' },
    { path: '/guides/fdm-vs-sla-vs-dlp', ns: 'ProcessCompareGuide', type: 'guide' },
    { path: '/guides/3d-printing-turnaround-time', ns: 'TurnaroundGuide', type: 'guide' },
    { path: '/guides/pla-vs-abs-vs-petg', ns: 'FilamentCompareGuide', type: 'guide' },
    { path: '/guides/standard-vs-tough-vs-clear-vs-flexible-resin', ns: 'ResinCompareGuide', type: 'guide' },
    { path: '/materials', ns: 'Materials', type: 'material' },
    { path: '/materials/safety', ns: 'MaterialsSafety', type: 'material' },
    { path: '/print-methods', ns: 'PrintMethods', type: 'method' },
    { path: '/quote', ns: 'Quote', type: 'page', boost: 1.05 },
    { path: '/services', ns: 'Services', type: 'service', boost: 0.9 },
    { path: '/guides', ns: 'GuidesHub', type: 'guide', boost: 0.85 },
    { path: '/qna', ns: 'QnAPage', type: 'page', boost: 0.8 },
    { path: '/makerspace', ns: 'Makerspace', type: 'page' },
    { path: '/contact', ns: 'Contact', type: 'page', boost: 0.8 },
    { path: '/gallery', ns: 'Gallery', type: 'page', boost: 0.8 },
    { path: '/expert', ns: 'Expert', type: 'page' },
    { path: '/custom', ns: 'CustomProducts', type: 'page', boost: 0.9 },
    { path: '/hardware/3d-printer', ns: 'Hardware', type: 'page' },
    { path: '/maker', ns: 'Maker', type: 'page' },
    { path: '/experience', ns: 'Experience', type: 'page' },
    { path: '/partnership', ns: 'Partnership', type: 'page' },
    { path: '/partnership/smart-store', ns: 'PartnershipSmartStore', type: 'page' },
    { path: '/privacy', ns: 'Privacy', type: 'page', boost: 0.5 },
    { path: '/terms', ns: 'Terms', type: 'page', boost: 0.5 },
]

const SKIP_KEY = /^(meta|og|tracking|breadcrumb|aria|alt|toast|schema|collection)/i

function flattenStrings(node: unknown, out: string[], key = ''): void {
    if (key && SKIP_KEY.test(key)) return
    if (typeof node === 'string') {
        const s = node.replace(/<\/?[a-zA-Z0-9]+>/g, '').replace(/\{[^}]*\}/g, ' ').trim()
        if (s) out.push(s)
        return
    }
    if (Array.isArray(node)) {
        for (const item of node) flattenStrings(item, out)
        return
    }
    if (node && typeof node === 'object') {
        for (const [k, v] of Object.entries(node)) flattenStrings(v, out, k)
    }
}

function str(tree: MessageTree, key: string): string {
    const v = tree[key]
    return typeof v === 'string' ? v.replace(/<\/?[a-zA-Z0-9]+>/g, '').trim() : ''
}

/** "제목 | WOW3D" 형태에서 사이트명 꼬리 제거 */
function cleanTitle(title: string): string {
    return title.split(/\s[|｜]\s/)[0].trim()
}

function joinTitle(tree: MessageTree, a: string, b: string): string {
    return [str(tree, a), str(tree, b)].filter(Boolean).join(' ')
}

function namespaceDoc(tree: MessageTree, path: string, type: SearchDocType, boost?: number, idSuffix = ''): SearchDoc | null {
    const title = cleanTitle(
        str(tree, 'metaTitle') ||
            str(tree, 'title') ||
            joinTitle(tree, 'h1Line1', 'h1Accent') ||
            joinTitle(tree, 'heroTitleLine1', 'heroTitleAccent')
    )
    if (!title) return null
    const summary = str(tree, 'metaDescription') || str(tree, 'subtitle') || str(tree, 'intro')
    const keywords = Array.isArray(tree.metaKeywords) ? (tree.metaKeywords as unknown[]).filter((k): k is string => typeof k === 'string') : []
    const bodyParts: string[] = []
    flattenStrings(tree, bodyParts)
    return {
        id: `${type}:${path}${idSuffix}`,
        type,
        title,
        url: path,
        summary,
        keywords,
        body: bodyParts.join(' \n'),
        boost,
    }
}

function faqText(faqs: { q: string; a: string }[] | undefined): string {
    return (faqs ?? []).map((f) => `${f.q} ${f.a}`).join(' \n')
}

function buildLocaleDocs(locale: SearchLocale): SearchDoc[] {
    const messages = (locale === 'en' ? enMessages : koMessages) as unknown as Record<string, MessageTree>
    const docs: SearchDoc[] = []

    for (const page of NAMESPACE_PAGES) {
        const tree = messages[page.ns]
        if (!tree) continue
        const doc = namespaceDoc(tree, page.path, page.type, page.boost)
        if (doc) docs.push(doc)
    }

    const best = messages.BestMaterialsGuides
    if (best) {
        for (const slug of BEST_MATERIALS_GUIDE_SLUGS) {
            const tree = best[slug] as MessageTree | undefined
            if (!tree) continue
            const doc = namespaceDoc(tree, `/guides/${slug}`, 'guide')
            if (doc) docs.push(doc)
        }
    }

    for (const g of locale === 'en' ? NEW_SEO_GUIDES_EN : NEW_SEO_GUIDES) {
        docs.push({
            id: `guide:${g.path}`,
            type: 'guide',
            title: cleanTitle(g.title),
            url: g.path,
            summary: g.description,
            keywords: [g.eyebrow, `${g.h1} ${g.h1Accent}`],
            body: [...g.sections.map((s) => `${s.title} ${s.body}`), faqText(g.faqs)].join(' \n'),
        })
    }

    for (const s of locale === 'en' ? SERVICE_LANDINGS_EN : SERVICE_LANDINGS) {
        docs.push({
            id: `service:${s.path}`,
            type: 'service',
            title: cleanTitle(s.title),
            url: s.path,
            summary: s.description,
            keywords: [...s.keywords, s.eyebrow],
            body: [`${s.h1} ${s.h1Accent}`, ...s.bullets, faqText(s.faqs)].join(' \n'),
        })
    }

    if (locale === 'ko') {
        for (const m of [...WOW3D_PRINT_METHODS, ...REFERENCE_PRINT_METHODS]) {
            docs.push({
                id: `method:${m.id}`,
                type: 'method',
                title: `${m.name} (${m.nameKo})`,
                url: m.serviceHref ?? '/print-methods',
                summary: m.principle,
                keywords: [m.name, m.fullName, m.nameKo, ...m.materials],
                body: [
                    ...m.strengths,
                    ...m.weaknesses,
                    ...m.uses,
                    ...(m.subtypes ?? []).map((st) => `${st.name} ${st.description}`),
                ].join(' \n'),
                boost: m.category === 'wow3d' ? 1 : 0.85,
            })
        }
        for (const c of MAKERSPACES) {
            docs.push({
                id: `page:makerspace:${c.id}`,
                type: 'page',
                title: `${c.name} (${c.label})`,
                url: '/makerspace',
                summary: [c.address, c.addressDetail].filter(Boolean).join(' '),
                keywords: [c.name, c.label, '제작센터', '메이커스페이스'],
                body: [c.phone, c.hours, c.transit].filter(Boolean).join(' \n'),
            })
        }
    }

    return docs
}

const cache: Partial<Record<SearchLocale, SearchDoc[]>> = {}

export function getStaticSearchDocs(locale: SearchLocale): SearchDoc[] {
    if (!cache[locale]) cache[locale] = buildLocaleDocs(locale)
    return cache[locale]!
}
