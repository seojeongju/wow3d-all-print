/**
 * 최신 동향 저장 수집 조건(프리셋) — 관리자 저장·불러오기, 매일 자동 수집 대상
 */

import { normalizeCollectConfig, type CollectConfig } from '@/lib/news-collect-config'

export type NewsCollectPreset = {
    id: number
    name: string
    config: CollectConfig
    autoCollect: boolean
    lastRunAt: string | null
    lastAdded: number | null
}

type PresetRow = {
    id: number
    name: string
    config_json: string
    auto_collect: number
    last_run_at: string | null
    last_added: number | null
}

type Db = {
    prepare(query: string): {
        bind(...values: unknown[]): {
            all<T>(): Promise<{ results?: T[] }>
            first<T>(): Promise<T | null>
            run(): Promise<{ meta?: { changes?: number; last_row_id?: number } }>
        }
    }
}

export const MAX_PRESETS = 20
/** 크론 1회에 자동 수집하는 프리셋 수 상한 — 네이버 API 일일 한도 보호 */
export const MAX_AUTO_PRESETS = 8

function rowToPreset(r: PresetRow): NewsCollectPreset {
    let config: CollectConfig
    try {
        config = normalizeCollectConfig(JSON.parse(r.config_json))
    } catch {
        config = normalizeCollectConfig({})
    }
    return {
        id: Number(r.id),
        name: r.name,
        config,
        autoCollect: Number(r.auto_collect) === 1,
        lastRunAt: r.last_run_at,
        lastAdded: r.last_added === null ? null : Number(r.last_added),
    }
}

const SELECT_COLS = 'id, name, config_json, auto_collect, last_run_at, last_added'

export async function listCollectPresets(db: Db, storeId: number, onlyAuto = false): Promise<NewsCollectPreset[]> {
    const { results } = await db
        .prepare(
            `SELECT ${SELECT_COLS} FROM news_collect_presets
             WHERE store_id = ? ${onlyAuto ? 'AND auto_collect = 1' : ''}
             ORDER BY id ASC LIMIT ${onlyAuto ? MAX_AUTO_PRESETS : MAX_PRESETS}`
        )
        .bind(storeId)
        .all<PresetRow>()
    return (results ?? []).map(rowToPreset)
}

export async function getCollectPreset(db: Db, storeId: number, id: number): Promise<NewsCollectPreset | null> {
    const row = await db
        .prepare(`SELECT ${SELECT_COLS} FROM news_collect_presets WHERE store_id = ? AND id = ?`)
        .bind(storeId, id)
        .first<PresetRow>()
    return row ? rowToPreset(row) : null
}

export function parsePresetBody(raw: unknown): { name: string; config: CollectConfig; autoCollect: boolean } | string {
    const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
    const name = String(o.name ?? '').replace(/\s+/g, ' ').trim().slice(0, 40)
    if (!name) return '조건 이름을 입력하세요'
    const config = normalizeCollectConfig(o.config)
    if (!config.keywords.length) return '키워드를 1개 이상 입력하세요'
    return { name, config, autoCollect: Boolean(o.autoCollect) }
}

export async function markPresetRun(db: Db, id: number, added: number): Promise<void> {
    await db
        .prepare(`UPDATE news_collect_presets SET last_run_at = datetime('now'), last_added = ? WHERE id = ?`)
        .bind(added, id)
        .run()
}
