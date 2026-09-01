/**
 * 사진→AI 3D 프로바이더 (Meshy / Tripo) 추상화
 */

import {
    createMeshyImageTo3DTask,
    createMeshyMultiImageTo3DTask,
    getMeshyImageTo3DTask,
    mapMeshyStatusToJob,
    resolveMeshyApiKey,
    toDataUri,
    type MeshyQualityPreset,
} from '@/lib/meshy'
import {
    createTripoImageTo3DTask,
    createTripoMultiImageTo3DTask,
    createTripoStlConvertTask,
    extractTripoDownloadUrl,
    extractTripoTaskError,
    extractTripoThumbnailUrl,
    getTripoTask,
    mapTripoStatusToJob,
    resolveTripoApiKey,
    uploadTripoImage,
    type TripoQualityPreset,
} from '@/lib/tripo'

export const IMAGE_TO_3D_PROVIDER_KEY = 'image_to_3d_provider'
export const DEFAULT_STORE_ID = 1

type D1Like = {
    prepare: (sql: string) => {
        bind: (...args: unknown[]) => {
            first: <T>() => Promise<T | null>
            run: () => Promise<unknown>
        }
    }
}

export type ImageTo3DProvider = 'meshy' | 'tripo'

export type ImageTo3DProviderAvailability = {
    meshy: boolean
    tripo: boolean
}

export type CreateImageTo3DInput = {
    imageBuffer: ArrayBuffer
    imageMime: string
    imageName: string
    extraBuffers?: ArrayBuffer[]
    extraMimes?: string[]
    extraNames?: string[]
    quality?: MeshyQualityPreset
}

export type PollImageTo3DInput = {
    provider: ImageTo3DProvider
    externalTaskId: string
    auxTaskId?: string | null
    quality?: MeshyQualityPreset
}

export type PollImageTo3DResult = {
    status: 'queued' | 'processing' | 'succeeded' | 'failed' | 'canceled'
    progress: number
    error?: string
    creditsUsed?: number | null
    thumbnailUrl?: string | null
    thumbnailUrls?: { front?: string; right?: string; back?: string; left?: string }
    stlUrl?: string
    /** Tripo STL 변환 task 생성 시 DB에 저장 */
    newAuxTaskId?: string
}

export function parseImageTo3DProvider(value: string | null | undefined): ImageTo3DProvider {
    return value === 'tripo' ? 'tripo' : 'meshy'
}

export function getProviderAvailability(env?: Record<string, unknown> | null): ImageTo3DProviderAvailability {
    return {
        meshy: !!resolveMeshyApiKey(env),
        tripo: !!resolveTripoApiKey(env),
    }
}

export async function getImageTo3DProviderSetting(
    db: D1Like,
    storeId = DEFAULT_STORE_ID
): Promise<ImageTo3DProvider> {
    try {
        const row = await db
            .prepare('SELECT value FROM print_settings WHERE store_id = ? AND key = ?')
            .bind(storeId, IMAGE_TO_3D_PROVIDER_KEY)
            .first<{ value: string }>()
        return parseImageTo3DProvider(row?.value)
    } catch {
        return 'meshy'
    }
}

