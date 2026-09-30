import { indexDocs, searchIndex, type IndexedDoc, type SearchDoc, type SearchResult } from './engine'
import { getStaticSearchDocs, type SearchLocale } from './static-docs'
import { getDynamicSearchDocs } from './dynamic-docs'

export type { SearchLocale } from './static-docs'
export type { SearchHit, SearchDocType, SearchResult } from './engine'
export { normalizeQueryKey } from './engine'

const staticIndex: Partial<Record<SearchLocale, IndexedDoc[]>> = {}
const dynamicIndex: Partial<Record<SearchLocale, { source: SearchDoc[]; index: IndexedDoc[] }>> = {}

export function toSearchLocale(v: string | null | undefined): SearchLocale {
    return v === 'en' ? 'en' : 'ko'
}

/** 사이트 통합 검색 (정적 가이드·서비스·소재 + DB FAQ·쇼케이스·맞춤 상품·갤러리) */
export async function searchSite(query: string, locale: SearchLocale, limit = 50): Promise<SearchResult> {
    if (!staticIndex[locale]) staticIndex[locale] = indexDocs(getStaticSearchDocs(locale))

    const dynamicDocs = await getDynamicSearchDocs(locale)
    if (dynamicIndex[locale]?.source !== dynamicDocs) {
        dynamicIndex[locale] = { source: dynamicDocs, index: indexDocs(dynamicDocs) }
    }

    return searchIndex([...staticIndex[locale]!, ...dynamicIndex[locale]!.index], query, limit)
}
