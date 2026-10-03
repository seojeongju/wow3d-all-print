import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAdminAuth } from '@/lib/api-utils'
import { newsImageExt, newsMediaUrlFromKey, validateNewsImage } from '@/lib/news'

type Ctx = { params: Promise<{ id: string }> }

/** 관리자: 최신 동향 이미지 업로드 (role=cover|content) */
export async function POST(request: NextRequest, { params }: Ctx) {
    try {
        const { id: idRaw } = await params
        const postId = Number(idRaw)
        if (!Number.isInteger(postId) || postId < 1) {
            return NextResponse.json({ error: '잘못된 ID' }, { status: 400 })
        }

        const { env } = getCloudflareContext()
        if (!env?.DB || !env.BUCKET) return NextResponse.json({ error: '스토리지 없음' }, { status: 503 })
        const admin = await requireAdminAuth(request, env.DB)
        if (admin instanceof Response) return admin

        const post = await env.DB.prepare(`SELECT id, cover_r2_key FROM news_posts WHERE store_id = ? AND id = ?`)
            .bind(admin.storeId, postId)
            .first<{ id: number; cover_r2_key: string | null }>()
        if (!post) return NextResponse.json({ error: '게시글을 찾을 수 없습니다' }, { status: 404 })

        const formData = await request.formData()
        const file = formData.get('image') as File | null
        const role = String(formData.get('role') || 'content')
        if (!file) return NextResponse.json({ error: '이미지 파일이 필요합니다' }, { status: 400 })
        if (role !== 'cover' && role !== 'content') {
            return NextResponse.json({ error: 'role은 cover|content 이어야 합니다' }, { status: 400 })
        }
        const err = validateNewsImage(file)
        if (err) return NextResponse.json({ error: err }, { status: 400 })

        const r2Key = `news/${admin.storeId}/${postId}/${role}_${Date.now()}_${Math.random().toString(36).slice(2)}.${newsImageExt(file)}`
        await env.BUCKET.put(r2Key, await file.arrayBuffer(), {
            httpMetadata: { contentType: file.type || 'image/jpeg' },
        })

        if (role === 'cover') {
            if (post.cover_r2_key) {
                try {
                    await env.BUCKET.delete(post.cover_r2_key)
                } catch {
                    /* 무시 */
                }
            }
            await env.DB.prepare(
                `UPDATE news_posts SET cover_r2_key = ?, updated_at = datetime('now') WHERE id = ?`
            )
                .bind(r2Key, postId)
                .run()
        }

        return NextResponse.json({ success: true, data: { role, r2Key, url: newsMediaUrlFromKey(r2Key) } })
    } catch (e) {
        console.error('POST admin news images', e)
        return NextResponse.json({ error: '이미지 업로드 실패' }, { status: 500 })
    }
}
