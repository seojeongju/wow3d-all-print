/**
 * DB 콘텐츠 한국어 → 영어 번역 (Cloudflare Workers AI, 서버 전용)
 * - 여러 문장을 JSON 배열로 묶어 LLM 한 번에 번역하고, 실패한 문장만 다음 모델로 재시도한다
 * - 평문 필드는 줄바꿈째 통으로, HTML 필드는 문단(블록 태그) 단위로 번역해 문맥을 살린다
 * - 번역 전용 모델(m2m100)은 짧은 한국어 조각을 엉뚱하게 옮겨 쓰지 않는다 — 실패하면 저장하지 않고 나중에 재시도
 */

export type AiBinding = {
    run: (model: string, input: Record<string, unknown>) => Promise<unknown>
}

/** 평탄화된 필드 {"title": "...", "options.0.label": "..."} */
export type FlatFields = Record<string, string>

/** 추론형 모델(glm-4.7-flash 등)은 수십 초씩 걸려 제외 */
const LLM_MODELS = [
    '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    '@cf/meta/llama-4-scout-17b-16e-instruct',
] as const

const CHUNK_MAX_ITEMS = 20
const CHUNK_MAX_CHARS = 2400

const HANGUL_RE = /[\u3131-\u318e\uac00-\ud7a3]/
const TAG_RE = /<[^>]*>/g
/** <br>은 나누지 않는다 — 줄바꿈된 문장을 문맥째 번역하도록 (태그 개수는 검증으로 보장) */
const BLOCK_SPLIT_RE =
    /(<\/?(?:p|div|hr|h[1-6]|ul|ol|li|table|thead|tbody|tfoot|tr|td|th|blockquote|figure|figcaption|img|section|article|header|footer|pre|iframe|video|source|picture)\b[^>]*>|\n+)/i

export function hasHangul(text: string | null | undefined): boolean {
    return !!text && HANGUL_RE.test(text)
}

const SYSTEM_PROMPT = `You are a professional Korean-to-English translator for WOW3D, a Korean 3D printing service (FDM and SLA/DLP resin printing, 3D modeling, prototyping, custom products).
Translate every string in the given JSON array into natural, concise English for a product website.
Rules:
- Return JSON only: {"t": ["...", "..."]} with exactly the same number of items in the same order.
- Translate completely. No Korean characters may remain; romanize Korean proper nouns (people, places, schools) when needed.
- Keep line breaks (\\n) where the source has them.
- Some strings contain HTML inline tags or entities such as <br>, <strong>, <span style="...">, <a href="...">, &amp;. Keep every tag exactly as given, in the same order and count, and translate only the text around them.
- Keep numbers, dates, units, model numbers, file formats, URLs, emojis and symbols exactly as they are.
- Names: 와우쓰리디/와우3D → WOW3D, 3D쿠키 → 3D Cookie, 홍대센터 → Hongdae Center, 퓨전360 → Fusion 360.
- Use standard 3D printing terms: 레진 → resin, 출력/출력물 → print / printed part, 시제품 → prototype, 목업 → mockup, 적층 → layer, 필라멘트 → filament, 후가공 → post-processing, 도색 → painting, 모델링 → 3D modeling, 견적 → quote, 문의 → inquiry.
- Do not add explanations, quotes or notes.`

type Source = { text: string; html: boolean }

function sourceKey(s: Source): string {
    return `${s.html ? 'h' : 't'}:${s.text}`
}

function readAiText(raw: unknown): string {
    if (typeof raw === 'string') return raw
    if (!raw || typeof raw !== 'object') return ''
    const o = raw as Record<string, unknown>
    if (typeof o.response === 'string') return o.response
    if (o.response && typeof o.response === 'object') return JSON.stringify(o.response)
    if (typeof o.result === 'string') return o.result
    const choices = o.choices as Array<{ message?: { content?: string } }> | undefined
    return choices?.[0]?.message?.content ?? ''
}

