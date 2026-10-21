import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { isNameTagAudience } from '@/lib/name-tag'
import { suggestNameTag } from '@/lib/name-tag-suggest'

/** POST /api/maker/name-tag-suggest { audience, wish } — 허용 판·아이콘만 고른다. */
export async function POST(request: NextRequest) {
    let body: { audience?: unknown; wish?: unknown }
    try {
        body = (await request.json()) as { audience?: unknown; wish?: unknown }
    } catch {
        return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 })
    }

    if (!isNameTagAudience(body.audience)) {
        return NextResponse.json({ error: '대상은 아이, 강아지, 고양이 중 하나여야 합니다.' }, { status: 400 })
    }

    const wish = typeof body.wish === 'string' ? body.wish : ''
    let ai: { run: (model: string, input: Record<string, unknown>) => Promise<unknown> } | null = null
    try {
        const { env } = getCloudflareContext()
        if (env.AI?.run) ai = env.AI
    } catch {
        ai = null
    }

    const data = await suggestNameTag(body.audience, wish, ai)
    return NextResponse.json({ success: true, data })
}
