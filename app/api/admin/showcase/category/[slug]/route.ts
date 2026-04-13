import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';
import { defaultsForSlug, isShowcaseSlug, parseFeaturesJson, showcaseMediaUrlFromKey } from '@/lib/showcase';

/** 관리자: 카테고리 메타 저장 (제목·설명·특징) */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        if (!isShowcaseSlug(slug)) {
            return NextResponse.json({ error: '알 수 없는 카테고리' }, { status: 400 });
        }

        const { env } = getCloudflareContext();
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 });

        const admin = await requireAdminAuth(request, env.DB);
        if (admin instanceof Response) return admin;

        const body = (await request.json()) as {
            title?: string;
            description?: string;
            features?: string[];
            clearCardImage?: boolean;
        };

        if (body.clearCardImage === true && env.BUCKET) {
            const row = await env.DB.prepare(
                `SELECT card_image_key FROM showcase_category_content WHERE store_id = ? AND category_slug = ?`
            )
                .bind(admin.storeId, slug)
                .first<{ card_image_key: string | null }>();
            const key = row?.card_image_key?.trim();
            if (key) {
                try {
                    await env.BUCKET.delete(key);
                } catch {
                    /* ignore */
                }
            }
        }

        const def = defaultsForSlug(slug)!;
        const titleIn = typeof body.title === 'string' ? body.title.trim() : '';
        const descIn = typeof body.description === 'string' ? body.description.trim() : '';
        const finalTitle = titleIn || def.defaultTitle;
        const finalDesc = descIn || def.defaultDescription;
        const finalFeatures = Array.isArray(body.features)
            ? JSON.stringify(
                  body.features.filter((x): x is string => typeof x === 'string').map((s) => s.trim()).filter(Boolean)
              )
            : JSON.stringify(def.defaultFeatures);

        try {
            await env.DB.prepare(
                `INSERT INTO showcase_category_content (store_id, category_slug, title, description, features_json, updated_at)
                 VALUES (?, ?, ?, ?, ?, datetime('now'))
                 ON CONFLICT(store_id, category_slug) DO UPDATE SET
                   title = excluded.title,
                   description = excluded.description,
                   features_json = excluded.features_json,
                   updated_at = datetime('now')`
            )
                .bind(admin.storeId, slug, finalTitle, finalDesc, finalFeatures)
                .run();

            if (body.clearCardImage === true) {
                await env.DB.prepare(
                    `UPDATE showcase_category_content SET card_image_key = NULL, updated_at = datetime('now')
                     WHERE store_id = ? AND category_slug = ?`
                )
                    .bind(admin.storeId, slug)
                    .run();
            }
        } catch (e) {
            console.error('showcase category upsert', e);
            return NextResponse.json({ error: '저장 실패 (마이그레이션 적용 여부 확인)' }, { status: 500 });
        }

        const updated = await env.DB.prepare(
            `SELECT category_slug, title, description, features_json, card_image_key FROM showcase_category_content
             WHERE store_id = ? AND category_slug = ?`
        )
            .bind(admin.storeId, slug)
            .first<{
                title: string | null;
                description: string | null;
                features_json: string | null;
                card_image_key: string | null;
            }>();

        const cardKey = updated?.card_image_key?.trim() || '';
        return NextResponse.json({
            success: true,
            data: {
                slug,
                title: updated?.title?.trim() || def.defaultTitle,
                description: updated?.description?.trim() || def.defaultDescription,
                features: parseFeaturesJson(updated?.features_json || null),
                cardImageUrl: cardKey ? showcaseMediaUrlFromKey(cardKey) : null,
            },
        });
    } catch (e) {
        console.error('PUT /api/admin/showcase/category/[slug]', e);
        return NextResponse.json({ error: '저장 실패' }, { status: 500 });
    }
}
