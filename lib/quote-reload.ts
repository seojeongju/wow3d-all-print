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

/** DB file_url(R2 키·절대 URL) → 브라우저 fetch URL */
export function resolveQuoteFileFetchUrl(fileUrl: string): string {
    const url = (fileUrl || '').trim()
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
        return url
    }
    if (url.startsWith('/api/files/')) return url
    if (url.startsWith('/quotes/') || url.startsWith('/meshy/')) {
        return `/api/files${url}`
    }
    if (url.startsWith('quotes/') || url.startsWith('meshy/')) {
        return `/api/files/${url}`
    }
    if (url.startsWith('/')) {
        return `/api/files${url}`
    }
    return `/api/files/${url}`
}

export function buildQuoteModelAuthHeaders(input: {
    token?: string | null
    sessionId?: string | null
    userId?: number | null
}): HeadersInit {
    const h: HeadersInit = {}
    if (input.token) {
        h.Authorization = `Bearer ${input.token}`
        if (input.userId) h['X-User-ID'] = String(input.userId)
    } else if (input.sessionId) {
        h['X-Session-ID'] = input.sessionId
    }
    return h
}

/** JSON/HTML 오류 응답이 STL로 잘못 로드되는 것 방지 */
export async function isLikelyModelBlob(blob: Blob, fileName?: string | null): Promise<boolean> {
    if (!blob.size || blob.size < 84) return false
    const type = (blob.type || '').toLowerCase()
    if (type.includes('json') || type.includes('html')) return false

    const head = new Uint8Array(await blob.slice(0, 80).arrayBuffer())
    const prefix = new TextDecoder().decode(head.slice(0, 5)).trimStart().toLowerCase()
    if (prefix.startsWith('{') || prefix.startsWith('<!doc') || prefix.startsWith('<html')) {
        return false
    }

    const lower = (fileName || '').toLowerCase()
    if (lower.endsWith('.stl')) {
        const triView = new DataView(await blob.slice(80, 84).arrayBuffer())
        const triCount = triView.getUint32(0, true)
        const expectedBinary = 84 + triCount * 50
        if (triCount > 0 && Math.abs(expectedBinary - blob.size) <= 4) return true
        if (prefix.startsWith('solid')) return true
        return blob.size >= 84
    }

    return blob.size >= 12
}

export type FetchQuoteModelResult = {
    blob: Blob
    fileName: string
    source: 'file_url' | 'meshy_api'
}

/** 저장 견적 재로드용 — R2 API 경로·Meshy API 폴백 */
export async function fetchQuoteModelFile(opts: {
    fileUrl?: string | null
    fileName: string
    meshyJobId?: number | null
    authHeaders?: HeadersInit
}): Promise<FetchQuoteModelResult> {
    const authHeaders = opts.authHeaders ?? {}
    const meshyId =
        opts.meshyJobId ?? parseMeshyJobIdFromFileName(opts.fileName) ?? null
    const errors: string[] = []

    if (opts.fileUrl?.trim()) {
        const fetchUrl = resolveQuoteFileFetchUrl(opts.fileUrl)
        try {
            const res = await fetch(fetchUrl, { headers: authHeaders, cache: 'no-store' })
            if (res.ok) {
                const blob = await res.blob()
                if (await isLikelyModelBlob(blob, opts.fileName)) {
                    return { blob, fileName: opts.fileName, source: 'file_url' }
                }
                errors.push('file_url 응답이 유효한 3D 모델이 아닙니다')
            } else {
                errors.push(`file_url HTTP ${res.status}`)
            }
        } catch {
            errors.push('file_url 네트워크 오류')
        }
    }

    if (meshyId) {
        try {
            const res = await fetch(`/api/meshy/jobs/${meshyId}/model`, {
                headers: authHeaders,
                cache: 'no-store',
            })
            if (!res.ok) {
                const j = await res.json().catch(() => ({}))
                errors.push(
                    (j as { error?: string }).error || `Meshy 모델 HTTP ${res.status}`
                )
            } else {
                const blob = await res.blob()
                if (await isLikelyModelBlob(blob, opts.fileName)) {
                    return {
                        blob,
                        fileName: opts.fileName || `meshy-${meshyId}.stl`,
                        source: 'meshy_api',
                    }
                }
                errors.push('Meshy API 응답이 유효한 STL이 아닙니다')
            }
        } catch {
            errors.push('Meshy API 네트워크 오류')
        }
    }

    throw new Error(
        errors.length > 0
            ? errors.join(' · ')
            : '모델 파일을 불러올 수 없습니다. file_url이 없습니다.'
    )
}
