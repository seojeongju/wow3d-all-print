import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAuthOrGuest } from '@/lib/api-utils'
import { sanitizeR2FileName } from '@/lib/r2-quote-file'
import {
    MESHY_IMAGE_MAX_BYTES,
    MESHY_IP_DAILY_LIMIT,
    MESHY_USER_DAILY_LIMIT,
    isAllowedMeshyImage,
} from '@/lib/meshy'
import { isAllowedTripoImage, TRIPO_IMAGE_MAX_BYTES, TripoApiError } from '@/lib/tripo'
import {
    createImageTo3DTask,
    resolveActiveImageTo3DProvider,
    sanitizeImageTo3DUserMessage,
    type ImageTo3DProvider,
} from '@/lib/image-to-3d-provider'
import {
    getClientIp,
    getMeshyQuotaSnapshot,
    hashClientIp,
    isMeshyUnlimitedRole,
    refundMeshyBonusCredit,
    reserveMeshyJob,
} from '@/lib/meshy-quota'
import { resolveUserAiPhotoFileName } from '@/lib/meshy-r2'

/**
 * GET /api/meshy/jobs
 * 내 생성 히스토리 (최신순)
 */
export async function GET(request: NextRequest) {
    try {
        const auth = await requireAuthOrGuest(request)
        if (auth instanceof Response) return auth
        if (auth.isGuest) {
            return NextResponse.json(
                { error: '로그인이 필요합니다', code: 'LOGIN_REQUIRED' },
                { status: 401 }
            )
        }

        const { env } = getCloudflareContext()
        if (!env?.DB) {
            return NextResponse.json({ error: 'DB를 사용할 수 없습니다' }, { status: 503 })
        }

        const limit = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get('limit')) || 20))

        type JobListRow = {
            id: number
            status: string
            progress: number | null
            thumbnail_url: string | null
            result_file_name: string | null
            result_file_key: string | null
            source_file_name: string | null
            error_message: string | null
            quote_id: number | null
            created_at: string
            updated_at: string
        }

        let list: JobListRow[] = []
        try {
            const rows = await env.DB.prepare(
                `SELECT id, status, progress, thumbnail_url, result_file_name, result_file_key,
                        source_file_name, error_message, quote_id, created_at, updated_at
                 FROM meshy_jobs
                 WHERE user_id = ?
                 ORDER BY id DESC
                 LIMIT ?`
            )
                .bind(auth.userId, limit)
                .all<JobListRow>()
            list = rows.results ?? []
        } catch {
            // quote_id 컬럼 없는 구 DB 호환
            const rows = await env.DB.prepare(
                `SELECT id, status, progress, thumbnail_url, result_file_name, result_file_key,
                        source_file_name, error_message, created_at, updated_at
                 FROM meshy_jobs
                 WHERE user_id = ?
                 ORDER BY id DESC
                 LIMIT ?`
            )
                .bind(auth.userId, limit)
                .all<Omit<JobListRow, 'quote_id'>>()
            list = (rows.results ?? []).map((j: Omit<JobListRow, 'quote_id'>) => ({ ...j, quote_id: null }))
        }

        const items = list.map((j: JobListRow) => {
            const hasErrorText = !!(j.error_message && String(j.error_message).trim())
            const isFailed = j.status === 'failed' || j.status === 'canceled'
            return {
                jobId: j.id,
                status: j.status,
                progress: j.progress || 0,
                thumbnailUrl: j.thumbnail_url,
                resultFileName: resolveUserAiPhotoFileName(j.id, j.result_file_name),
                sourceFileName: j.source_file_name,
                modelReady: j.status === 'succeeded' && !!j.result_file_key,
                quoteId: j.quote_id != null && Number(j.quote_id) > 0 ? Number(j.quote_id) : null,
                // sanitize는 null에도 기본 실패 문구를 반환하므로, 실제 실패/에러 텍스트가 있을 때만 전달
                error:
                    isFailed || hasErrorText
                        ? sanitizeImageTo3DUserMessage(j.error_message)
                        : null,
                createdAt: j.created_at,
                updatedAt: j.updated_at,
            }
        })

        return NextResponse.json({ success: true, data: { items } })
    } catch (e) {
        console.error('GET /api/meshy/jobs', e)
        return NextResponse.json({ error: '히스토리 조회 실패' }, { status: 500 })
    }
}

