import { parseMeshyJobIdFromFileName } from '@/lib/meshy-r2'
import {
    clampScalePercent,
    DEFAULT_MODEL_TRANSFORM,
    type Axis90,
    type ModelTransform,
} from '@/lib/model-transform'
import type { FileSourceMeta } from '@/store/useFileStore'

function normalizeAxis90(value: unknown): Axis90 {
    const n = Number(value) || 0
    const mod = ((Math.round(n / 90) * 90) % 360 + 360) % 360
    if (mod === 90 || mod === 180 || mod === 270) return mod
    return 0
}

/** DB quotes.model_transform JSON → 뷰어 변환 */
export function parseStoredModelTransform(raw: unknown): ModelTransform | null {
    if (raw == null) return null
    try {
        const o = typeof raw === 'string' ? JSON.parse(raw) : raw
        if (!o || typeof o !== 'object') return null
        const r = o as Record<string, unknown>
        return {
            scalePercent: clampScalePercent(Number(r.scalePercent) || 100),
            rotX: normalizeAxis90(r.rotX),
            rotY: normalizeAxis90(r.rotY),
            rotZ: normalizeAxis90(r.rotZ),
            snapToBed: r.snapToBed !== false,
        }
    } catch {
        return null
    }
}

export function buildFileSourceFromFileName(fileName?: string | null): FileSourceMeta {
    const meshyJobId = parseMeshyJobIdFromFileName(fileName)
    if (meshyJobId != null) {
        return { kind: 'meshy-photo', meshyJobId }
    }
    return { kind: 'upload', meshyJobId: null }
}

export function resolveQuoteReloadTransform(raw: unknown): ModelTransform {
    return parseStoredModelTransform(raw) ?? { ...DEFAULT_MODEL_TRANSFORM }
}
