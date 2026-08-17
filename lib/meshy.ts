/**
 * Meshy AI Image-to-3D API 클라이언트
 * Docs: https://docs.meshy.ai/en/api/image-to-3d
 */

export const MESHY_API_BASE = 'https://api.meshy.ai/openapi/v1'
export const MESHY_IMAGE_MAX_BYTES = 8 * 1024 * 1024
export const MESHY_GUEST_DAILY_LIMIT = 2
export const MESHY_USER_DAILY_LIMIT = 5

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

export async function createMeshyImageTo3DTask(
    apiKey: string,
    imageDataUri: string
): Promise<{ id: string }> {
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
