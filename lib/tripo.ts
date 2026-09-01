/**
 * Tripo3D Image-to-3D API 클라이언트 (v3)
 * Docs: https://developers.tripo3d.ai/en/docs
 */

export const TRIPO_API_BASE = 'https://openapi.tripo3d.ai/v3'
export const TRIPO_IMAGE_MAX_BYTES = 20 * 1024 * 1024
export const TRIPO_MODEL_STANDARD = 'v3.1-20260211'
export const TRIPO_MODEL_FAST = 'v2.5-20250123'

export type TripoTaskStatus = 'queued' | 'running' | 'success' | 'failed' | 'cancelled' | 'banned' | 'expired'

export type TripoTask = {
    task_id: string
    type?: string
    status: TripoTaskStatus
    progress?: number
    output?: Record<string, unknown>
    input?: Record<string, unknown>
    create_time?: number
    credits_consumed?: number
    error_msg?: string
}

export type TripoQualityPreset = 'fast' | 'standard'

export type TripoBalance = {
    balance: number
    frozen: number
}

type TripoApiResponse<T> = {
    code?: number
    data?: T
    message?: string
    suggestion?: string
}

export class TripoApiError extends Error {
    readonly tripoCode?: number
    readonly httpStatus: number
    readonly suggestion?: string

    constructor(message: string, tripoCode?: number, httpStatus = 502, suggestion?: string) {
        super(message)
        this.name = 'TripoApiError'
        this.tripoCode = tripoCode
        this.httpStatus = httpStatus
        this.suggestion = suggestion
    }
}

/** Tripo API 영문 메시지 → 사용자용 한국어 */
export function localizeTripoError(message: string, code?: number, suggestion?: string): string {
    const m = message.trim()
    if (code === 2010 || /not enough credit|insufficient credit/i.test(m)) {
        return 'Tripo API 지갑 크레딧이 부족합니다. Tripo 웹 Max 구독과 API 크레딧은 별도입니다. platform.tripo3d.ai 또는 tripoai.com 대시보드에서 API 크레딧 잔액을 확인·충전해 주세요.'
    }
    if (code === 1002 || code === 1000 || code === 1001 || /authentication|unauthorized|invalid api key/i.test(m)) {
        return 'Tripo API 키가 올바르지 않습니다. 관리자에게 TRIPO_API_KEY 설정을 확인해 달라고 요청해 주세요.'
    }
    if (code === 2000 || code === 1007 || /rate limit|exceeded the limit|too many requests/i.test(m)) {
        return 'Tripo API 요청 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.'
    }
    if (code === 2008 || /content policy/i.test(m)) {
        return '입력 이미지가 Tripo 콘텐츠 정책에 의해 거부되었습니다. 다른 사진으로 시도해 주세요.'
    }
    if (code === 2019 || /file is not found/i.test(m)) {
        return 'Tripo에 이미지 업로드가 완료되지 않았습니다. 다시 시도해 주세요.'
    }
    if (code === 2015 || /deprecated|version/i.test(m)) {
        return 'Tripo API 버전이 만료되었습니다. 관리자에게 문의해 주세요.'
    }
    if (suggestion?.trim()) return `${m || 'Tripo API 오류'} (${suggestion.trim()})`
    return m || 'Tripo API 오류가 발생했습니다'
}

function tripoHttpStatus(code?: number, resStatus?: number): number {
    if (code === 2010) return 402
    if (code === 1002 || code === 1000 || code === 1001) return 503
    if (code === 2000 || code === 1007) return 429
    if (resStatus && resStatus >= 400 && resStatus < 600) return resStatus
    return 502
}

export function resolveTripoApiKey(env?: Record<string, unknown> | null): string | null {
    const keys = ['TRIPO_API_KEY', 'TRIPO3D_API_KEY'] as const
    for (const k of keys) {
        const fromProcess = typeof process !== 'undefined' ? process.env?.[k]?.trim() : ''
        if (fromProcess) return fromProcess
        const fromEnv = env && typeof env[k] === 'string' ? env[k].trim() : ''
        if (fromEnv) return fromEnv
    }
    return null
}

