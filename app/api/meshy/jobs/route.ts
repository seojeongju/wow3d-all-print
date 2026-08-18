import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAuthOrGuest } from '@/lib/api-utils'
import { sanitizeR2FileName } from '@/lib/r2-quote-file'
import {
    MESHY_IMAGE_MAX_BYTES,
    createMeshyImageTo3DTask,
    createMeshyMultiImageTo3DTask,
    isAllowedMeshyImage,
    resolveMeshyApiKey,
    toDataUri,
} from '@/lib/meshy'
import {
    consumeMeshyBonusCredit,
    getMeshyQuotaSnapshot,
    peekMeshySlot,
} from '@/lib/meshy-quota'

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
            credits_used: number | null
            created_at: string
            updated_at: string
        }

        const rows = await env.DB.prepare(
            `SELECT id, status, progress, thumbnail_url, result_file_name, result_file_key,
                    source_file_name, error_message, credits_used, created_at, updated_at
             FROM meshy_jobs
             WHERE user_id = ?
             ORDER BY id DESC
             LIMIT ?`
        )
            .bind(auth.userId, limit)
            .all<JobListRow>()

        const list: JobListRow[] = rows.results ?? []
        const items = list.map((j: JobListRow) => ({
            jobId: j.id,
            status: j.status,
            progress: j.progress || 0,
            thumbnailUrl: j.thumbnail_url,
            resultFileName: j.result_file_name,
            sourceFileName: j.source_file_name,
            modelReady: j.status === 'succeeded' && !!j.result_file_key,
            error: j.error_message,
            creditsUsed: j.credits_used,
            createdAt: j.created_at,
            updatedAt: j.updated_at,
        }))

        return NextResponse.json({ success: true, data: { items } })
    } catch (e) {
        console.error('GET /api/meshy/jobs', e)
        return NextResponse.json({ error: '히스토리 조회 실패' }, { status: 500 })
    }
}

/**
 * POST /api/meshy/jobs
 * FormData: image (jpg/png)
 * 권한: 로그인 회원 · 일일 1회 + 관리자 보너스
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

        const apiKey = resolveMeshyApiKey(env as unknown as Record<string, unknown>)
        if (!apiKey) {
            return NextResponse.json(
                {
                    error: 'AI 모델링 서비스가 아직 설정되지 않았습니다. 관리자에게 문의해 주세요.',
                    code: 'MESHY_NOT_CONFIGURED',
                },
                { status: 503 }
            )
        }

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
        if (!isAllowedMeshyImage(image)) {
            return NextResponse.json({ error: 'JPG 또는 PNG 이미지만 지원합니다' }, { status: 400 })
        }
        if (image.size > MESHY_IMAGE_MAX_BYTES) {
            return NextResponse.json({ error: '이미지는 최대 8MB까지 가능합니다' }, { status: 400 })
        }
        for (const extra of extraFiles) {
            if (!isAllowedMeshyImage(extra)) {
                return NextResponse.json({ error: '추가 사진(이미지)도 JPG 또는 PNG만 지원합니다' }, { status: 400 })
            }
            if (extra.size > MESHY_IMAGE_MAX_BYTES) {
                return NextResponse.json({ error: '추가 사진(이미지)은 최대 8MB까지 가능합니다' }, { status: 400 })
            }
        }

        const userId = auth.userId
        const slot = await peekMeshySlot(env.DB, userId)
        if (!slot) {
            const snap = await getMeshyQuotaSnapshot(env.DB, userId)
            return NextResponse.json(
                {
                    error: '오늘 AI 모델링 이용 횟수와 보너스 횟수를 모두 사용했습니다. 내일 다시 시도하거나 관리자에게 추가 횟수를 요청해 주세요.',
                    code: 'DAILY_LIMIT',
                    limit: snap.limit,
                    remainingToday: 0,
                    bonusRemaining: 0,
                },
                { status: 429 }
            )
        }

        const insert = await env.DB.prepare(
            `INSERT INTO meshy_jobs (user_id, session_id, status, source_file_name, progress)
             VALUES (?, ?, 'uploading', ?, 0)`
        )
            .bind(userId, null, sanitizeR2FileName(image.name || 'photo.jpg'))
            .run()

        const jobId = Number((insert.meta as { last_row_id?: number })?.last_row_id || 0)
        if (!jobId) {
            return NextResponse.json({ error: '작업 생성 실패' }, { status: 500 })
        }

        const safeName = sanitizeR2FileName(image.name || 'photo.jpg')
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

        const dataUri = toDataUri(image.type || 'image/jpeg', buffer)
        const extraUris: string[] = []
        for (const extra of extraFiles) {
            const buf = await extra.arrayBuffer()
            extraUris.push(toDataUri(extra.type || 'image/jpeg', buf))
        }

        let meshyTaskId: string
        try {
            if (extraUris.length > 0) {
                const created = await createMeshyMultiImageTo3DTask(
                    apiKey,
                    [dataUri, ...extraUris],
                    { quality }
                )
                meshyTaskId = created.id
            } else {
                const created = await createMeshyImageTo3DTask(apiKey, dataUri, { quality })
                meshyTaskId = created.id
            }
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Meshy 작업 생성 실패'
            await env.DB.prepare(
                `UPDATE meshy_jobs SET status = 'failed', error_message = ?, updated_at = datetime('now') WHERE id = ?`
            )
                .bind(msg, jobId)
                .run()
            return NextResponse.json({ error: msg, jobId }, { status: 502 })
        }

        // Meshy 성공 후에만 보너스 차감 (실패 시 일일·보너스 모두 미차감)
        if (slot === 'bonus') {
            const ok = await consumeMeshyBonusCredit(env.DB, userId)
            if (!ok) {
                await env.DB.prepare(
                    `UPDATE meshy_jobs SET status = 'failed', error_message = ?, updated_at = datetime('now') WHERE id = ?`
                )
                    .bind('보너스 횟수 차감에 실패했습니다. 다시 시도해 주세요.', jobId)
                    .run()
                return NextResponse.json(
                    { error: '보너스 횟수 차감에 실패했습니다. 다시 시도해 주세요.', jobId },
                    { status: 409 }
                )
            }
        }

        await env.DB.prepare(
            `UPDATE meshy_jobs
             SET status = 'queued', meshy_task_id = ?, progress = 1, updated_at = datetime('now')
             WHERE id = ?`
        )
            .bind(meshyTaskId, jobId)
            .run()

        const snapAfter = await getMeshyQuotaSnapshot(env.DB, userId)

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
