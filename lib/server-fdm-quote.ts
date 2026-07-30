/**
 * 서버측 FDM 견적 재계산 (DB 소재·장비 단가 기준)
 * 클라이언트 금액을 그대로 믿지 않고, 가능하면 동일 공식으로 덮어씀.
 */

import {
    calculateFdmQuote,
    clampFdmInfillPercent,
    FDM_DEFAULT_DENSITY,
    FDM_DEFAULT_HOURLY_RATE_KRW,
    FDM_DEFAULT_LABOR_KRW,
    FDM_DEFAULT_SUPPORT_PER_CM2_KRW,
    FDM_INFILL_DEFAULT,
} from '@/lib/fdm-quote'

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

export type ServerFdmQuoteInput = {
    volumeCm3: number
    surfaceAreaCm2: number
    heightMm: number
    fdmMaterialName: string | null
    infillPercent: number | null
    layerHeightMm: number | null
    supportEnabled: boolean
    clientTotalPrice: number
    clientEstimatedHours: number
}

export type ServerFdmQuoteResult = {
    totalPrice: number
    estimatedTimeHours: number
    weightGrams: number
    effectiveInfill: number
    source: 'server' | 'client'
    /** 클라이언트와 서버 차이(원). 서버 산출일 때만 */
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

async function loadFdmMaterial(
    db: D1Like,
    name: string | null
): Promise<{ density: number; pricePerGram: number; name: string } | null> {
    const rows = await db
        .prepare(
            `SELECT name, density, price_per_gram FROM materials
             WHERE type = 'FDM' AND (is_active = 1 OR is_active IS NULL)
             ORDER BY sort_order ASC, name ASC`
        )
        .all<{ name: string; density: number | null; price_per_gram: number | null }>()

    const list = rows.results || []
    if (!list.length) return null

    const want = (name || '').trim().toUpperCase()
    const hit =
        list.find((m) => m.name.trim().toUpperCase() === want) ||
        list.find((m) => want && m.name.trim().toUpperCase().includes(want)) ||
        list[0]

    return {
        name: hit.name,
        density: Number(hit.density) > 0 ? Number(hit.density) : FDM_DEFAULT_DENSITY,
        pricePerGram: Number(hit.price_per_gram) || 0,
    }
}

async function loadFdmEquipment(db: D1Like): Promise<{
    hourlyRate: number
    layerCosts?: Record<string, number>
    minPriceKr?: number
    fdmLayerHoursFactor: number
    fdmLaborCostKrw: number
    fdmSupportPerCm2Krw: number
}> {
    const row = await db
        .prepare(`SELECT * FROM printer_equipment WHERE is_active = 1 AND UPPER(type) = 'FDM' LIMIT 1`)
        .first<{
            hourly_rate: number
            layer_costs_json: string | null
            min_price_krw: number | null
            fdm_layer_hours_factor: number | null
            fdm_labor_cost_krw: number | null
            fdm_support_per_cm2_krw: number | null
        }>()

    if (!row) {
        return {
            hourlyRate: FDM_DEFAULT_HOURLY_RATE_KRW,
            fdmLayerHoursFactor: 0.02,
            fdmLaborCostKrw: FDM_DEFAULT_LABOR_KRW,
            fdmSupportPerCm2Krw: FDM_DEFAULT_SUPPORT_PER_CM2_KRW,
        }
    }

    const minPrice =
        row.min_price_krw != null && Number(row.min_price_krw) > 0 ? Number(row.min_price_krw) : undefined

    return {
        hourlyRate: Number(row.hourly_rate) || FDM_DEFAULT_HOURLY_RATE_KRW,
        layerCosts: parseLayerCosts(row.layer_costs_json),
        ...(minPrice != null ? { minPriceKr: minPrice } : {}),
        fdmLayerHoursFactor: row.fdm_layer_hours_factor ?? 0.02,
        fdmLaborCostKrw: row.fdm_labor_cost_krw ?? FDM_DEFAULT_LABOR_KRW,
        fdmSupportPerCm2Krw: row.fdm_support_per_cm2_krw ?? FDM_DEFAULT_SUPPORT_PER_CM2_KRW,
    }
}

/**
 * FDM이면 DB 단가로 재계산. 실패 시 client 값 유지.
 */
export async function resolveServerFdmQuote(
    db: D1Like,
    input: ServerFdmQuoteInput
): Promise<ServerFdmQuoteResult> {
    const clientFallback: ServerFdmQuoteResult = {
        totalPrice: Math.max(0, Math.round(input.clientTotalPrice)),
        estimatedTimeHours: Math.max(0, Number(input.clientEstimatedHours) || 0),
        weightGrams: 0,
        effectiveInfill: clampFdmInfillPercent(input.infillPercent, FDM_INFILL_DEFAULT),
        source: 'client',
    }

    try {
        const material = await loadFdmMaterial(db, input.fdmMaterialName)
        if (!material || material.pricePerGram <= 0) return clientFallback

        const equipment = await loadFdmEquipment(db)
        const layer = input.layerHeightMm != null && Number.isFinite(input.layerHeightMm)
            ? Number(input.layerHeightMm)
            : 0.2
        const hourlyRate =
            equipment.layerCosts?.[String(layer)] ??
            equipment.layerCosts?.[layer.toFixed(1)] ??
            equipment.hourlyRate

        const q = calculateFdmQuote({
            volumeCm3: input.volumeCm3,
            surfaceAreaCm2: input.surfaceAreaCm2,
            heightMm: input.heightMm,
            density: material.density,
            pricePerGramKr: material.pricePerGram,
            infillPercent: input.infillPercent ?? FDM_INFILL_DEFAULT,
            layerHeightMm: layer,
            supportEnabled: input.supportEnabled,
            overhangAreaCm2: null,
            hourlyRateKr: hourlyRate,
            fdmLaborCostKrw: equipment.fdmLaborCostKrw,
            fdmSupportPerCm2Krw: equipment.fdmSupportPerCm2Krw,
            fdmLayerHoursFactor: equipment.fdmLayerHoursFactor,
            applyVat: true,
            minPriceKr: equipment.minPriceKr,
        })

        const deltaKr = Math.round(q.total - clientFallback.totalPrice)
        if (Math.abs(deltaKr) > 500) {
            console.info(
                `[fdm-quote] server override Δ₩${deltaKr} (client=${clientFallback.totalPrice} server=${q.total} material=${material.name} infill=${q.effectiveInfill})`
            )
        }

        return {
            totalPrice: Math.round(q.total),
            estimatedTimeHours: q.timeHours,
            weightGrams: q.weightGrams,
            effectiveInfill: q.effectiveInfill,
            source: 'server',
            deltaKr,
        }
    } catch (e) {
        console.warn('[fdm-quote] server recalc failed, using client', e)
        return clientFallback
    }
}
