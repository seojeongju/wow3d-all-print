import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';
import {
    SHOWCASE_SLUGS,
    defaultsForSlug,
    parseFeaturesJson,
    showcaseMediaUrlFromKey,
} from '@/lib/showcase';

/** 관리자: 4개 카테고리 메타 한 번에 (편집 화면용) */
export async function GET(request: NextRequest) {
    try {
        const { env } = getCloudflareContext();
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 });

        const admin = await requireAdminAuth(request, env.DB);
        if (admin instanceof Response) return admin;

        const rows: Record<string, Record<string, unknown>> = {};
        try {
            const res = await env.DB.prepare(
                `SELECT category_slug, title, description, features_json, card_image_key, updated_at
                 FROM showcase_category_content WHERE store_id = ?`
            )
                .bind(admin.storeId)
                .all();
            for (const r of (res.results as Record<string, unknown>[]) || []) {
                rows[String(r.category_slug)] = r;
            }
        } catch (e) {
            console.warn('showcase_category_content', e);
        }

        const categories = SHOWCASE_SLUGS.map((slug) => {
            const def = defaultsForSlug(slug)!;
            const row = rows[slug];
            const cardKey = (row?.card_image_key as string)?.trim() || '';
            return {
                slug,
                title: (row?.title as string)?.trim() || def.defaultTitle,
                description: (row?.description as string)?.trim() || def.defaultDescription,
                features: row?.features_json
                    ? parseFeaturesJson(row.features_json as string)
                    : def.defaultFeatures,
                card_image_key: cardKey || null,
                cardImageUrl: cardKey ? showcaseMediaUrlFromKey(cardKey) : null,
                fallbackImage: def.fallbackImage,
                updated_at: row?.updated_at || null,
            };
        });

        return NextResponse.json({ success: true, data: { categories } });
    } catch (e) {
        console.error('GET /api/admin/showcase', e);
        return NextResponse.json({ error: '쇼케이스 관리 조회 실패' }, { status: 500 });
    }
}
