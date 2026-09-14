/** 3D프린팅 맞춤형 상품 (MVP 시드) */

export const CUSTOM_PRODUCT_SLUGS = [
    'phone-case',
    'name-tag',
    'pet-figure',
    'desk-stand',
    'industrial-bracket',
] as const

export type CustomProductSlug = (typeof CUSTOM_PRODUCT_SLUGS)[number]

export function isCustomProductSlug(s: string): s is CustomProductSlug {
    return (CUSTOM_PRODUCT_SLUGS as readonly string[]).includes(s)
}

export type CustomProductCta = 'quote' | 'photo' | 'inquiry'

export type CustomProductOption = {
    id: string
    labelKey: string
    valuesKey: string
}

export type CustomProductDef = {
    slug: CustomProductSlug
    /** messages/CustomProducts.products.[slug].* */
    image: string
    method: 'fdm' | 'sla' | 'dlp' | 'mixed'
    primaryCta: CustomProductCta
    secondaryCta?: CustomProductCta
    optionIds: string[]
    highlightKeys: string[]
}

/**
 * 옵션 그룹 정의 (상품별로 조합)
 * 라벨/값은 i18n CustomProducts.options.* 사용
 */
export const CUSTOM_OPTION_IDS = [
    'color',
    'size',
    'engraving',
    'photoUpload',
    'material',
    'quantity',
] as const

export type CustomOptionId = (typeof CUSTOM_OPTION_IDS)[number]

export const CUSTOM_PRODUCTS: CustomProductDef[] = [
    {
        slug: 'phone-case',
        image: '/images/expert/industrial.png',
        method: 'fdm',
        primaryCta: 'quote',
        secondaryCta: 'inquiry',
        optionIds: ['color', 'size', 'engraving', 'material'],
        highlightKeys: ['fit', 'grip', 'fast'],
    },
    {
        slug: 'name-tag',
        image: '/images/expert/art.png',
        method: 'sla',
        primaryCta: 'quote',
        secondaryCta: 'inquiry',
        optionIds: ['color', 'size', 'engraving', 'quantity'],
        highlightKeys: ['text', 'durable', 'gift'],
    },
    {
        slug: 'pet-figure',
        image: '/images/expert/art.png',
        method: 'sla',
        primaryCta: 'photo',
        secondaryCta: 'inquiry',
        optionIds: ['photoUpload', 'size', 'color', 'material'],
        highlightKeys: ['photo', 'likeness', 'keepsake'],
    },
    {
        slug: 'desk-stand',
        image: '/images/expert/architecture.png',
        method: 'fdm',
        primaryCta: 'quote',
        secondaryCta: 'inquiry',
        optionIds: ['size', 'color', 'material', 'engraving'],
        highlightKeys: ['angle', 'stable', 'office'],
    },
    {
        slug: 'industrial-bracket',
        image: '/images/expert/industrial.png',
        method: 'fdm',
        primaryCta: 'inquiry',
        secondaryCta: 'quote',
        optionIds: ['material', 'size', 'quantity'],
        highlightKeys: ['strength', 'fitment', 'iterate'],
    },
]

export function getCustomProduct(slug: string): CustomProductDef | undefined {
    return CUSTOM_PRODUCTS.find((p) => p.slug === slug)
}

export function getAllCustomProducts(): CustomProductDef[] {
    return CUSTOM_PRODUCTS
}
