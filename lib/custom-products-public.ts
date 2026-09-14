import { getCloudflareContext } from '@opennextjs/cloudflare'
import {
    CUSTOM_PRODUCT_SEEDS,
    customProductMediaUrlFromKey,
    parseJsonArray,
    type CustomProductCta,
    type CustomProductImage,
    type CustomProductMethod,
    type CustomProductOption,
    type CustomProductPublic,
} from '@/lib/custom-products'

const DEFAULT_STORE_ID = 1

type ProductRow = {
    id: number
    slug: string
    title: string
    summary: string | null
    description: string | null
    detail_body: string | null
    price_note: string | null
    method: string
    primary_cta: string
    secondary_cta: string | null
    options_json: string | null
    highlights_json: string | null
    sort_order: number
    is_active: number
}

type ImageRow = {
    id: number
    product_id: number
    role: string
    r2_key: string
    mime_type: string | null
    sort_order: number
}

function mapProduct(row: ProductRow, images: ImageRow[]): CustomProductPublic {
    const imageRows: CustomProductImage[] = images.map((img) => ({
        id: img.id,
        role: (img.role as CustomProductImage['role']) || 'sub',
        url: customProductMediaUrlFromKey(img.r2_key),
        r2Key: img.r2_key,
        sortOrder: img.sort_order,
    }))

    const mains = imageRows.filter((i) => i.role === 'main').sort((a, b) => a.sortOrder - b.sortOrder)
    const subs = imageRows.filter((i) => i.role === 'sub').sort((a, b) => a.sortOrder - b.sortOrder)
    const details = imageRows
        .filter((i) => i.role === 'detail')
        .sort((a, b) => a.sortOrder - b.sortOrder)

    const gallery = [...mains, ...subs].map((i) => i.url)
    // content 역할은 에디터 HTML 전용 — 상세 이미지 목록에 포함하지 않음
    const detailImages = details.map((i) => i.url)

    return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        summary: row.summary || '',
        description: row.description || '',
        detailBody: row.detail_body || '',
        priceNote: row.price_note || '맞춤 견적가',
        method: (row.method as CustomProductMethod) || 'fdm',
        primaryCta: (row.primary_cta as CustomProductCta) || 'quote',
        secondaryCta: (row.secondary_cta as CustomProductCta | null) || null,
        options: parseJsonArray<CustomProductOption>(row.options_json, []),
        highlights: parseJsonArray<string>(row.highlights_json, []),
        images: gallery.length > 0 ? gallery : ['/placeholder-3d.svg'],
        detailImages: detailImages.length > 0 ? detailImages : gallery,
        imageRows,
        sortOrder: row.sort_order ?? 0,
        isActive: row.is_active !== 0,
    }
}

async function loadImages(
    db: any,
    productIds: number[]
): Promise<Map<number, ImageRow[]>> {
    const map = new Map<number, ImageRow[]>()
    if (productIds.length === 0) return map
    const placeholders = productIds.map(() => '?').join(',')
    const res = await db
        .prepare(
            `SELECT id, product_id, role, r2_key, mime_type, sort_order
             FROM custom_product_images
             WHERE product_id IN (${placeholders})
             ORDER BY sort_order ASC, id ASC`
        )
        .bind(...productIds)
        .all()
    const rows = (res?.results || []) as ImageRow[]
    for (const row of rows) {
        const list = map.get(row.product_id) || []
        list.push(row)
        map.set(row.product_id, list)
    }
    return map
}

function seedFallbackList(includeInactive = false): CustomProductPublic[] {
    return CUSTOM_PRODUCT_SEEDS.filter((p) => includeInactive || p.isActive).map((p, i) => ({
        ...p,
        id: -(i + 1),
    }))
}

