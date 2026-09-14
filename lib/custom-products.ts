/** 3D프린팅 맞춤형 상품 (스마트스토어형 PDP 시드) */

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

export type CustomProductDef = {
    slug: CustomProductSlug
    /** 대표 이미지(첫 장) + 서브 이미지 */
    images: string[]
    /** 상세 본문 하단 이미지(스마트스토어 상세컷) */
    detailImages: string[]
    method: 'fdm' | 'sla' | 'dlp' | 'mixed'
    primaryCta: CustomProductCta
    secondaryCta?: CustomProductCta
    optionIds: string[]
    highlightKeys: string[]
    /** 표시용 가격 안내 키: CustomProducts.products.[slug].priceNote */
}

export const CUSTOM_OPTION_IDS = [
    'color',
    'size',
    'engraving',
    'photoUpload',
    'material',
    'quantity',
] as const

export type CustomOptionId = (typeof CUSTOM_OPTION_IDS)[number]

const IMG = {
    industrial: '/images/expert/industrial.png',
    medical: '/images/expert/medical.png',
    art: '/images/expert/art.png',
    architecture: '/images/expert/architecture.png',
} as const

export const CUSTOM_PRODUCTS: CustomProductDef[] = [
    {
        slug: 'phone-case',
        images: [IMG.industrial, IMG.architecture, IMG.art, IMG.medical],
        detailImages: [IMG.industrial, IMG.architecture, IMG.art],
        method: 'fdm',
        primaryCta: 'quote',
        secondaryCta: 'inquiry',
        optionIds: ['color', 'size', 'engraving', 'material'],
        highlightKeys: ['fit', 'grip', 'fast'],
    },
    {
        slug: 'name-tag',
        images: [IMG.art, IMG.industrial, IMG.medical, IMG.architecture],
        detailImages: [IMG.art, IMG.industrial, IMG.medical],
        method: 'sla',
        primaryCta: 'quote',
        secondaryCta: 'inquiry',
        optionIds: ['color', 'size', 'engraving', 'quantity'],
        highlightKeys: ['text', 'durable', 'gift'],
    },
    {
        slug: 'pet-figure',
        images: [IMG.art, IMG.medical, IMG.architecture, IMG.industrial],
        detailImages: [IMG.art, IMG.medical, IMG.architecture],
        method: 'sla',
        primaryCta: 'photo',
        secondaryCta: 'inquiry',
        optionIds: ['photoUpload', 'size', 'color', 'material'],
        highlightKeys: ['photo', 'likeness', 'keepsake'],
    },
    {
        slug: 'desk-stand',
        images: [IMG.architecture, IMG.industrial, IMG.art, IMG.medical],
        detailImages: [IMG.architecture, IMG.industrial, IMG.art],
        method: 'fdm',
        primaryCta: 'quote',
        secondaryCta: 'inquiry',
        optionIds: ['size', 'color', 'material', 'engraving'],
        highlightKeys: ['angle', 'stable', 'office'],
    },
    {
        slug: 'industrial-bracket',
        images: [IMG.industrial, IMG.medical, IMG.architecture, IMG.art],
        detailImages: [IMG.industrial, IMG.medical, IMG.architecture],
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

export function getProductMainImage(product: CustomProductDef): string {
    return product.images[0] || '/placeholder-3d.svg'
}
