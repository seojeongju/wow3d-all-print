/**
 * DB 콘텐츠 다국어 캐시 (content_translations 테이블, 서버 전용)
 * - 영문 페이지는 저장된 번역을 즉시 적용하고, 번역이 없거나 원문이 바뀐 항목은 응답 후 백그라운드로 번역한다
 * - 번역이 아직 없으면 한국어 원문을 그대로 보여 준다 (페이지 응답을 AI 호출로 막지 않음)
 */
import { getCloudflareContext } from '@opennextjs/cloudflare'
import {
    hasHangul,
    translateFieldSets,
    type AiBinding,
    type FlatFields,
} from '@/lib/content-translate-ai'

export type TranslationEntityType = 'gallery' | 'custom_product'
export type TranslationProvider = 'manual' | 'workers-ai'

/** 현재 번역 대상 언어 (기본 언어 ko는 원문) */
const TARGET_LOCALE = 'en'

export type LocalizeSpec<T> = {
    type: TranslationEntityType
    idOf: (item: T) => string
    /** 번역할 한국어 필드 (pickHangulFields로 한글이 든 필드만) */
    extract: (item: T) => FlatFields
    apply: (item: T, translated: FlatFields) => T
    htmlKeys?: (item: T) => ReadonlySet<string>
}

type Db = {
    prepare(query: string): {
        bind(...values: unknown[]): {
            all<R = unknown>(): Promise<{ results?: R[] }>
            run(): Promise<unknown>
        }
    }
}

type StoredTranslation = { hash: string; fields: FlatFields; provider: string }

type PendingItem = { id: string; hash: string; fields: FlatFields; htmlKeys?: ReadonlySet<string> }

const ID_CHUNK = 90
/** 한 요청이 백그라운드로 번역하는 최대 항목 수 (waitUntil 시간 한도 대비) */
const MAX_BACKGROUND_ITEMS = 20
/** AI 한 번에 묶는 항목 수 */
const ITEMS_PER_AI_BATCH = 10
const FAIL_COOLDOWN_MS = 10 * 60 * 1000

const inflight = new Set<string>()
const failedAt = new Map<string, number>()
let tableMissingWarned = false

/** [키, 값] 목록에서 한글이 든 값만 번역 대상으로 고른다 */
export function pickHangulFields(entries: Array<[string, string | null | undefined]>): FlatFields {
    const out: FlatFields = {}
    for (const [key, value] of entries) {
        if (typeof value === 'string' && hasHangul(value)) out[key] = value
    }
    return out
}