export function resolveTripoModelVersion(
    env?: Record<string, unknown> | null,
    quality: TripoQualityPreset = 'standard'
): string {
    if (quality === 'fast') return TRIPO_MODEL_FAST
    const fromProcess =
        typeof process !== 'undefined' ? process.env?.TRIPO_MODEL_VERSION?.trim() : ''
    if (fromProcess) return fromProcess
    const fromEnv =
        env && typeof env.TRIPO_MODEL_VERSION === 'string' ? env.TRIPO_MODEL_VERSION.trim() : ''
    return fromEnv || TRIPO_MODEL_STANDARD
}

export function isAllowedTripoImage(file: { type?: string; name?: string }): boolean {
    const type = (file.type || '').toLowerCase()
    if (type === 'image/jpeg' || type === 'image/jpg' || type === 'image/png' || type === 'image/webp') {
        return true
    }
    const name = (file.name || '').toLowerCase()
    return name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.webp')
}

function faceLimitForQuality(quality: TripoQualityPreset): number {
    return quality === 'fast' ? 12000 : 20000
}

function generationBody(quality: TripoQualityPreset, env?: Record<string, unknown> | null) {
    const model = resolveTripoModelVersion(env, quality)
    const body: Record<string, unknown> = {
        model,
        texture: false,
        pbr: false,
        auto_size: true,
        face_limit: faceLimitForQuality(quality),
        export_uv: false,
    }
    if (model !== TRIPO_MODEL_FAST) {
        body.geometry_quality = quality === 'fast' ? 'standard' : 'detailed'
    }
    return body
}

async function parseTripoResponse<T>(res: Response, fallback: string): Promise<T> {
    const text = await res.text()
    let json: TripoApiResponse<T> = {}
    try {
        json = JSON.parse(text) as TripoApiResponse<T>
    } catch {
        if (!res.ok) throw new TripoApiError(`${fallback} (${res.status})`, undefined, res.status)
        throw new TripoApiError(`${fallback}: 응답 파싱 실패`)
    }
    if (!res.ok || (json.code != null && json.code !== 0)) {
        const raw = json.message || `${fallback} (${res.status})`
        const localized = localizeTripoError(raw, json.code, json.suggestion)
        throw new TripoApiError(localized, json.code, tripoHttpStatus(json.code, res.status), json.suggestion)
    }
    if (!json.data) throw new TripoApiError(`${fallback}: data 없음`)
    return json.data
}

export async function getTripoBalance(apiKey: string): Promise<TripoBalance> {
    const res = await fetch(`${TRIPO_API_BASE}/account/balance`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: 'no-store',
    })
    const data = await parseTripoResponse<{ balance?: number; frozen?: number }>(
        res,
        'Tripo 잔액 조회 실패'
    )
    return {
        balance: Number(data.balance) || 0,
        frozen: Number(data.frozen) || 0,
    }
}

export async function uploadTripoImage(
    apiKey: string,
    buffer: ArrayBuffer,
    mime: string,
    fileName: string
): Promise<string> {
    const form = new FormData()
    const blob = new Blob([buffer], { type: mime || 'image/jpeg' })
    form.append('file', blob, fileName || 'photo.jpg')

    const res = await fetch(`${TRIPO_API_BASE}/files`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
    })

    const data = await parseTripoResponse<{ file_token?: string }>(res, 'Tripo 이미지 업로드 실패')
    const token = data.file_token
    if (!token) throw new TripoApiError('Tripo file_token을 받지 못했습니다.')
    return token
}

export async function createTripoImageTo3DTask(
    apiKey: string,
    fileToken: string,
    _mime: string,
    _fileName: string,
    options?: { quality?: TripoQualityPreset; env?: Record<string, unknown> | null }
): Promise<{ taskId: string }> {
    const quality: TripoQualityPreset = options?.quality === 'fast' ? 'fast' : 'standard'

    const res = await fetch(`${TRIPO_API_BASE}/generation/image-to-model`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            input: fileToken,
            ...generationBody(quality, options?.env),
        }),
    })

    const data = await parseTripoResponse<{ task_id: string }>(res, 'Tripo 3D 생성 작업 실패')
    if (!data.task_id) throw new TripoApiError('Tripo task ID를 받지 못했습니다.')
    return { taskId: data.task_id }
}

