/**
 * 최신 동향 후보 기사 수집 조건 (관리자 화면·서버 공용)
 * - 키워드·제외어·소스·기간·매칭 방식·정렬·개수·3D프린팅 필터를 조합해 수집한다
 */

export const COLLECT_SOURCES = ['naver', 'bing_ko', 'bing_en', 'rss'] as const
export type CollectSource = (typeof COLLECT_SOURCES)[number]

export const COLLECT_SOURCE_LABEL: Record<CollectSource, string> = {
    naver: '네이버 뉴스 (국내)',
    bing_ko: 'Bing 뉴스 (국내)',
    bing_en: 'Bing 뉴스 (해외·영문)',
    rss: '3D프린팅 전문 매체 (해외 RSS)',
}

export const COLLECT_SOURCE_SHORT: Record<CollectSource, string> = {
    naver: '네이버',
    bing_ko: 'Bing 국내',
    bing_en: 'Bing 해외',
    rss: '전문 매체',
}

export const COLLECT_PERIODS = [1, 3, 7, 14, 30] as const
export type CollectPeriod = (typeof COLLECT_PERIODS)[number]

export const COLLECT_PER_KEYWORD = [10, 30, 50] as const
export type CollectPerKeyword = (typeof COLLECT_PER_KEYWORD)[number]

/** title: 제목에 키워드가 있어야 함(정확) / any: 제목·요약 어디든(넓게) */
export type CollectMatch = 'title' | 'any'
/** date: 최신순 / sim: 정확도순 (네이버 검색 정렬) */
export type CollectSort = 'date' | 'sim'

export type CollectConfig = {
    keywords: string[]
    excludeKeywords: string[]
    sources: CollectSource[]
    periodDays: CollectPeriod
    match: CollectMatch
    sort: CollectSort
    perKeyword: CollectPerKeyword
    /** 3D프린팅 관련도 점수가 기준 이상인 기사만 */
    require3d: boolean
}

export const MAX_COLLECT_KEYWORDS = 10

export const DEFAULT_3D_KEYWORDS = ['3D프린팅', '3D프린터', '적층제조', '3D프린팅 지원사업']

export const DEFAULT_EXCLUDE_KEYWORDS = [
    '특징주', '주가', '목표가', '만원선', '상한가', '하한가', '테마주', '증시', '코스피', '코스닥', '부고', '운세',
]

/** 매일 자동 수집의 기본 조건 — 기존 동작(3D프린팅 전문 수집)과 동일 */
export const DEFAULT_COLLECT_CONFIG: CollectConfig = {
    keywords: DEFAULT_3D_KEYWORDS,
    excludeKeywords: DEFAULT_EXCLUDE_KEYWORDS,
    sources: ['naver', 'rss'],
    periodDays: 14,
    match: 'any',
    sort: 'date',
    perKeyword: 30,
    require3d: true,
}

/** 관리자 화면 "주제 빠른 추가" — 3D프린팅 외 다양한 제조·창업·기술 소식 */
export const COLLECT_TOPIC_PRESETS: { label: string; keywords: string[] }[] = [
    { label: '3D프린팅', keywords: ['3D프린팅', '3D프린터', '적층제조'] },
    { label: '제조·스마트팩토리', keywords: ['스마트팩토리', '제조혁신', '뿌리산업'] },
    { label: '시제품·제품개발', keywords: ['시제품 제작', '제품 개발', '금형'] },
    { label: '창업·지원사업', keywords: ['창업 지원사업', '시제품 제작 지원', '중소기업 바우처'] },
    { label: '소재·신소재', keywords: ['신소재', '엔지니어링 플라스틱', '복합소재'] },
    { label: '로봇·드론', keywords: ['협동로봇', '드론 산업'] },
    { label: 'AI·디지털 전환', keywords: ['제조 AI', '디지털트윈'] },
    { label: '디자인·메이커', keywords: ['산업디자인', '메이커스페이스'] },
    { label: '교육·캡스톤', keywords: ['캡스톤디자인', '메이커 교육'] },
    { label: '해외(영문)', keywords: ['3D printing', 'additive manufacturing', 'rapid prototyping'] },
]

function cleanList(v: unknown, maxItems: number, maxLen = 40): string[] {
    if (!Array.isArray(v)) return []
    const out: string[] = []
    for (const raw of v) {
        const s = String(raw ?? '').replace(/\s+/g, ' ').trim().slice(0, maxLen)
        if (s && !out.some((x) => x.toLowerCase() === s.toLowerCase())) out.push(s)
        if (out.length >= maxItems) break
    }
    return out
}

function pick<T extends string | number>(allowed: readonly T[], v: unknown, fallback: T): T {
    return (allowed as readonly unknown[]).includes(v) ? (v as T) : fallback
}

/** 클라이언트에서 온 값을 검증해 안전한 수집 조건으로 정규화 */
export function normalizeCollectConfig(raw: unknown): CollectConfig {
    const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
    const sources = cleanList(o.sources, COLLECT_SOURCES.length).filter((s): s is CollectSource =>
        (COLLECT_SOURCES as readonly string[]).includes(s)
    )
    return {
        keywords: cleanList(o.keywords, MAX_COLLECT_KEYWORDS),
        excludeKeywords: cleanList(o.excludeKeywords, 30),
        sources: sources.length ? sources : DEFAULT_COLLECT_CONFIG.sources,
        periodDays: pick(COLLECT_PERIODS, Number(o.periodDays), 14),
        match: pick(['title', 'any'] as const, o.match, 'any'),
        sort: pick(['date', 'sim'] as const, o.sort, 'date'),
        perKeyword: pick(COLLECT_PER_KEYWORD, Number(o.perKeyword), 30),
        require3d: o.require3d === undefined ? false : Boolean(o.require3d),
    }
}

export function describeCollectConfig(c: CollectConfig): string {
    const kw = c.keywords.length ? c.keywords.join(', ') : '3D프린팅 기본 키워드'
    return `${kw} · 최근 ${c.periodDays}일 · ${c.sources.map((s) => COLLECT_SOURCE_SHORT[s]).join('/')}`
}