/** 원문 필드 해시 (cyrb53) — 원문이 바뀌었는지 판단용 */
export function hashFields(fields: FlatFields): string {
    const str = JSON.stringify(Object.keys(fields).sort().map((k) => [k, fields[k]]))
    let h1 = 0xdeadbeef
    let h2 = 0x41c6ce57
    for (let i = 0; i < str.length; i++) {
        const ch = str.charCodeAt(i)
        h1 = Math.imul(h1 ^ ch, 2654435761)
        h2 = Math.imul(h2 ^ ch, 1597334677)
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}

function isMissingTable(e: unknown): boolean {
    return /no such table/i.test(e instanceof Error ? e.message : String(e))
}

async function loadStored(
    db: Db,
    type: TranslationEntityType,
    ids: string[]
): Promise<Map<string, StoredTranslation>> {
    const map = new Map<string, StoredTranslation>()
    const unique = [...new Set(ids)]
    try {
        for (let i = 0; i < unique.length; i += ID_CHUNK) {
            const part = unique.slice(i, i + ID_CHUNK)
            const res = await db
                .prepare(
                    `SELECT entity_id, source_hash, fields_json, provider FROM content_translations
                     WHERE entity_type = ? AND locale = ? AND entity_id IN (${part.map(() => '?').join(',')})`
                )
                .bind(type, TARGET_LOCALE, ...part)
                .all<{ entity_id: string; source_hash: string; fields_json: string; provider: string }>()
            for (const row of res.results ?? []) {
                try {
                    const fields = JSON.parse(row.fields_json) as FlatFields
                    map.set(row.entity_id, { hash: row.source_hash, fields, provider: row.provider })
                } catch {
                    /* 손상된 행은 재번역 대상 */
                }
            }
        }
    } catch (e) {
        if (isMissingTable(e)) {
            if (!tableMissingWarned) {
                tableMissingWarned = true
                console.warn('content_translations 테이블이 없습니다. migrations/schema_content_translations.sql 을 실행하세요.')
            }
        } else {
            console.warn('content_translations 조회 실패', e)
        }
    }
    return map
}

export async function saveTranslation(
    db: Db,
    type: TranslationEntityType,
    id: string,
    hash: string,
    fields: FlatFields,
    provider: TranslationProvider
): Promise<void> {
    await db
        .prepare(
            `INSERT INTO content_translations (entity_type, entity_id, locale, source_hash, fields_json, provider)
             VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT(entity_type, entity_id, locale) DO UPDATE SET
                source_hash = excluded.source_hash,
                fields_json = excluded.fields_json,
                provider = excluded.provider,
                updated_at = datetime('now')`
        )
        .bind(type, id, TARGET_LOCALE, hash, JSON.stringify(fields), provider)
        .run()
}

async function translateAndStore(
    db: Db,
    ai: AiBinding,
    type: TranslationEntityType,
    items: PendingItem[]
): Promise<{ translated: number; failed: number }> {
    let translated = 0
    let failed = 0
    for (let i = 0; i < items.length; i += ITEMS_PER_AI_BATCH) {
        const batch = items.slice(i, i + ITEMS_PER_AI_BATCH)
        let results: (FlatFields | null)[]
        try {
            results = await translateFieldSets(
                ai,
                batch.map((it) => ({ fields: it.fields, htmlKeys: it.htmlKeys }))
            )
        } catch (e) {
            console.warn('[content-translations] 번역 실패', type, e)
            results = batch.map(() => null)
        }
        for (let j = 0; j < batch.length; j++) {
            const item = batch[j]
            const key = `${type}:${item.id}`
            const fields = results[j]
            if (!fields) {
                failed++
                failedAt.set(key, Date.now())
                continue
            }
            try {
                await saveTranslation(db, type, item.id, item.hash, fields, 'workers-ai')
                failedAt.delete(key)
                translated++
            } catch (e) {
                failed++
                console.warn('[content-translations] 저장 실패', key, e)
            }
        }
    }
    return { translated, failed }
}

function collectPending<T>(
    items: T[],
    spec: LocalizeSpec<T>,
    stored: Map<string, StoredTranslation>
): PendingItem[] {
    const pending: PendingItem[] = []
    const seen = new Set<string>()
    for (const item of items) {
        const fields = spec.extract(item)
        if (Object.keys(fields).length === 0) continue
        const id = spec.idOf(item)
        if (seen.has(id)) continue
        seen.add(id)
        const hash = hashFields(fields)
        if (stored.get(id)?.hash === hash) continue
        pending.push({ id, hash, fields, htmlKeys: spec.htmlKeys?.(item) })
    }
    return pending
}

/**
 * 영문 요청이면 저장된 번역을 적용한다.
 * background(기본 true)면 번역이 없거나 낡은 항목을 응답 후 번역해 저장한다.
 */
export async function localizeEntities<T>(
    items: T[],
    locale: string | null | undefined,
    spec: LocalizeSpec<T>,
    options?: { background?: boolean }
): Promise<T[]> {
    if (locale !== TARGET_LOCALE || items.length === 0) return items

    let env: { DB?: Db; AI?: AiBinding } | undefined
    let ctx: { waitUntil(p: Promise<unknown>): void } | undefined
    try {
        const cf = await getCloudflareContext({ async: true })
        env = cf.env as typeof env
        ctx = cf.ctx as typeof ctx
    } catch {
        return items
    }
    const db = env?.DB
    if (!db) return items

    const ids = items.filter((it) => Object.keys(spec.extract(it)).length > 0).map(spec.idOf)
    if (ids.length === 0) return items
    const stored = await loadStored(db, spec.type, ids)

    const localized = items.map((item) => {
        const row = stored.get(spec.idOf(item))
        // 원문이 바뀌어 낡은 번역이라도 재번역 전까지는 한국어보다 낫다
        return row ? spec.apply(item, row.fields) : item
    })

    const ai = env?.AI
    if (options?.background !== false && ai?.run) {
        const now = Date.now()
        const pending = collectPending(items, spec, stored)
            .filter((p) => {
                const key = `${spec.type}:${p.id}`
                if (inflight.has(key)) return false
                const failed = failedAt.get(key)
                return !failed || now - failed > FAIL_COOLDOWN_MS
            })
            .slice(0, MAX_BACKGROUND_ITEMS)
        if (pending.length > 0) {
            const keys = pending.map((p) => `${spec.type}:${p.id}`)
            keys.forEach((k) => inflight.add(k))
            const job = translateAndStore(db, ai, spec.type, pending)
                .catch((e) => console.warn('[content-translations] 백그라운드 번역 실패', e))
                .finally(() => keys.forEach((k) => inflight.delete(k)))
            try {
                ctx?.waitUntil(job)
            } catch {
                void job
            }
        }
    }

    return localized
}

export type BackfillResult = {
    /** 번역이 필요한 전체 항목 수 (한글 필드가 있는 항목) */
    total: number
    translated: number
    failed: number
    /** 이번 호출 후에도 번역이 없거나 낡은 항목 수 */
    remaining: number
}

/** 관리자 화면용 — 번역이 필요한 항목 수와 아직 번역이 없거나 낡은 항목 수 */
export async function getTranslationStatus<T>(
    db: Db,
    spec: LocalizeSpec<T>,
    items: T[]
): Promise<{ total: number; remaining: number }> {
    const withText = items.filter((it) => Object.keys(spec.extract(it)).length > 0)
    const stored = await loadStored(db, spec.type, withText.map(spec.idOf))
    return {
        total: new Set(withText.map(spec.idOf)).size,
        remaining: collectPending(withText, spec, stored).length,
    }
}

/** 관리자 일괄 번역 — 번역이 없거나 낡은 항목을 limit개까지 즉시 번역한다 */
export async function backfillTranslations<T>(
    db: Db,
    ai: AiBinding,
    spec: LocalizeSpec<T>,
    items: T[],
    limit: number
): Promise<BackfillResult> {
    const withText = items.filter((it) => Object.keys(spec.extract(it)).length > 0)
    const stored = await loadStored(db, spec.type, withText.map(spec.idOf))
    // 직전에 실패한 항목은 뒤로 미뤄 같은 항목에서 반복 호출이 멈추지 않게 한다
    const pending = collectPending(withText, spec, stored).sort(
        (a, b) => (failedAt.get(`${spec.type}:${a.id}`) ?? 0) - (failedAt.get(`${spec.type}:${b.id}`) ?? 0)
    )
    const { translated, failed } = await translateAndStore(db, ai, spec.type, pending.slice(0, limit))
    return {
        total: new Set(withText.map(spec.idOf)).size,
        translated,
        failed,
        remaining: pending.length - translated,
    }
}
