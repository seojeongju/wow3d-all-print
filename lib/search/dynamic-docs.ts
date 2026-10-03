import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getPublishedQnas, localizeQnas } from '@/lib/qna'
import { QNA_EN_BY_QUESTION } from '@/lib/qna-en'
import { getShowcaseCategories } from '@/lib/showcase-public'
import { getCustomProductList } from '@/lib/custom-products-public'
import { parseFeaturesJson } from '@/lib/showcase'
import { getAllPublishedNews } from '@/lib/news-public'
import { NEWS_CATEGORY_LABEL_KO } from '@/lib/news'
import type { SearchDoc } from './engine'
import type { SearchLocale } from './static-docs'

/** DB 콘텐츠는 관리자 수정이 드물어 isolate 단위로 잠시 캐시 */
const CACHE_TTL_MS = 5 * 60 * 1000
const GALLERY_LIMIT = 300

type Db = { prepare(query: string): { all<T>(): Promise<{ results?: T[] }> } }

type GalleryRow = {
    id: number
    title: string
    description: string | null
    material: string | null
    print_method: string | null
    tags: string | null
    image_url: string | null
}

let cache: { at: number; ko: SearchDoc[]; en: SearchDoc[] } | null = null

function stripHtml(s: string | null | undefined): string {
    return (s ?? '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim()
}

function parseTags(raw: unknown): string[] {
    if (typeof raw !== 'string' || !raw) return []
    try {
        const v = JSON.parse(raw)
        return Array.isArray(v) ? v.filter((t): t is string => typeof t === 'string') : []
    } catch {
        return []
    }
}

async function loadFaqDocs(): Promise<{ ko: SearchDoc[]; en: SearchDoc[] }> {
    const qnas = await getPublishedQnas()
    const toDoc = (q: { id: number; question: string; answer: string; category: string }): SearchDoc => ({
        id: `faq:${q.id}`,
        type: 'faq',
        title: q.question,
        url: `/qna?q=${encodeURIComponent(q.question)}`,
        summary: q.answer,
        keywords: [q.category],
    })
    const ko = qnas.map(toDoc)
    const en = localizeQnas(
        qnas.filter((q) => QNA_EN_BY_QUESTION[q.question]),
        'en'
    ).map(toDoc)
    return { ko, en }
}

async function loadShowcaseDocs(db: Db | undefined): Promise<SearchDoc[]> {
    const categories = await getShowcaseCategories()
    const docs: SearchDoc[] = categories.map((c) => ({
        id: `showcase:${c.slug}`,
        type: 'showcase',
        title: c.title,
        url: `/expert/showcase/${c.slug}`,
        summary: c.description,
        keywords: c.features,
        image: c.cardImageUrl || null,
    }))
    if (!db) return docs

    const { results } = await db
        .prepare(
            `SELECT id, category_slug, title, description, features_json
             FROM showcase_examples WHERE is_visible = 1
             ORDER BY sort_order ASC LIMIT 200`
        )
        .all<{ id: number; category_slug: string; title: string; description: string | null; features_json: string | null }>()
    for (const r of results ?? []) {
        if (!r.title) continue
        docs.push({
            id: `showcase:example:${r.id}`,
            type: 'showcase',
            title: r.title,
            url: `/expert/showcase/${r.category_slug}`,
            summary: stripHtml(r.description),
            keywords: r.features_json ? parseFeaturesJson(r.features_json) : [],
        })
    }
    return docs
}

async function loadProductDocs(): Promise<SearchDoc[]> {
    const products = await getCustomProductList()
    return products.map((p) => ({
        id: `product:${p.slug}`,
        type: 'product',
        title: p.title,
        url: `/custom/${p.slug}`,
        summary: p.summary || stripHtml(p.description),
        keywords: p.highlights,
        body: [stripHtml(p.description), stripHtml(p.detailBody), p.priceNote].join(' \n'),
        image: p.images[0] ?? null,
    }))
}

async function loadNewsDocs(): Promise<SearchDoc[]> {
    const posts = await getAllPublishedNews(200)
    return posts.map((p) => ({
        id: `news:${p.id}`,
        type: 'news' as const,
        title: p.title,
        url: `/news/${p.slug}`,
        summary: p.summary.join(' ') || stripHtml(p.bodyHtml).slice(0, 200),
        keywords: [NEWS_CATEGORY_LABEL_KO[p.category], ...p.tags],
        body: [stripHtml(p.bodyHtml), p.insight].join(' \n'),
        image: p.coverUrl,
        boost: 0.9,
    }))
}

async function loadGalleryDocs(db: Db | undefined): Promise<SearchDoc[]> {
    if (!db) return []
    const { results } = await db
        .prepare(
            `SELECT id, title, description, material, print_method, tags, image_url
             FROM gallery_items WHERE is_visible = 1
             ORDER BY created_at DESC LIMIT ${GALLERY_LIMIT}`
        )
        .all<GalleryRow>()
    return (results ?? [])
        .filter((r: GalleryRow) => r.title)
        .map((r: GalleryRow) => ({
            id: `gallery:${r.id}`,
            type: 'gallery' as const,
            title: r.title,
            url: '/gallery',
            summary: stripHtml(r.description),
            keywords: [r.material, r.print_method, ...parseTags(r.tags)].filter((k): k is string => Boolean(k)),
            image: r.image_url && /^(https?:)?\//.test(r.image_url) ? r.image_url : null,
            boost: 0.8,
        }))
}

async function settle<T>(p: Promise<T>, fallback: T, label: string): Promise<T> {
    try {
        return await p
    } catch (e) {
        console.warn(`search: ${label} 로드 실패`, e)
        return fallback
    }
}

/**
 * DB 기반 검색 문서. DB 원문은 한국어뿐이라 영문 검색에는 번역된 FAQ만 포함한다.
 */
export async function getDynamicSearchDocs(locale: SearchLocale): Promise<SearchDoc[]> {
    if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache[locale]

    let db: Db | undefined
    try {
        const { env } = await getCloudflareContext({ async: true })
        db = env?.DB
    } catch {
        db = undefined
    }

    const [faq, showcase, products, gallery, news] = await Promise.all([
        settle(loadFaqDocs(), { ko: [], en: [] }, 'FAQ'),
        settle(loadShowcaseDocs(db), [], '쇼케이스'),
        settle(loadProductDocs(), [], '맞춤 상품'),
        settle(loadGalleryDocs(db), [], '갤러리'),
        settle(loadNewsDocs(), [], '최신 동향'),
    ])

    cache = {
        at: Date.now(),
        ko: [...faq.ko, ...showcase, ...products, ...news, ...gallery],
        en: faq.en,
    }
    return cache[locale]
}