/** 공개 목록 (활성만) */
export async function getCustomProductList(): Promise<CustomProductPublic[]> {
    try {
        const { env } = await getCloudflareContext({ async: true })
        if (!env?.DB) return seedFallbackList()

        const res = await env.DB.prepare(
            `SELECT * FROM custom_products
             WHERE store_id = ? AND is_active = 1
             ORDER BY sort_order ASC, id DESC`
        )
            .bind(DEFAULT_STORE_ID)
            .all()

        const rows = (res?.results || []) as ProductRow[]
        if (rows.length === 0) return seedFallbackList()

        const imgMap = await loadImages(
            env.DB,
            rows.map((r: ProductRow) => r.id)
        )
        return rows.map((r: ProductRow) => mapProduct(r, imgMap.get(r.id) || []))
    } catch (e) {
        console.warn('getCustomProductList', e)
        return seedFallbackList()
    }
}

/** 공개 상세 */
export async function getCustomProductBySlug(
    slug: string
): Promise<CustomProductPublic | null> {
    const normalized = (() => {
        let s = String(slug || '').trim()
        for (let i = 0; i < 2; i++) {
            try {
                if (/%[0-9A-Fa-f]{2}/.test(s)) s = decodeURIComponent(s)
                else break
            } catch {
                break
            }
        }
        return s.trim()
    })()

    try {
        const { env } = await getCloudflareContext({ async: true })
        if (!env?.DB) {
            const seed = CUSTOM_PRODUCT_SEEDS.find(
                (p) => p.slug === normalized && p.isActive
            )
            return seed ? { ...seed, id: null } : null
        }

        let row = (await env.DB.prepare(
            `SELECT * FROM custom_products
             WHERE store_id = ? AND slug = ? AND is_active = 1`
        )
            .bind(DEFAULT_STORE_ID, normalized)
            .first()) as ProductRow | null

        // 관리자 미리보기: 비활성도 slug로 조회 시도하지 않음(공개만)
        // 인코딩 차이로 못 찾는 경우 목록에서 매칭
        if (!row) {
            const all = await env.DB.prepare(
                `SELECT * FROM custom_products
                 WHERE store_id = ? AND is_active = 1`
            )
                .bind(DEFAULT_STORE_ID)
                .all()
            const rows = (all?.results || []) as ProductRow[]
            row =
                rows.find((r) => r.slug === normalized) ||
                rows.find((r) => decodeURIComponentSafe(r.slug) === normalized) ||
                null
        }

        if (!row) {
            const seed = CUSTOM_PRODUCT_SEEDS.find(
                (p) => p.slug === normalized && p.isActive
            )
            return seed ? { ...seed, id: null } : null
        }

        const imgMap = await loadImages(env.DB, [row.id])
        return mapProduct(row, imgMap.get(row.id) || [])
    } catch (e) {
        console.warn('getCustomProductBySlug', e)
        const seed = CUSTOM_PRODUCT_SEEDS.find(
            (p) => p.slug === normalized && p.isActive
        )
        return seed ? { ...seed, id: null } : null
    }
}

function decodeURIComponentSafe(s: string): string {
    try {
        return decodeURIComponent(s)
    } catch {
        return s
    }
}

/** 관리자 목록 (비활성 포함) */
export async function getAdminCustomProductList(
    db: any,
    storeId: number
): Promise<CustomProductPublic[]> {
    const res = await db
        .prepare(
            `SELECT * FROM custom_products
             WHERE store_id = ?
             ORDER BY sort_order ASC, id DESC`
        )
        .bind(storeId)
        .all()
    const rows = (res?.results || []) as ProductRow[]
    const imgMap = await loadImages(
        db,
        rows.map((r: ProductRow) => r.id)
    )
    return rows.map((r: ProductRow) => mapProduct(r, imgMap.get(r.id) || []))
}

export async function getAdminCustomProductById(
    db: any,
    storeId: number,
    id: number
): Promise<CustomProductPublic | null> {
    const row = (await db
        .prepare(`SELECT * FROM custom_products WHERE store_id = ? AND id = ?`)
        .bind(storeId, id)
        .first()) as ProductRow | null
    if (!row) return null
    const imgMap = await loadImages(db, [row.id])
    return mapProduct(row, imgMap.get(row.id) || [])
}

export { mapProduct }
export type { ProductRow, ImageRow }