/**
 * POST /api/meshy/jobs
 * FormData: image (jpg/png)
 * 권한: 로그인 회원 · 일일 1회(같은 IP 합계 한도 포함) + 보너스, 관리자는 제한 없음
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await requireAuthOrGuest(request)
        if (auth instanceof Response) return auth

        if (auth.isGuest) {
            return NextResponse.json(
                {
                    error: '사진(이미지)→AI 3D는 로그인 후 하루 1회 이용할 수 있습니다. 로그인 후 다시 시도해 주세요.',
                    code: 'LOGIN_REQUIRED',
                },
                { status: 401 }
            )
        }

        const { env } = getCloudflareContext()
        if (!env?.DB || !env?.BUCKET) {
            return NextResponse.json({ error: '스토리지를 사용할 수 없습니다' }, { status: 503 })
        }

        const envRecord = env as unknown as Record<string, unknown>
        const { provider, availability } = await resolveActiveImageTo3DProvider(env.DB, envRecord)
        if (!availability.meshy && !availability.tripo) {
            return NextResponse.json(
                {
                    error: 'AI 모델링 서비스가 아직 설정되지 않았습니다. 관리자에게 문의해 주세요.',
                    code: 'IMAGE_TO_3D_NOT_CONFIGURED',
                },
                { status: 503 }
            )
        }
        const imageMaxBytes = provider === 'tripo' ? TRIPO_IMAGE_MAX_BYTES : MESHY_IMAGE_MAX_BYTES
        const isAllowedImage =
            provider === 'tripo'
                ? (f: { type?: string; name?: string }) => isAllowedTripoImage(f)
                : (f: { type?: string; name?: string }) => isAllowedMeshyImage(f)

        const formData = await request.formData()
        const image = formData.get('image') as File | null
        const extraFiles = ['view_right', 'view_back', 'view_left']
            .map((k) => formData.get(k))
            .filter((f): f is File => f instanceof File && f.size > 0)
        const qualityRaw = String(formData.get('quality') || 'standard')
        const quality = qualityRaw === 'fast' ? 'fast' : 'standard'
        if (!image) {
            return NextResponse.json({ error: '이미지 파일이 필요합니다' }, { status: 400 })
        }
        const imageTypeHint =
            provider === 'tripo' ? 'JPG, PNG 또는 WebP' : 'JPG 또는 PNG'
        if (!isAllowedImage(image)) {
            return NextResponse.json({ error: `${imageTypeHint} 이미지만 지원합니다` }, { status: 400 })
        }
        if (image.size > imageMaxBytes) {
            const mb = Math.round(imageMaxBytes / (1024 * 1024))
            return NextResponse.json({ error: `이미지는 최대 ${mb}MB까지 가능합니다` }, { status: 400 })
        }
        for (const extra of extraFiles) {
            if (!isAllowedImage(extra)) {
                return NextResponse.json(
                    { error: `추가 사진(이미지)도 ${imageTypeHint}만 지원합니다` },
                    { status: 400 }
                )
            }
            if (extra.size > imageMaxBytes) {
                const mb = Math.round(imageMaxBytes / (1024 * 1024))
                return NextResponse.json({ error: `추가 사진(이미지)은 최대 ${mb}MB까지 가능합니다` }, { status: 400 })
            }
        }

        const userId = auth.userId
        const userRow = await env.DB.prepare(`SELECT role FROM users WHERE id = ?`)
            .bind(userId)
            .first<{ role: string | null }>()
        if (!userRow) {
            return NextResponse.json(
                { error: '회원 정보를 찾을 수 없습니다. 다시 로그인해 주세요.', code: 'LOGIN_REQUIRED' },
                { status: 401 }
            )
        }
        const unlimited = isMeshyUnlimitedRole(userRow.role)
        const ipHash = await hashClientIp(
            getClientIp(request),
            typeof envRecord.IP_HASH_SALT === 'string' ? envRecord.IP_HASH_SALT : null
        )

        const safeName = sanitizeR2FileName(image.name || 'photo.jpg')
        const reserved = await reserveMeshyJob(env.DB, {
            userId,
            sourceFileName: safeName,
            provider,
            ipHash,
            unlimited,
        })
        if (!reserved.ok) {
            const ipLimited = reserved.code === 'IP_DAILY_LIMIT'
            return NextResponse.json(
                {
                    error: ipLimited
                        ? `같은 네트워크(IP)에서 오늘 무료 이용 횟수(${MESHY_IP_DAILY_LIMIT}회)를 모두 사용했습니다. 내일 다시 시도해 주세요.`
                        : '오늘 AI 모델링 이용 횟수와 보너스 횟수를 모두 사용했습니다. 내일 다시 시도하거나 관리자에게 추가 횟수를 요청해 주세요.',
                    code: reserved.code,
                    limit: ipLimited ? MESHY_IP_DAILY_LIMIT : MESHY_USER_DAILY_LIMIT,
                    remainingToday: 0,
                    bonusRemaining: 0,
                },
                { status: 429 }
            )
        }
        const { jobId, slot, bonusCreditId } = reserved

        /** 외부 작업이 만들어지기 전 실패: job을 failed로 바꿔 일일 슬롯을 돌려주고, 선차감한 보너스도 복구 */
        const releaseSlot = async (message: string) => {
            await env.DB.prepare(
                `UPDATE meshy_jobs SET status = 'failed', error_message = ?, updated_at = datetime('now') WHERE id = ?`
            )
                .bind(message, jobId)
                .run()
            if (bonusCreditId) await refundMeshyBonusCredit(env.DB, bonusCreditId)
        }

        let externalTaskId: string
        try {
            const sourceKey = `meshy/${jobId}/${safeName}`
            const buffer = await image.arrayBuffer()
            await env.BUCKET.put(sourceKey, buffer, {
                httpMetadata: { contentType: image.type || 'image/jpeg' },
            })

            await env.DB.prepare(
                `UPDATE meshy_jobs SET source_image_key = ?, updated_at = datetime('now') WHERE id = ?`
            )
                .bind(sourceKey, jobId)
                .run()

            const extraBuffers: ArrayBuffer[] = []
            const extraMimes: string[] = []
            const extraNames: string[] = []
            for (const extra of extraFiles) {
                extraBuffers.push(await extra.arrayBuffer())
                extraMimes.push(extra.type || 'image/jpeg')
                extraNames.push(extra.name || 'view.jpg')
            }

            const created = await createImageTo3DTask(provider as ImageTo3DProvider, envRecord, {
                imageBuffer: buffer,
                imageMime: image.type || 'image/jpeg',
                imageName: image.name || 'photo.jpg',
                extraBuffers,
                extraMimes,
                extraNames,
                quality,
            })
            externalTaskId = created.externalTaskId
        } catch (e) {
            const rawMsg =
                e instanceof Error ? e.message : 'AI 모델링 작업 생성에 실패했습니다'
            const msg = sanitizeImageTo3DUserMessage(rawMsg)
            const status = e instanceof TripoApiError ? e.httpStatus : 502
            const code =
                e instanceof TripoApiError && e.tripoCode === 2010
                    ? 'AI_SERVICE_LIMIT'
                    : e instanceof TripoApiError && e.tripoCode === 1002
                      ? 'AI_SERVICE_UNAVAILABLE'
                      : undefined
            await releaseSlot(msg)
            return NextResponse.json({ error: msg, jobId, code }, { status })
        }

        await env.DB.prepare(
            `UPDATE meshy_jobs
             SET status = 'queued', meshy_task_id = ?, progress = 1, updated_at = datetime('now')
             WHERE id = ?`
        )
            .bind(externalTaskId, jobId)
            .run()

        const snapAfter = await getMeshyQuotaSnapshot(env.DB, userId, { unlimited })

        return NextResponse.json({
            success: true,
            data: {
                jobId,
                status: 'queued',
                progress: 1,
                slotUsed: slot,
                remainingToday: snapAfter.remainingDaily,
                bonusRemaining: snapAfter.bonusRemaining,
                remainingTotal: snapAfter.remainingTotal,
            },
        })
    } catch (e) {
        console.error('POST /api/meshy/jobs', e)
        const msg = e instanceof Error && /no such table/i.test(e.message)
            ? 'AI 모델링 DB가 준비되지 않았습니다. 관리자에게 문의해 주세요.'
            : 'AI 모델링 요청에 실패했습니다'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
