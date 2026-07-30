/**
 * 서버측 SLA/DLP 견적 재계산 (DB 소재·장비 단가 기준)
 */

import {
    calculateResinQuote,
    clampSlaLayerHeight,
    resinDefaults,
    resinMethodToMaterialType,
    SLA_LAYER_DEFAULT,
    type ResinMethod,
} from '@/lib/resin-quote'

type D1Like = {
    prepare: (sql: string) => {
        bind: (...args: unknown[]) => {
            first: <T = Record<string, unknown>>() => Promise<T | null>
            all: <T = Record<string, unknown>>() => Promise<{ results?: T[] }>
        }
        first: <T = Record<string, unknown>>() => Promise<T | null>
        all: <T = Record<string, unknown>>() => Promise<{ results?: T[] }>
    }
}

export type ServerResinQuoteInput = {
    method: ResinMethod
    volumeCm3: number
    heightMm: number
    layerHeightMm: number | null
    resinTypeName: string | null
    postProcessing: boolean
    clientTotalPrice: number
    clientEstimatedHours: number
}

export type ServerResinQuoteResult = {
    totalPrice: number
    estimatedTimeHours: number
    volumeMl: number
    source: 'server' | 'client'
    deltaKr?: number
}

function parseLayerCosts(json: string | null | undefined): Record<string, number> | undefined {
    if (!json) return undefined
    try {
        const o = JSON.parse(json)
        if (!o || typeof o !== 'object' || Array.isArray(o)) return undefined
        const out: Record<string, number> = {}
        for (const [k, v] of Object.entries(o)) {
            const n = Number(v)
            if (Number.isFinite(n) && n >= 0) out[String(k)] = n
        }
        return Object.keys(out).length ? out : undefined
    } catch {
        return undefined
    }
}

async function loadResinMaterial(
    db: D1Like,
    method: ResinMethod,
    name: string | null
): Promise<{ pricePerMl: number; name: string } | null> {
    const type = resinMethodToMaterialType(method)
    const rows = await db
        .prepare(
            `SELECT name, price_per_ml FROM materials
             WHERE type = ? AND (is_active = 1 OR is_active IS NULL)
             ORDER BY sort_order ASC, name ASC`
        )
        .bind(type)
        .all<{ name: string; price_per_ml: number | null }>()

    const list = rows.results || []
    if (!list.length) return null

    const want = (name || '').trim().toLowerCase()
    const hit =
        list.find((m) => m.name.trim().toLowerCase() === want) ||
        list.find((m) => want && m.name.trim().toLowerCase().includes(want)) ||
        list[0]

    return {
        name: hit.name,
        pricePerMl: Number(hit.price_per_ml) || 0,
    }
}

async function loadResinEquipment(db: D1Like, method: ResinMethod) {
    const type = resinMethodToMaterialType(method)
    const defaults = resinDefaults(method)

    const row = await db
        .prepare(`SELECT * FROM printer_equipment WHERE is_active = 1 AND UPPER(type) = ? LIMIT 1`)
        .bind(type)
        .first<{
            hourly_rate: number
            layer_costs_json: string | null
            min_price_krw: number | null
            sla_layer_exposure_sec: number | null
            sla_labor_cost_krw: number | null
            sla_consumables_krw: number | null
            sla_post_process_krw: number | null
            dlp_layer_exposure_sec: number | null
            dlp_labor_cost_krw: number | null
            dlp_consumables_krw: number | null
            dlp_post_process_krw: number | null
        }>()

    if (!row) {
        return {
            hourlyRate: defaults.hourlyRateKr,
            layerCosts: undefined as Record<string, number> | undefined,
            layerExposureSec: defaults.layerExposureSec,
            laborCostKrw: defaults.laborCostKrw,
            consumablesKrw: defaults.consumablesKrw,
            postProcessKrw: defaults.postProcessKrw,
            minPriceKr: undefined as number | undefined,
        }
    }

    const minPrice =
        row.min_price_krw != null && Number(row.min_price_krw) > 0 ? Number(row.min_price_krw) : undefined

    if (method === 'dlp') {
        return {
            hourlyRate: Number(row.hourly_rate) || defaults.hourlyRateKr,
            layerCosts: parseLayerCosts(row.layer_costs_json),
            ...(minPrice != null ? { minPriceKr: minPrice } : {}),
            layerExposureSec: row.dlp_layer_exposure_sec ?? defaults.layerExposureSec,
            laborCostKrw: row.dlp_labor_cost_krw ?? defaults.laborCostKrw,
            consumablesKrw: row.dlp_consumables_krw ?? defaults.consumablesKrw,
            postProcessKrw: row.dlp_post_process_krw ?? defaults.postProcessKrw,
        }
    }

    return {
        hourlyRate: Number(row.hourly_rate) || defaults.hourlyRateKr,
        layerCosts: parseLayerCosts(row.layer_costs_json),
        ...(minPrice != null ? { minPriceKr: minPrice } : {}),
        layerExposureSec: row.sla_layer_exposure_sec ?? defaults.layerExposureSec,
        laborCostKrw: row.sla_labor_cost_krw ?? defaults.laborCostKrw,
        consumablesKrw: row.sla_consumables_krw ?? defaults.consumablesKrw,
        postProcessKrw: row.sla_post_process_krw ?? defaults.postProcessKrw,
    }
}

/**
 * SLA/DLP이면 DB 단가로 재계산. 실패 시 client 값 유지.
 */
export async function resolveServerResinQuote(
    db: D1Like,
    input: ServerResinQuoteInput
): Promise<ServerResinQuoteResult> {
    const clientFallback: ServerResinQuoteResult = {
        totalPrice: Math.max(0, Math.round(input.clientTotalPrice)),
        estimatedTimeHours: Math.max(0, Number(input.clientEstimatedHours) || 0),
        volumeMl: Math.max(0, Number(input.volumeCm3) || 0),
        source: 'client',
    }

    try {
        const material = await loadResinMaterial(db, input.method, input.resinTypeName)
        if (!material || material.pricePerMl <= 0) return clientFallback

        const equipment = await loadResinEquipment(db, input.method)
        const layer = clampSlaLayerHeight(input.layerHeightMm, SLA_LAYER_DEFAULT)
        const hourlyRate =
            equipment.layerCosts?.[String(layer)] ??
            equipment.layerCosts?.[layer.toFixed(3)] ??
            equipment.hourlyRate

        const q = calculateResinQuote({
            method: input.method,
            volumeCm3: input.volumeCm3,
            heightMm: input.heightMm,
            layerHeightMm: layer,
            pricePerMlKr: material.pricePerMl,
            postProcessing: input.postProcessing,
            hourlyRateKr: hourlyRate,
            layerExposureSec: equipment.layerExposureSec,
            laborCostKrw: equipment.laborCostKrw,
            consumablesKrw: equipment.consumablesKrw,
            postProcessKrw: equipment.postProcessKrw,
            applyVat: true,
            minPriceKr: equipment.minPriceKr,
        })

        const deltaKr = Math.round(q.total - clientFallback.totalPrice)
        if (Math.abs(deltaKr) > 500) {
            console.info(
                `[resin-quote] server override Δ₩${deltaKr} (client=${clientFallback.totalPrice} server=${q.total} method=${input.method} material=${material.name} post=${input.postProcessing})`
            )
        }

        return {
            totalPrice: Math.round(q.total),
            estimatedTimeHours: q.timeHours,
            volumeMl: q.volumeMl,
            source: 'server',
            deltaKr,
        }
    } catch (e) {
        console.warn('[resin-quote] server recalc failed, using client', e)
        return clientFallback
    }
}
