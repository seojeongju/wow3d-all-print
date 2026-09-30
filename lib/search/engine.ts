import { SYNONYM_GROUPS } from './synonyms'

export type SearchDocType = 'guide' | 'service' | 'faq' | 'material' | 'method' | 'showcase' | 'product' | 'gallery' | 'page'

export type SearchDoc = {
    id: string
    type: SearchDocType
    title: string
    url: string
    summary: string
    keywords?: string[]
    body?: string
    image?: string | null
    /** 순위 가중치 (기본 1). 약관 등 참고 페이지는 낮게 */
    boost?: number
}

export type SearchHit = {
    id: string
    type: SearchDocType
    title: string
    url: string
    snippet: string
    image: string | null
    score: number
}

export type SearchResult = {
    hits: SearchHit[]
    /** 결과 강조 표시에 쓸 실제 매칭 단어 */
    terms: string[]
    total: number
    /** 오타를 교정했을 때 교정된 검색어 */
    corrected: string | null
}

type IndexedField = { norm: string; compact: string; weight: number }

export type IndexedDoc = {
    doc: SearchDoc
    fields: IndexedField[]
    /** 오타 교정용: 제목·키워드·요약 단어와 자모 분해형 */
    fuzzyWords: { word: string; jamo: string }[]
    rawSummary: string
    rawBody: string
}

type Variant = {
    text: string
    compact: string
    weight: number
    latinShort: boolean
    singleSyllable: boolean
    /** 짧은 영문(pla·abs 등)은 단어 경계로만 매칭 */
    boundary: RegExp | null
}
type Term = { raw: string; variants: Variant[] }

const FIELD_WEIGHTS = { title: 10, keywords: 7, summary: 4, body: 1.5 } as const
const MIN_SCORE = 1.5
const FULL_MATCH_ENOUGH = 5
const SNIPPET_BEFORE = 40
const SNIPPET_LENGTH = 140

const KO_PARTICLES = [
    '에서는', '으로는', '이라는', '에서도', '까지는',
    '에서', '으로', '에게', '까지', '부터', '처럼', '보다', '이나', '이랑', '하고', '에는', '와의', '과의', '이란', '라는',
    '은', '는', '이', '가', '을', '를', '에', '의', '로', '와', '과', '도', '만', '랑',
    '스러운', '적인', '하게', '하는', '한', '적',
]

const STOPWORDS = new Set([
    '어떻게', '무엇', '뭐', '뭐가', '뭔가요', '있나요', '되나요', '하나요', '인가요', '좋아요', '좋은', '알려줘', '알려주세요',
    '어떤', '방법은', '가능한가요', '가능해요', '할까요', '해야', '하는',
    'the', 'a', 'an', 'of', 'for', 'to', 'in', 'and', 'or', 'how', 'what', 'is', 'are', 'do', 'does', 'can', 'i', 'my', 'with', 'vs',
])