function parseTranslations(text: string, expected: number): unknown[] | null {
    const m = text.match(/\{[\s\S]*\}/)
    if (!m) return null
    try {
        const j = JSON.parse(m[0]) as { t?: unknown }
        return Array.isArray(j.t) && j.t.length === expected ? j.t : null
    } catch {
        return null
    }
}

/** 열고 닫는 태그 짝이 맞는지 (<br> 같은 빈 태그는 제외) */
function isBalanced(tags: string[]): boolean {
    const stack: string[] = []
    for (const tag of tags) {
        const m = tag.match(/^<(\/?)([a-z][a-z0-9]*)/i)
        if (!m || /\/>$/.test(tag) || /^(br|img|hr|wbr|col)$/i.test(m[2])) continue
        const name = m[2].toLowerCase()
        if (!m[1]) stack.push(name)
        else if (stack.pop() !== name) return false
    }
    return stack.length === 0
}

/** 영어 어순에 맞춰 인라인 태그 위치가 바뀌는 것은 허용 — 태그가 빠지거나 바뀌거나 짝이 어긋나면 거부 */
function sameTags(a: string, b: string): boolean {
    const ta = a.match(TAG_RE) ?? []
    const tb = b.match(TAG_RE) ?? []
    if (ta.length !== tb.length) return false
    const sa = [...ta].sort()
    const sb = [...tb].sort()
    return sa.every((t, i) => t === sb[i]) && (!isBalanced(ta) || isBalanced(tb))
}

/** 날짜·치수 같은 두 자리 이상 숫자가 빠지거나 바뀌면 오역으로 본다 */
function keepsNumbers(source: string, out: string): boolean {
    const nums = source.replace(TAG_RE, ' ').match(/\d{2,}/g) ?? []
    return nums.every((n) => out.includes(n))
}

function acceptTranslation(source: Source, value: unknown): string | null {
    if (typeof value !== 'string') return null
    const v = value.trim()
    if (!v || hasHangul(v)) return null
    // 원문보다 터무니없이 길면 설명이 덧붙은 것으로 본다
    if (v.length > source.text.length * 6 + 40) return null
    // 태그가 바뀌면 레이아웃·링크가 깨지므로 버린다 (평문에 태그가 생기는 것도 막음)
    if (!sameTags(source.text, v)) return null
    if (!keepsNumbers(source.text, v)) return null
    return v
}

function chunkSources(sources: Source[]): Source[][] {
    const chunks: Source[][] = []
    let cur: Source[] = []
    let chars = 0
    for (const s of sources) {
        if (cur.length > 0 && (cur.length >= CHUNK_MAX_ITEMS || chars + s.text.length > CHUNK_MAX_CHARS)) {
            chunks.push(cur)
            cur = []
            chars = 0
        }
        cur.push(s)
        chars += s.text.length
    }
    if (cur.length > 0) chunks.push(cur)
    return chunks
}

async function runLlm(ai: AiBinding, model: string, sources: Source[]): Promise<unknown[] | null> {
    const raw = await ai.run(model, {
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: JSON.stringify(sources.map((s) => s.text)) },
        ],
        max_tokens: 4096,
        temperature: 0.2,
    })
    return parseTranslations(readAiText(raw), sources.length)
}

/** 응답 개수가 어긋나면 묶음을 반으로 나눠 다시 묻는다 (한 문장씩까지) */
async function translateChunkWithLlm(ai: AiBinding, model: string, sources: Source[]): Promise<(string | null)[]> {
    let parsed: unknown[] | null = null
    try {
        parsed = await runLlm(ai, model, sources)
    } catch (e) {
        // 일시적인 내부 오류가 잦아 한 번만 다시 시도
        console.warn('[content-translate] LLM 호출 실패, 재시도', model, e)
        await new Promise((r) => setTimeout(r, 800))
        try {
            parsed = await runLlm(ai, model, sources)
        } catch (e2) {
            console.warn('[content-translate] LLM 재시도 실패', model, e2)
            return sources.map(() => null)
        }
    }
    if (parsed) return sources.map((src, i) => acceptTranslation(src, parsed[i]))
    if (sources.length === 1) return [null]
    const mid = Math.ceil(sources.length / 2)
    const [a, b] = await Promise.all([
        translateChunkWithLlm(ai, model, sources.slice(0, mid)),
        translateChunkWithLlm(ai, model, sources.slice(mid)),
    ])
    return [...a, ...b]
}

