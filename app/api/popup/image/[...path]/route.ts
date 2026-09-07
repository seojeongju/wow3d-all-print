import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

/** 팝업 이미지 공개 서빙 — R2 key: popup/{storeId}/... */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params
    if (!path?.length) {
      return NextResponse.json({ error: '경로 없음' }, { status: 400 })
    }

    const r2Key = 'popup/' + path.join('/')
    const { env } = getCloudflareContext()
    if (!env?.BUCKET) {
      return NextResponse.json({ error: 'R2 BUCKET 없음' }, { status: 503 })
    }

    const object = await env.BUCKET.get(r2Key)
    if (!object) {
      return NextResponse.json({ error: '이미지 없음' }, { status: 404 })
    }

    const headers = new Headers()
    headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg')
    headers.set('Cache-Control', 'public, max-age=2592000, s-maxage=2592000')

    return new NextResponse(object.body as BodyInit, { headers })
  } catch (e) {
    console.error('GET /api/popup/image', e)
    return NextResponse.json({ error: '이미지 로드 실패' }, { status: 500 })
  }
}
