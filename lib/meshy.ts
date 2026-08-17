/**
 * Meshy AI Image-to-3D API 클라이언트
 * Docs: https://docs.meshy.ai/en/api/image-to-3d
 */

export const MESHY_API_BASE = 'https://api.meshy.ai/openapi/v1'
export const MESHY_IMAGE_MAX_BYTES = 8 * 1024 * 1024
/** 비회원은 생성 불가(로그인 필수). 하위 호환용으로 0 유지 */
export const MESHY_GUEST_DAILY_LIMIT = 0
/** 회원 계정(user_id)당 한국 시간 기준 1일 1회 */
export const MESHY_USER_DAILY_LIMIT = 1

/** D1/SQLite: 한국(UTC+9) 캘린더일 기준 오늘 생성분 카운트 조건 */
export const MESHY_TODAY_KST_SQL = `date(created_at, '+9 hours') = date('now', '+9 hours')`

export type MeshyTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'CANCELED'

export type MeshyImageTo3DTask = {
    id: string
    status: MeshyTaskStatus
    progress?: number
    model_urls?: { stl?: string; glb?: string; obj?: string }
    thumbnail_url?: string
    task_error?: { message?: string }
    credits_used?: number
}

export function resolveMeshyApiKey(env?: Record<string, unknown> | null): string | null {
    const fromProcess = typeof process !== 'undefined' ? process.env?.MESHY_API_KEY?.trim() : ''
    if (fromProcess) return fromProcess
    const fromEnv = env && typeof env.MESHY_API_KEY === 'string' ? env.MESHY_API_KEY.trim() : ''
    return fromEnv || null
}

export function isAllowedMeshyImage(file: { type?: string; name?: string }): boolean {
    const type = (file.type || '').toLowerCase()
    if (type === 'image/jpeg' || type === 'image/jpg' || type === 'image/png') return true
    const name = (file.name || '').toLowerCase()
    return name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png')
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    const chunk = 0x8000
    let binary = ''
    for (let i = 0; i < bytes.length; i += chunk) {
        const sub = bytes.subarray(i, i + chunk)
        binary += String.fromCharCode(...sub)
    }
    return btoa(binary)
}

export function toDataUri(mime: string, buffer: ArrayBuffer): string {
    const safeMime = mime === 'image/jpg' ? 'image/jpeg' : mime || 'image/jpeg'
    return `data:${safeMime};base64,${arrayBufferToBase64(buffer)}`
}

export type MeshyQualityPreset = 'fast' | 'standard'

export async function createMeshyImageTo3DTask(
    apiKey: string,
    imageDataUri: string,
    options?: { quality?: MeshyQualityPreset }
): Promise<{ id: string }> {
    const quality: MeshyQualityPreset = options?.quality === 'fast' ? 'fast' : 'standard'
    const res = await fetch(`${MESHY_API_BASE}/image-to-3d`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            image_url: imageDataUri,
            should_texture: false,
            ai_model: 'latest',
            target_formats: ['stl'],
            auto_size: true,
            moderation: true,
            topology: 'triangle',
            // 표준: 더 촘촘한 메시 · 빠름: 저폴리로 크레딧·시간 절약
            target_polycount: quality === 'fast' ? 20000 : 40000,
        }),
    })

    const text = await res.text()
    let json: { result?: string; id?: string; message?: string; error?: string } = {}
    try {
        json = JSON.parse(text)
    } catch {
        /* ignore */
    }

    if (!res.ok) {
        const msg =
            json.message ||
            json.error ||
            (res.status === 402
                ? 'Meshy API 크레딧이 부족합니다.'
                : `Meshy API 오류 (${res.status})`)
        throw new Error(msg)
    }

    const id = json.result || json.id
    if (!id) throw new Error('Meshy task ID를 받지 못했습니다.')
    return { id: String(id) }
}

export async function getMeshyImageTo3DTask(
    apiKey: string,
    taskId: string
): Promise<MeshyImageTo3DTask> {
    const res = await fetch(`${MESHY_API_BASE}/image-to-3d/${encodeURIComponent(taskId)}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: 'no-store',
    })
    const text = await res.text()
    let json: MeshyImageTo3DTask & { message?: string } = { id: taskId, status: 'FAILED' }
    try {
        json = JSON.parse(text)
    } catch {
        throw new Error(`Meshy 상태 응답 파싱 실패 (${res.status})`)
    }
    if (!res.ok) {
        throw new Error(json.message || `Meshy 상태 조회 실패 (${res.status})`)
    }
    return json
}

export function mapMeshyStatusToJob(
    status: MeshyTaskStatus
): 'queued' | 'processing' | 'succeeded' | 'failed' | 'canceled' {
    switch (status) {
        case 'PENDING':
            return 'queued'
        case 'IN_PROGRESS':
            return 'processing'
        case 'SUCCEEDED':
            return 'succeeded'
        case 'CANCELED':
            return 'canceled'
        default:
            return 'failed'
    }
}
