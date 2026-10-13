import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAdminAuth } from '@/lib/api-utils'
import {
    backfillTranslations,
    getTranslationStatus,
    type LocalizeSpec,
    type TranslationEntityType,
} from '@/lib/content-translations'
import { getAllPublicGalleryTextItems, getGalleryTranslationSpec } from '@/lib/gallery-public'
import {
    customProductTranslationSpec,
    getAdminCustomProductList,
} from '@/lib/custom-products-public'

/** 한 번 호출에 번역할 최대 항목 수 — 요청 시간 한도 안에서 끝나도록 */
const MAX_BATCH = 30

function parseType(v: unknown): TranslationEntityType | null {
    return v === 'gallery' || v === 'custom_product' ? v : null
}

async function withTargets<R>(
    db: CloudflareEnv['DB'],
    storeId: number,
    type: TranslationEntityType,
    fn: <T>(spec: LocalizeSpec<T>, items: T[]) => Promise<R>
): Promise<R> {
    if (type === 'gallery') {
        return fn(getGalleryTranslationSpec(), await getAllPublicGalleryTextItems(db))
    }
    return fn(customProductTranslationSpec, await getAdminCustomProductList(db, storeId))
}

// GET /api/admin/content-translations?type=gallery — 영문 번역 현황
export async function GET(request: NextRequest) {
    try {
        const { env } = getCloudflareContext()
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 })
        const admin = await requireAdminAuth(request, env.DB)
        if (admin instanceof Response) return admin

        const type = parseType(request.nextUrl.searchParams.get('type'))
        if (!type) return NextResponse.json({ error: 'type은 gallery 또는 custom_product' }, { status: 400 })

        const status = await withTargets(env.DB, admin.storeId, type, (spec, items) =>
            getTranslationStatus(env.DB, spec, items)
        )
        return NextResponse.json({ success: true, data: status })
    } catch (e) {
        console.error('GET /api/admin/content-translations', e)
        return NextResponse.json({ error: '번역 현황 조회 실패' }, { status: 500 })
    }
}

// POST /api/admin/content-translations { type, limit } — 번역이 없거나 낡은 항목을 Workers AI로 번역
export async function POST(request: NextRequest) {
    try {
        const { env } = getCloudflareContext()
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 })
        const admin = await requireAdminAuth(request, env.DB)
        if (admin instanceof Response) return admin
        if (!env.AI?.run) {
            return NextResponse.json({ error: 'Workers AI 바인딩이 없습니다' }, { status: 503 })
        }

        const body = (await request.json().catch(() => ({}))) as { type?: unknown; limit?: unknown }
        const type = parseType(body.type)
        if (!type) return NextResponse.json({ error: 'type은 gallery 또는 custom_product' }, { status: 400 })
        const limit = Math.min(MAX_BATCH, Math.max(1, Number(body.limit) || 10))

        const ai = env.AI
        const result = await withTargets(env.DB, admin.storeId, type, (spec, items) =>
            backfillTranslations(env.DB, ai, spec, items, limit)
        )
        return NextResponse.json({ success: true, data: result })
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        if (/no such table/i.test(msg)) {
            return NextResponse.json(
                {
                    error: 'content_translations 테이블이 없습니다. migrations/schema_content_translations.sql 을 실행하세요.',
                    code: 'TABLE_MISSING',
                },
                { status: 503 }
            )
        }
        console.error('POST /api/admin/content-translations', e)
        return NextResponse.json({ error: '번역 실패' }, { status: 500 })
    }
}