/** 정면 + 선택 좌·뒤·우 (Meshy 순서: 우, 뒤, 좌) */
export async function createTripoMultiImageTo3DTask(
    apiKey: string,
    tokens: { front: string; right?: string; back?: string; left?: string },
    _mime: string,
    _fileName: string,
    options?: { quality?: TripoQualityPreset; env?: Record<string, unknown> | null }
): Promise<{ taskId: string }> {
    const quality: TripoQualityPreset = options?.quality === 'fast' ? 'fast' : 'standard'
    const inputs: Record<string, string>[] = [{ front: tokens.front }]
    if (tokens.left) inputs.push({ left: tokens.left })
    if (tokens.back) inputs.push({ back: tokens.back })
    if (tokens.right) inputs.push({ right: tokens.right })

    const res = await fetch(`${TRIPO_API_BASE}/generation/multiview-to-model`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            inputs,
            ...generationBody(quality, options?.env),
        }),
    })

    const data = await parseTripoResponse<{ task_id: string }>(res, 'Tripo 멀티뷰 3D 생성 실패')
    if (!data.task_id) throw new TripoApiError('Tripo task ID를 받지 못했습니다.')
    return { taskId: data.task_id }
}

export async function createTripoStlConvertTask(
    apiKey: string,
    originalTaskId: string,
    options?: { quality?: TripoQualityPreset }
): Promise<{ taskId: string }> {
    const quality: TripoQualityPreset = options?.quality === 'fast' ? 'fast' : 'standard'

    const res = await fetch(`${TRIPO_API_BASE}/models/convert`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            input: originalTaskId,
            format: 'STL',
            face_limit: faceLimitForQuality(quality),
            bake: false,
            with_animation: false,
        }),
    })

    const data = await parseTripoResponse<{ task_id: string }>(res, 'Tripo STL 변환 실패')
    if (!data.task_id) throw new TripoApiError('Tripo STL 변환 task ID를 받지 못했습니다.')
    return { taskId: data.task_id }
}

export async function getTripoTask(apiKey: string, taskId: string): Promise<TripoTask> {
    const res = await fetch(`${TRIPO_API_BASE}/tasks/${encodeURIComponent(taskId)}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: 'no-store',
    })

    const data = await parseTripoResponse<TripoTask>(res, 'Tripo 상태 조회 실패')
    return { ...data, task_id: data.task_id || taskId }
}

export function mapTripoStatusToJob(
    status: TripoTaskStatus
): 'queued' | 'processing' | 'succeeded' | 'failed' | 'canceled' {
    switch (status) {
        case 'queued':
            return 'queued'
        case 'running':
            return 'processing'
        case 'success':
            return 'succeeded'
        case 'cancelled':
            return 'canceled'
        default:
            return 'failed'
    }
}

/** Tripo task output에서 다운로드 URL 추출 (v3: model_url) */
export function extractTripoDownloadUrl(output?: Record<string, unknown> | null): string | null {
    if (!output || typeof output !== 'object') return null

    const tryValue = (v: unknown): string | null => {
        if (typeof v === 'string' && v.startsWith('http')) return v
        if (v && typeof v === 'object') {
            const obj = v as Record<string, unknown>
            if (typeof obj.url === 'string' && obj.url.startsWith('http')) return obj.url
            if (typeof obj.model_url === 'string' && obj.model_url.startsWith('http')) return obj.model_url
        }
        return null
    }

    const priorityKeys = ['model_url', 'model', 'pbr_model', 'base_model', 'stl', 'glb']
    for (const key of priorityKeys) {
        const url = tryValue(output[key])
        if (url) return url
    }

    for (const v of Object.values(output)) {
        const url = tryValue(v)
        if (url) return url
    }

    return null
}

export function extractTripoThumbnailUrl(output?: Record<string, unknown> | null): string | null {
    if (!output || typeof output !== 'object') return null
    const keys = ['rendered_image_url', 'rendered_image', 'thumbnail', 'preview']
    for (const key of keys) {
        const v = output[key]
        if (typeof v === 'string' && v.startsWith('http')) return v
        if (v && typeof v === 'object' && typeof (v as { url?: string }).url === 'string') {
            return (v as { url: string }).url
        }
    }
    return null
}

export function extractTripoTaskError(task: TripoTask): string | null {
    if (task.error_msg) return task.error_msg
    const output = task.output
    if (output && typeof output === 'object') {
        const msg = (output as { error?: string; message?: string }).error
            || (output as { error?: string; message?: string }).message
        if (typeof msg === 'string' && msg.trim()) return msg.trim()
    }
    return null
}