/** 한국어 문장 목록 → 영어. 끝내 번역하지 못한 문장은 null */
async function translateSources(ai: AiBinding, sources: Source[]): Promise<(string | null)[]> {
    const unique = new Map<string, Source>()
    for (const s of sources) if (hasHangul(s.text)) unique.set(sourceKey(s), s)
    const done = new Map<string, string>()

    for (const chunk of chunkSources([...unique.values()])) {
        let remaining = chunk
        for (const model of LLM_MODELS) {
            if (remaining.length === 0) break
            const results = await translateChunkWithLlm(ai, model, remaining)
            remaining.forEach((src, i) => {
                const r = results[i]
                if (r) done.set(sourceKey(src), r)
            })
            remaining = remaining.filter((src) => !done.has(sourceKey(src)))
        }
    }

    return sources.map((s) => (hasHangul(s.text) ? done.get(sourceKey(s)) ?? null : s.text))
}

/** 평문 정리 — &nbsp;·빈 줄·줄 앞뒤 공백 제거 (게시판에서 옮겨 온 설명에 많음) */
function normalizePlain(value: string): string {
    return value
        .replace(/&nbsp;|\u00a0|\u200b/g, ' ')
        .split('\n')
        .map((line) => line.replace(/[ \t]+/g, ' ').trim())
        .filter(Boolean)
        .join('\n')
}

type Piece = { keep: string } | { lead: string; core: string; trail: string }

/** HTML은 블록 태그·줄바꿈은 그대로 두고 한글이 든 조각만, 평문은 통째로 번역 대상으로 만든다 */
function splitField(value: string, html: boolean): Piece[] {
    if (!html) return [{ lead: '', core: normalizePlain(value), trail: '' }]
    return value.split(BLOCK_SPLIT_RE).map((part, i) => {
        if (i % 2 === 1 || !hasHangul(part)) return { keep: part }
        const lead = part.match(/^\s*/)?.[0] ?? ''
        const trail = part.match(/\s*$/)?.[0] ?? ''
        return { lead, core: part.slice(lead.length, part.length - trail.length), trail }
    })
}

export type FieldSet = {
    fields: FlatFields
    /** HTML로 저장된 필드 키 */
    htmlKeys?: ReadonlySet<string>
}

/**
 * 여러 항목의 필드를 한 번에 번역한다 (AI 호출 횟수 절약).
 * 한 조각이라도 번역에 실패한 항목은 null — 반쯤 한국어인 번역을 캐시하지 않기 위함
 */
export async function translateFieldSets(ai: AiBinding, sets: FieldSet[]): Promise<(FlatFields | null)[]> {
    const split = sets.map(({ fields, htmlKeys }) =>
        Object.entries(fields).map(([key, value]) => {
            const html = htmlKeys?.has(key) ?? false
            return { key, html, pieces: splitField(value, html) }
        })
    )

    const sources: Source[] = []
    for (const entries of split) {
        for (const e of entries) {
            for (const p of e.pieces) if ('core' in p) sources.push({ text: p.core, html: e.html })
        }
    }
    const translated = await translateSources(ai, sources)
    const byKey = new Map<string, string | null>()
    sources.forEach((s, i) => byKey.set(sourceKey(s), translated[i]))

    return split.map((entries) => {
        const out: FlatFields = {}
        for (const e of entries) {
            let value = ''
            for (const p of e.pieces) {
                if ('keep' in p) {
                    value += p.keep
                    continue
                }
                const t = byKey.get(sourceKey({ text: p.core, html: e.html }))
                if (!t) return null
                value += p.lead + t + p.trail
            }
            out[e.key] = value
        }
        return out
    })
}