/** 소문자·전각 정규화, 문장부호를 공백으로 */
export function normalizeText(s: string): string {
    return s
        .normalize('NFKC')
        .toLowerCase()
        .replace(/<[^>]+>/g, ' ')
        .replace(/[{}[\]()<>"'`~!@#$%^&*=+|\\/:;,.?·…“”‘’「」『』《》〈〉【】]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

function compactText(s: string): string {
    return s.replace(/\s+/g, '')
}

const HANGUL_START = 0xac00
const HANGUL_END = 0xd7a3

/** 한글 음절을 자모로 분해 (오타 허용 비교용) */
function toJamo(s: string): string {
    let out = ''
    for (const ch of s) {
        const c = ch.charCodeAt(0)
        if (c >= HANGUL_START && c <= HANGUL_END) {
            const i = c - HANGUL_START
            out += String.fromCharCode(0x1100 + Math.floor(i / 588), 0x1161 + Math.floor((i % 588) / 28))
            const t = i % 28
            if (t) out += String.fromCharCode(0x11a7 + t)
        } else {
            out += ch
        }
    }
    return out
}

function isHangul(s: string): boolean {
    return /[\uac00-\ud7a3]/.test(s)
}

function boundedLevenshtein(a: string, b: string, max: number): number {
    if (Math.abs(a.length - b.length) > max) return max + 1
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
    for (let i = 1; i <= a.length; i++) {
        const cur = [i]
        let rowMin = i
        for (let j = 1; j <= b.length; j++) {
            const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
            cur.push(v)
            if (v < rowMin) rowMin = v
        }
        if (rowMin > max) return max + 1
        prev = cur
    }
    return prev[b.length]
}

function maxTypoDistance(jamoTerm: string, hangul: boolean): number {
    const len = jamoTerm.length
    if (hangul) return len < 5 ? 0 : len < 9 ? 1 : 2
    return len < 4 ? 0 : len < 8 ? 1 : 2
}

const synonymIndex: Map<string, string[]> = (() => {
    const map = new Map<string, string[]>()
    for (const group of SYNONYM_GROUPS) {
        const members = group.map((m) => normalizeText(m))
        for (const m of members) {
            const key = compactText(m)
            const list = map.get(key) ?? []
            for (const other of members) if (!list.includes(other)) list.push(other)
            map.set(key, list)
        }
    }
    return map
})()

/** 띄어쓰기가 있는 동의어 표현(예: lead time)은 한 단어로 묶는다 */
const multiWordSynonyms: string[] = Array.from(
    new Set(SYNONYM_GROUPS.flat().map((m) => normalizeText(m)).filter((m) => m.includes(' ')))
).sort((a, b) => b.length - a.length)

function stripParticle(token: string): string | null {
    if (!isHangul(token)) return null
    for (const p of KO_PARTICLES) {
        if (token.length - p.length >= 2 && token.endsWith(p)) return token.slice(0, -p.length)
    }
    return null
}

function makeVariant(text: string, weight: number): Variant {
    const compact = compactText(text)
    const latinShort = /^[a-z0-9]{1,3}$/.test(compact)
    return {
        text,
        compact,
        weight,
        latinShort,
        singleSyllable: compact.length === 1 && isHangul(compact),
        boundary: latinShort ? new RegExp(`(^|[^a-z0-9])${compact}([^a-z0-9]|$)`) : null,
    }
}

function buildTerms(query: string): Term[] {
    let norm = normalizeText(query)
    for (const phrase of multiWordSynonyms) {
        if (norm.includes(phrase)) norm = norm.split(phrase).join(compactText(phrase))
    }
    let tokens = norm.split(' ').filter(Boolean)
    const meaningful = tokens.filter((t) => !STOPWORDS.has(t))
    if (meaningful.length > 0) tokens = meaningful
    tokens = Array.from(new Set(tokens)).slice(0, 8)

    return tokens.map((raw) => {
        const variants: Variant[] = []
        const seen = new Set<string>()
        const push = (text: string, weight: number) => {
            const v = makeVariant(text, weight)
            if (!v.compact || seen.has(v.compact)) return
            seen.add(v.compact)
            variants.push(v)
        }
        push(raw, 1)
        const stripped = stripParticle(raw)
        if (stripped) push(stripped, 1)
        for (const base of [raw, stripped]) {
            if (!base) continue
            for (const syn of synonymIndex.get(compactText(base)) ?? []) push(syn, 0.7)
        }
        return { raw, variants }
    })
}

function fieldContains(field: IndexedField, v: Variant): boolean {
    if (v.boundary) return v.boundary.test(field.norm)
    return field.norm.includes(v.text) || field.compact.includes(v.compact)
}

function termOccurs(index: IndexedDoc[], term: Term): boolean {
    return index.some((e) => e.fields.some((f) => f.norm && term.variants.some((v) => fieldContains(f, v))))
}

/**
 * 사이트 어디에도 없는 단어는 오타로 보고, 제목·키워드·요약 어휘 중 가장 가까운 단어로 교정해 함께 검색한다.
 * 반환값: 원래 단어 → 교정 단어
 */
function correctTypos(index: IndexedDoc[], terms: Term[]): Map<string, string> {
    const corrections = new Map<string, string>()
    for (const term of terms) {
        const primary = term.variants[0]
        if (!primary || primary.latinShort || termOccurs(index, term)) continue
        const jamo = toJamo(primary.compact)
        const max = maxTypoDistance(jamo, isHangul(primary.compact))
        if (max === 0) continue

        const freq = new Map<string, number>()
        let best: { word: string; dist: number } | null = null
        for (const entry of index) {
            for (const w of entry.fuzzyWords) {
                const dist = boundedLevenshtein(jamo, w.jamo, max)
                if (dist > max) continue
                freq.set(w.word, (freq.get(w.word) ?? 0) + 1)
                if (!best || dist < best.dist || (dist === best.dist && (freq.get(w.word) ?? 0) > (freq.get(best.word) ?? 0))) {
                    best = { word: w.word, dist }
                }
            }
        }
        if (!best) continue

        corrections.set(term.raw, best.word)
        const seen = new Set(term.variants.map((v) => v.compact))
        for (const [text, weight] of [[best.word, 0.9] as const, ...(synonymIndex.get(compactText(best.word)) ?? []).map((s) => [s, 0.6] as const)]) {
            const v = makeVariant(text, weight)
            if (!seen.has(v.compact)) {
                seen.add(v.compact)
                term.variants.push(v)
            }
        }
    }
    return corrections
}

export function indexDocs(docs: SearchDoc[]): IndexedDoc[] {
    return docs.map((doc) => {
        const keywords = (doc.keywords ?? []).join(' ')
        const parts: [string, number][] = [
            [doc.title, FIELD_WEIGHTS.title],
            [keywords, FIELD_WEIGHTS.keywords],
            [doc.summary, FIELD_WEIGHTS.summary],
            [doc.body ?? '', FIELD_WEIGHTS.body],
        ]
        const fields = parts.map(([text, weight]) => {
            const norm = normalizeText(text)
            return { norm, compact: compactText(norm), weight }
        })
        const fuzzyWords = Array.from(
            new Set(`${fields[0].norm} ${fields[1].norm} ${fields[2].norm}`.split(' ').filter((w) => w.length >= 2))
        ).map((word) => ({ word, jamo: toJamo(word) }))
        return {
            doc,
            fields,
            fuzzyWords,
            rawSummary: doc.summary,
            rawBody: doc.body ?? '',
        }
    })
}

function scoreTerm(entry: IndexedDoc, term: Term, matched: Set<string>): number {
    let best = 0
    for (const v of term.variants) {
        let s = 0
        for (const f of entry.fields) {
            if (f.norm && fieldContains(f, v)) s += f.weight
        }
        if (v.singleSyllable) s *= 0.5
        s *= v.weight
        if (s > 0) matched.add(v.text)
        if (s > best) best = s
    }
    if (best > 0) return best

    const primary = term.variants[0]
    if (!primary || primary.latinShort) return 0
    const hangul = isHangul(primary.compact)
    const jamo = toJamo(primary.compact)
    const max = maxTypoDistance(jamo, hangul)
    if (max === 0) return 0
    for (const { jamo: w } of entry.fuzzyWords) {
        if (w.length <= jamo.length + max) {
            if (boundedLevenshtein(jamo, w, max) <= max) return FIELD_WEIGHTS.title * 0.4
            continue
        }
        // 복합어(예: 필라멘트출력) 안의 오타도 잡도록 같은 길이 구간을 훑는다
        for (let i = 0; i + jamo.length <= w.length; i++) {
            if (boundedLevenshtein(jamo, w.slice(i, i + jamo.length), max) <= max) return FIELD_WEIGHTS.title * 0.4
        }
    }
    return 0
}

function findSnippet(text: string, needles: string[]): string | null {
    if (!text) return null
    const lower = text.toLowerCase()
    let pos = -1
    for (const n of needles) {
        const i = lower.indexOf(n)
        if (i >= 0 && (pos < 0 || i < pos)) pos = i
    }
    if (pos < 0) return null
    const start = Math.max(0, pos - SNIPPET_BEFORE)
    const end = Math.min(text.length, start + SNIPPET_LENGTH)
    return `${start > 0 ? '…' : ''}${text.slice(start, end).replace(/\s+/g, ' ').trim()}${end < text.length ? '…' : ''}`
}

function clip(text: string): string {
    const t = text.replace(/\s+/g, ' ').trim()
    return t.length > SNIPPET_LENGTH ? `${t.slice(0, SNIPPET_LENGTH)}…` : t
}

export function searchIndex(index: IndexedDoc[], query: string, limit = 50): SearchResult {
    const terms = buildTerms(query)
    if (terms.length === 0) return { hits: [], terms: [], total: 0, corrected: null }
    const corrections = correctTypos(index, terms)
    const corrected = corrections.size > 0 ? terms.map((t) => corrections.get(t.raw) ?? t.raw).join(' ') : null

    const phrase = compactText(normalizeText(query))
    const allMatched = new Set<string>()
    const scored: { entry: IndexedDoc; score: number; matched: Set<string>; full: boolean }[] = []

    for (const entry of index) {
        const matched = new Set<string>()
        let score = 0
        let matchedTerms = 0
        for (const term of terms) {
            const s = scoreTerm(entry, term, matched)
            if (s > 0) matchedTerms++
            score += s
        }
        if (matchedTerms === 0) continue

        const coverage = matchedTerms / terms.length
        if (coverage < 1) score *= 0.35 * coverage

        if (phrase.length >= 2 && terms.length > 1) {
            if (entry.fields[0].compact.includes(phrase)) score += 12
            else if (entry.fields[2].compact.includes(phrase)) score += 5
            else if (entry.fields[3].compact.includes(phrase)) score += 2
        }
        score *= entry.doc.boost ?? 1
        if (score < MIN_SCORE) continue

        scored.push({ entry, score, matched, full: coverage === 1 })
    }

    scored.sort((a, b) => b.score - a.score)
    // 모든 단어가 들어간 결과가 충분하면 일부 단어만 걸린 결과는 뺀다
    const ranked = scored.filter((s) => s.full).length >= FULL_MATCH_ENOUGH ? scored.filter((s) => s.full) : scored
    for (const s of ranked) s.matched.forEach((m) => allMatched.add(m))

    const hits = ranked.slice(0, limit).map(({ entry, score, matched }) => {
        const needles = Array.from(matched).sort((a, b) => b.length - a.length)
        const snippet =
            findSnippet(entry.rawSummary, needles) ??
            findSnippet(entry.rawBody, needles) ??
            clip(entry.rawSummary || entry.rawBody)
        return {
            id: entry.doc.id,
            type: entry.doc.type,
            title: entry.doc.title,
            url: entry.doc.url,
            snippet,
            image: entry.doc.image ?? null,
            score: Math.round(score * 10) / 10,
        }
    })

    return {
        hits,
        terms: Array.from(allMatched).sort((a, b) => b.length - a.length),
        total: ranked.length,
        corrected,
    }
}

/** 검색어 통계 집계용 정규화 키 */
export function normalizeQueryKey(query: string): string {
    return normalizeText(query).slice(0, 100)
}
