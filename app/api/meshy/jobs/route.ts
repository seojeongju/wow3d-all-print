import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAuthOrGuest } from '@/lib/api-utils'
import { sanitizeR2FileName } from '@/lib/r2-quote-file'
import {
    MESHY_GUEST_DAILY_LIMIT,
    MESHY_IMAGE_MAX_BYTES,
    MESHY_USER_DAILY_LIMIT,
    createMeshyImageTo3DTask,
    isAllowedMeshyImage,
    resolveMeshyApiKey,
    toDataUri,
} from '@/lib/meshy'

/**
 * POST /api/meshy/jobs
 * FormData: image (jpg/png)
 * Image → Meshy Image-to-3D 작업 생성
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await requireAuthOrGuest(request)
        if (auth instanceof Response) return auth

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
        if (!image) {
            return NextResponse.json({ error: '이미지 파일이 필요합니다' }, { status: 400 })
        }
        if (!isAllowedMeshyImage(image)) {
            return NextResponse.json({ error: 'JPG 또는 PNG 이미지만 지원합니다' }, { status: 400 })
        }
        if (image.size > MESHY_IMAGE_MAX_BYTES) {
            return NextResponse.json({ error: '이미지는 최대 8MB까지 가능합니다' }, { status: 400 })
        }

        const userId = auth.isGuest ? null : auth.userId
        const sessionId = auth.isGuest ? auth.sessionId : null
        const dailyLimit = auth.isGuest ? MESHY_GUEST_DAILY_LIMIT : MESHY_USER_DAILY_LIMIT

        let usedToday = 0
        if (userId != null) {
            const r = await env.DB.prepare(
                `SELECT COUNT(*) AS c FROM meshy_jobs
                 WHERE user_id = ? AND created_at >= datetime('now', '-1 day')`
            )
                .bind(userId)
                .first<{ c: number }>()
            usedToday = Number(r?.c) || 0
        } else if (sessionId) {
            const r = await env.DB.prepare(
                `SELECT COUNT(*) AS c FROM meshy_jobs
                 WHERE session_id = ? AND created_at >= datetime('now', '-1 day')`
            )
                .bind(sessionId)
                .first<{ c: number }>()
            usedToday = Number(r?.c) || 0
        }

        if (usedToday >= dailyLimit) {
            return NextResponse.json(
                {
                    error: `하루 AI 모델링 한도(${dailyLimit}회)에 도달했습니다. 내일 다시 시도하거나 3D 파일을 직접 업로드해 주세요.`,
                    code: 'DAILY_LIMIT',
                    limit: dailyLimit,
                },
                { status: 429 }
            )
        }
        const insert = await env.DB.prepare(
            `INSERT INTO meshy_jobs (user_id, session_id, status, source_file_name, progress)
             VALUES (?, ?, 'uploading', ?, 0)`
        )
            .bind(userId, sessionId, sanitizeR2FileName(image.name || 'photo.jpg'))
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
        let meshyTaskId: string
        try {
            const created = await createMeshyImageTo3DTask(apiKey, dataUri)
            meshyTaskId = created.id
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Meshy 작업 생성 실패'
            await env.DB.prepare(
                `UPDATE meshy_jobs SET status = 'failed', error_message = ?, updated_at = datetime('now') WHERE id = ?`
            )
                .bind(msg, jobId)
                .run()
            return NextResponse.json({ error: msg, jobId }, { status: 502 })
        }

        await env.DB.prepare(
            `UPDATE meshy_jobs
             SET status = 'queued', meshy_task_id = ?, progress = 1, updated_at = datetime('now')
             WHERE id = ?`
        )
            .bind(meshyTaskId, jobId)
            .run()

        return NextResponse.json({
            success: true,
            data: {
                jobId,
                status: 'queued',
                progress: 1,
                remainingToday: Math.max(0, dailyLimit - usedToday - 1),
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
