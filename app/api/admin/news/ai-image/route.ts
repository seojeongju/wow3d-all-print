import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAdminAuth } from '@/lib/api-utils'
import { NEWS_CATEGORIES, type NewsCategory } from '@/lib/news'
import { generateNewsCoverImage, NEWS_IMAGE_STYLES, type NewsImageStyle } from '@/lib/news-image-ai'

type Body = {
    title?: string
    summary?: string
    category?: string
    tags?: string
    style?: string
    scene?: string
}

/**
 * POST /api/admin/news/ai-image
 * 글 제목·요약으로 대표 이미지 후보를 생성해 base64로 돌려준다(저장하지 않음).
 * 관리자가 미리보기 후 "사용"을 누르면 기존 이미지 업로드 API로 저장한다.
 */
export async function POST(request: NextRequest) {
    try {
        const { env } = getCloudflareContext()
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 })
        const admin = await requireAdminAuth(request, env.DB)
        if (admin instanceof Response) return admin

        const body = (await request.json().catch(() => ({}))) as Body
        const title = String(body.title ?? '').trim()
        const scene = String(body.scene ?? '').trim()
        if (!title && !scene) {
            return NextResponse.json({ error: '제목을 먼저 입력하세요' }, { status: 400 })
        }
        const style: NewsImageStyle = (NEWS_IMAGE_STYLES as readonly string[]).includes(String(body.style))
            ? (body.style as NewsImageStyle)
            : 'photo'
        const category = (NEWS_CATEGORIES as readonly string[]).includes(String(body.category))
            ? (body.category as NewsCategory)
            : undefined

        const result = await generateNewsCoverImage(env, {
            title,
            summary: String(body.summary ?? ''),
            category,
            tags: String(body.tags ?? ''),
            style,
            scene,
        })
        return NextResponse.json({ success: true, data: result })
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        console.error('POST admin news ai-image', e)
        return NextResponse.json({ error: msg || 'AI 이미지 생성 실패' }, { status: 500 })
    }
}
