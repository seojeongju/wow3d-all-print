/**
 * 견적 확인 기록용 스케일·자세 요약 (관리자 카드·로그 저장)
 */

import {
    formatScalePercent,
    isUniformScaleAxes,
    resolveScaleAxesPercent,
    type ModelTransform,
} from '@/lib/model-transform'
import type { Vec3Tuple } from '@/lib/stl-bake'

export type EstimateModelTransformPayload = {
    scalePercent: number
    scaleXPercent: number
    scaleYPercent: number
    scaleZPercent: number
    rotX: number
    rotY: number
    rotZ: number
    layFlat: Vec3Tuple | null
}

function isAxis90(n: number): boolean {
    return n === 0 || n === 90 || n === 180 || n === 270
}

/** QuotePanel → API 저장용 */
export function toEstimateTransformPayload(t: ModelTransform): EstimateModelTransformPayload {
    const axes = resolveScaleAxesPercent(t)
    return {
        scalePercent: axes.x === axes.y && axes.y === axes.z ? axes.x : t.scalePercent,
        scaleXPercent: axes.x,
        scaleYPercent: axes.y,
        scaleZPercent: axes.z,
        rotX: t.rotX,
        rotY: t.rotY,
        rotZ: t.rotZ,
        layFlat: t.layFlat ?? null,
    }
}

export function serializeEstimateTransform(t: ModelTransform): string {
    return JSON.stringify(toEstimateTransformPayload(t))
}

export function parseEstimateTransform(raw: unknown): EstimateModelTransformPayload | null {
    if (raw == null || raw === '') return null
    let obj: unknown = raw
    if (typeof raw === 'string') {
        try {
            obj = JSON.parse(raw)
        } catch {
            return null
        }
    }
    if (!obj || typeof obj !== 'object') return null
    const o = obj as Record<string, unknown>
    const sx = Number(o.scaleXPercent ?? o.scalePercent)
    const sy = Number(o.scaleYPercent ?? o.scalePercent)
    const sz = Number(o.scaleZPercent ?? o.scalePercent)
    const rotX = Number(o.rotX)
    const rotY = Number(o.rotY)
    const rotZ = Number(o.rotZ)
    if (![sx, sy, sz].every((n) => Number.isFinite(n) && n > 0)) return null
    if (![rotX, rotY, rotZ].every((n) => Number.isFinite(n) && isAxis90(n))) return null
    let layFlat: Vec3Tuple | null = null
    if (Array.isArray(o.layFlat) && o.layFlat.length === 3) {
        const a = o.layFlat.map(Number)
        if (a.every((n) => Number.isFinite(n))) layFlat = [a[0], a[1], a[2]]
    }
    const rep = Number(o.scalePercent)
    return {
        scalePercent: Number.isFinite(rep) && rep > 0 ? rep : Math.cbrt(sx * sy * sz),
        scaleXPercent: sx,
        scaleYPercent: sy,
        scaleZPercent: sz,
        rotX,
        rotY,
        rotZ,
        layFlat,
    }
}

/** 부피 배율 (100% 균일 대비). 예: 150% → 3.375 */
export function estimateVolumeScaleFactor(t: EstimateModelTransformPayload): number {
    return (t.scaleXPercent / 100) * (t.scaleYPercent / 100) * (t.scaleZPercent / 100)
}

export function formatEstimateScaleLabel(t: EstimateModelTransformPayload): string {
    const axes = {
        x: t.scaleXPercent,
        y: t.scaleYPercent,
        z: t.scaleZPercent,
    }
    if (isUniformScaleAxes(axes)) return `${formatScalePercent(axes.x)}%`
    return `X${formatScalePercent(axes.x)}% · Y${formatScalePercent(axes.y)}% · Z${formatScalePercent(axes.z)}%`
}

export function formatEstimatePoseLabel(t: EstimateModelTransformPayload): string {
    if (t.layFlat) return '평면 배치'
    const parts: string[] = []
    if (t.rotX) parts.push(`X${t.rotX}°`)
    if (t.rotY) parts.push(`Y${t.rotY}°`)
    if (t.rotZ) parts.push(`Z${t.rotZ}°`)
    if (!parts.length) return '원본 자세'
    return `회전 ${parts.join(' ')}`
}

export function isNonDefaultEstimateTransform(t: EstimateModelTransformPayload): boolean {
    const vol = estimateVolumeScaleFactor(t)
    if (Math.abs(vol - 1) > 0.005) return true
    if (t.layFlat) return true
    return Boolean(t.rotX || t.rotY || t.rotZ)
}

/** 100% 스케일 기준 추정 부피 */
export function estimateBaseVolumeCm3(volumeCm3: number, t: EstimateModelTransformPayload): number | null {
    const f = estimateVolumeScaleFactor(t)
    if (!(f > 0) || !Number.isFinite(volumeCm3)) return null
    return volumeCm3 / f
}