export async function setImageTo3DProviderSetting(
    db: D1Like,
    provider: ImageTo3DProvider,
    storeId = DEFAULT_STORE_ID
): Promise<void> {
    await db
        .prepare(
            `INSERT INTO print_settings (key, value, description, store_id) VALUES (?, ?, ?, ?)
             ON CONFLICT(store_id, key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
        )
        .bind(
            IMAGE_TO_3D_PROVIDER_KEY,
            provider,
            '사진→AI 3D 엔진 (meshy | tripo)',
            storeId
        )
        .run()
}

/** 설정 + API 키 유효성을 고려한 활성 프로바이더 */
export async function resolveActiveImageTo3DProvider(
    db: D1Like,
    env?: Record<string, unknown> | null,
    storeId = DEFAULT_STORE_ID
): Promise<{ provider: ImageTo3DProvider; availability: ImageTo3DProviderAvailability }> {
    const availability = getProviderAvailability(env)
    const preferred = await getImageTo3DProviderSetting(db, storeId)

    if (preferred === 'tripo' && availability.tripo) {
        return { provider: 'tripo', availability }
    }
    if (preferred === 'meshy' && availability.meshy) {
        return { provider: 'meshy', availability }
    }
    if (availability.meshy) return { provider: 'meshy', availability }
    if (availability.tripo) return { provider: 'tripo', availability }
    return { provider: preferred, availability }
}

export function providerDisplayName(provider: ImageTo3DProvider): string {
    return provider === 'tripo' ? 'Tripo3D' : 'Meshy'
}

/** 사용자에게 노출할 오류/메시지 — AI 벤더명(Meshy/Tripo) 제거 */
export function sanitizeImageTo3DUserMessage(message: string | null | undefined): string {
    const raw = (message || '').trim()
    if (!raw) return 'AI 모델링에 실패했습니다. 잠시 후 다시 시도해 주세요.'

    const lower = raw.toLowerCase()
    if (
        /not enough credit|insufficient credit|크레딧이 부족|credit/i.test(lower) &&
        /tripo|meshy|api 지갑|platform\.tripo|tripoai/i.test(lower)
    ) {
        return 'AI 모델링 서비스 이용 한도에 도달했습니다. 잠시 후 다시 시도하거나 관리자에게 문의해 주세요.'
    }
    if (/not enough credit|insufficient credit/i.test(lower)) {
        return 'AI 모델링 서비스 이용 한도에 도달했습니다. 잠시 후 다시 시도하거나 관리자에게 문의해 주세요.'
    }
    if (/authentication|api key|TRIPO_API|MESHY_API|키가 올바르지/i.test(raw)) {
        return 'AI 모델링 서비스가 일시적으로 이용 불가합니다. 관리자에게 문의해 주세요.'
    }
    if (/content policy|콘텐츠 정책/i.test(raw)) {
        return '입력 이미지를 처리할 수 없습니다. 다른 사진으로 시도해 주세요.'
    }
    if (/rate limit|요청 한도|exceeded the limit/i.test(lower)) {
        return '요청이 많아 잠시 후 다시 시도해 주세요.'
    }
    if (/tripo|meshy|platform\.tripo|tripoai\.com|tripo3d\.ai|openapi\.tripo/i.test(lower)) {
        return 'AI 모델링 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.'
    }

    return raw
        .replace(/\b(Meshy|Tripo3?D?)\b/gi, 'AI')
        .replace(/\b(TRIPO_API_KEY|MESHY_API_KEY)\b/g, '서비스 설정')
}

export async function createImageTo3DTask(
    provider: ImageTo3DProvider,
    env: Record<string, unknown>,
    input: CreateImageTo3DInput
): Promise<{ externalTaskId: string }> {
    const quality = input.quality === 'fast' ? 'fast' : 'standard'

    if (provider === 'tripo') {
        const apiKey = resolveTripoApiKey(env)
        if (!apiKey) throw new Error('Tripo API 키가 설정되지 않았습니다.')

        const frontToken = await uploadTripoImage(
            apiKey,
            input.imageBuffer,
            input.imageMime,
            input.imageName
        )

        const extras = input.extraBuffers || []
        if (extras.length > 0) {
            const tokens: { front: string; right?: string; back?: string; left?: string } = {
                front: frontToken,
            }
            const uploadExtra = async (buf: ArrayBuffer, idx: number) => {
                const mime = input.extraMimes?.[idx] || 'image/jpeg'
                const name = input.extraNames?.[idx] || `view-${idx}.jpg`
                return uploadTripoImage(apiKey, buf, mime, name)
            }
            if (extras[0]) tokens.right = await uploadExtra(extras[0], 0)
            if (extras[1]) tokens.back = await uploadExtra(extras[1], 1)
            if (extras[2]) tokens.left = await uploadExtra(extras[2], 2)

            const created = await createTripoMultiImageTo3DTask(
                apiKey,
                tokens,
                input.imageMime,
                input.imageName,
                { quality: quality as TripoQualityPreset, env }
            )
            return { externalTaskId: created.taskId }
        }

        const created = await createTripoImageTo3DTask(
            apiKey,
            frontToken,
            input.imageMime,
            input.imageName,
            { quality: quality as TripoQualityPreset, env }
        )
        return { externalTaskId: created.taskId }
    }

    const apiKey = resolveMeshyApiKey(env)
    if (!apiKey) throw new Error('Meshy API 키가 설정되지 않았습니다.')

    const dataUri = toDataUri(input.imageMime, input.imageBuffer)
    const extraUris = (input.extraBuffers || []).map((buf, i) =>
        toDataUri(input.extraMimes?.[i] || 'image/jpeg', buf)
    )

    if (extraUris.length > 0) {
        const created = await createMeshyMultiImageTo3DTask(apiKey, [dataUri, ...extraUris], { quality })
        return { externalTaskId: created.id }
    }

    const created = await createMeshyImageTo3DTask(apiKey, dataUri, { quality })
    return { externalTaskId: created.id }
}

export async function pollImageTo3DTask(
    provider: ImageTo3DProvider,
    env: Record<string, unknown>,
    input: PollImageTo3DInput
): Promise<PollImageTo3DResult> {
    const quality = input.quality === 'fast' ? 'fast' : 'standard'

    if (provider === 'tripo') {
        return pollTripoTask(env, input.externalTaskId, input.auxTaskId, quality as TripoQualityPreset)
    }

    const apiKey = resolveMeshyApiKey(env)
    if (!apiKey) {
        return { status: 'failed', progress: 0, error: 'Meshy API 키가 설정되지 않았습니다.' }
    }

    const task = await getMeshyImageTo3DTask(apiKey, input.externalTaskId)
    const mapped = mapMeshyStatusToJob(task.status)
    const progress = Math.max(0, Math.min(100, Number(task.progress) || 0))

    if (mapped === 'succeeded') {
        const stlUrl = task.model_urls?.stl
        if (!stlUrl) {
            return { status: 'failed', progress: 100, error: 'STL 결과 URL이 없습니다.' }
        }
        return {
            status: 'succeeded',
            progress: 100,
            stlUrl,
            thumbnailUrl: task.thumbnail_url || null,
            thumbnailUrls: task.thumbnail_urls,
            creditsUsed: task.credits_used ?? null,
        }
    }

    if (mapped === 'failed' || mapped === 'canceled') {
        return {
            status: mapped,
            progress,
            error: task.task_error?.message || 'AI 모델링에 실패했습니다',
            creditsUsed: task.credits_used ?? null,
        }
    }

    return {
        status: mapped,
        progress,
        thumbnailUrl: task.thumbnail_url || null,
        thumbnailUrls: task.thumbnail_urls,
        creditsUsed: task.credits_used ?? null,
    }
}

async function pollTripoTask(
    env: Record<string, unknown>,
    mainTaskId: string,
    auxTaskId: string | null | undefined,
    quality: TripoQualityPreset
): Promise<PollImageTo3DResult> {
    const apiKey = resolveTripoApiKey(env)
    if (!apiKey) {
        return { status: 'failed', progress: 0, error: 'Tripo API 키가 설정되지 않았습니다.' }
    }

    if (auxTaskId) {
        const convertTask = await getTripoTask(apiKey, auxTaskId)
        const mapped = mapTripoStatusToJob(convertTask.status)
        const rawProgress = Math.max(0, Math.min(100, Number(convertTask.progress) || 0))
        const progress = Math.round(80 + rawProgress * 0.2)

        if (mapped === 'succeeded') {
            const stlUrl = extractTripoDownloadUrl(convertTask.output)
            if (!stlUrl) {
                return { status: 'failed', progress: 100, error: 'STL 결과 URL이 없습니다.' }
            }
            return {
                status: 'succeeded',
                progress: 100,
                stlUrl,
                thumbnailUrl: extractTripoThumbnailUrl(convertTask.output),
            }
        }

        if (mapped === 'failed' || mapped === 'canceled') {
            return {
                status: mapped,
                progress,
                error: extractTripoTaskError(convertTask) || 'Tripo STL 변환에 실패했습니다',
            }
        }

        return { status: mapped, progress }
    }

    const task = await getTripoTask(apiKey, mainTaskId)
    const mapped = mapTripoStatusToJob(task.status)
    const rawProgress = Math.max(0, Math.min(100, Number(task.progress) || 0))
    const progress = Math.round(rawProgress * 0.8)

    if (mapped === 'succeeded') {
        const directStl = extractTripoDownloadUrl(task.output)
        if (directStl && /\.stl(\?|$)/i.test(directStl)) {
            return {
                status: 'succeeded',
                progress: 100,
                stlUrl: directStl,
                thumbnailUrl: extractTripoThumbnailUrl(task.output),
            }
        }

        const convert = await createTripoStlConvertTask(apiKey, mainTaskId, { quality })
        return {
            status: 'processing',
            progress: 82,
            newAuxTaskId: convert.taskId,
            thumbnailUrl: extractTripoThumbnailUrl(task.output),
        }
    }

    if (mapped === 'failed' || mapped === 'canceled') {
        return {
            status: mapped,
            progress,
            error: extractTripoTaskError(task) || 'Tripo AI 모델링에 실패했습니다',
        }
    }

    return {
        status: mapped,
        progress,
        thumbnailUrl: extractTripoThumbnailUrl(task.output),
    }
}
