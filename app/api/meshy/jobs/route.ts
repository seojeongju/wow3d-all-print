import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAuthOrGuest } from '@/lib/api-utils'
import { sanitizeR2FileName } from '@/lib/r2-quote-file'
import {
    MESHY_IMAGE_MAX_BYTES,
    MESHY_TODAY_KST_SQL,
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
 * 권한: 로그인 회원만, 계정당 한국 시간 기준 1일 1회
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await requireAuthOrGuest(request)
        if (auth instanceof Response) return auth

        if (auth.isGuest) {
            return NextResponse.json(
                {
                    error: '사진→AI 3D는 로그인 후 하루 1회 이용할 수 있습니다. 로그인 후 다시 시도해 주세요.',
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
        if (!image) {
            return NextResponse.json({ error: '이미지 파일이 필요합니다' }, { status: 400 })
        }
        if (!isAllowedMeshyImage(image)) {
            return NextResponse.json({ error: 'JPG 또는 PNG 이미지만 지원합니다' }, { status: 400 })
        }
        if (image.size > MESHY_IMAGE_MAX_BYTES) {
            return NextResponse.json({ error: '이미지는 최대 8MB까지 가능합니다' }, { status: 400 })
        }

        const userId = auth.userId
        const dailyLimit = MESHY_USER_DAILY_LIMIT

        // 실패(failed)만 제외 — 진행 중·성공은 오늘 할당으로 집계
        const r = await env.DB.prepare(
            `SELECT COUNT(*) AS c FROM meshy_jobs
             WHERE user_id = ?
               AND ${MESHY_TODAY_KST_SQL}
               AND status != 'failed'`
        )
            .bind(userId)
            .first<{ c: number }>()
        const usedToday = Number(r?.c) || 0

        if (usedToday >= dailyLimit) {
            return NextResponse.json(
                {
                    error: '오늘 AI 모델링 이용 횟수(1회)를 모두 사용했습니다. 내일 다시 시도하거나 3D 파일을 직접 업로드해 주세요.',
                    code: 'DAILY_LIMIT',
                    limit: dailyLimit,
                    remainingToday: 0,
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
