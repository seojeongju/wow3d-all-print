/** 맞춤 상품 공통 타입·헬퍼 (시드 폴백 + 미디어 URL) */

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
export type CustomProductMethod = 'fdm' | 'sla' | 'dlp' | 'mixed'
export type CustomProductImageRole = 'main' | 'sub' | 'detail'

export type CustomProductOption = {
    id: string
    label: string
    choices: string[]
}

export type CustomProductImage = {
    id?: number
    role: CustomProductImageRole
    url: string
    r2Key?: string
    sortOrder: number
}

/** 공개/관리자 공통 표시 모델 */
export type CustomProductPublic = {
    id: number | null
    slug: string
    title: string
    summary: string
    description: string
    detailBody: string
    priceNote: string
    method: CustomProductMethod
    primaryCta: CustomProductCta
    secondaryCta: CustomProductCta | null
    options: CustomProductOption[]
    highlights: string[]
    images: string[]
    detailImages: string[]
    imageRows?: CustomProductImage[]
    sortOrder: number
    isActive: boolean
}

export const CUSTOM_OPTION_PRESETS: CustomProductOption[] = [
    { id: 'color', label: '색상', choices: ['블랙', '화이트', '그레이', '커스텀'] },
    { id: 'size', label: '사이즈', choices: ['S', 'M', 'L', '치수 지정'] },
    { id: 'engraving', label: '각인·텍스트', choices: ['각인 없음', '이름 각인', '로고 각인', '문구 각인'] },
    { id: 'photoUpload', label: '사진 업로드', choices: ['사진 준비됨', '상담 후 업로드'] },
    { id: 'material', label: '소재', choices: ['PLA', 'PETG', '레진', '상담'] },
    { id: 'quantity', label: '수량', choices: ['1개', '5개', '10개', '20개+', '상담'] },
]

const IMG = {
    industrial: '/images/expert/industrial.png',
    medical: '/images/expert/medical.png',
    art: '/images/expert/art.png',
    architecture: '/images/expert/architecture.png',
} as const

/** DB 없을 때 쓰는 정적 시드 */
export const CUSTOM_PRODUCT_SEEDS: Omit<CustomProductPublic, 'id'>[] = [
    {
        slug: 'phone-case',
        title: '커스텀 폰케이스',
        summary: '기종·그립감·각인까지 맞춰 만드는 실용 케이스',
        description:
            '사용 중인 기종과 원하는 스타일을 알려주시면 견적·제작으로 이어드립니다. 파일 업로드 또는 상담 모두 가능합니다.',
        detailBody:
            '기종에 맞는 핏과 그립감을 중심으로 설계합니다.\n원하시는 색상·각인·소재를 선택해 주시면 견적으로 이어집니다.\n시제품 확인 후 소량 제작도 가능합니다.',
        priceNote: '맞춤 견적가',
        method: 'fdm',
        primaryCta: 'quote',
        secondaryCta: 'inquiry',
        options: CUSTOM_OPTION_PRESETS.filter((o) =>
            ['color', 'size', 'engraving', 'material'].includes(o.id)
        ),
        highlights: ['기종별 핏 맞춤', '그립·버튼 레이아웃 조정', '시제품 빠른 검증'],
        images: [IMG.industrial, IMG.architecture, IMG.art, IMG.medical],
        detailImages: [IMG.industrial, IMG.architecture, IMG.art],
        sortOrder: 10,
        isActive: true,
    },
    {
        slug: 'name-tag',
        title: '각인 네임택·키링',
        summary: '이름·로고를 새긴 고해상도 네임택과 키링',
        description:
            '선물용·행사 굿즈·브랜드 키트에 적합합니다. 텍스트와 수량만 정해 주셔도 제작을 시작할 수 있습니다.',
        detailBody:
            '이름·로고·짧은 문구를 고해상도로 각인합니다.\n선물·행사·브랜드 키트에 맞는 수량으로 제작할 수 있습니다.\n소재와 마감은 용도에 맞게 안내드립니다.',
        priceNote: '개당 견적가',
        method: 'sla',
        primaryCta: 'quote',
        secondaryCta: 'inquiry',
        options: CUSTOM_OPTION_PRESETS.filter((o) =>
            ['color', 'size', 'engraving', 'quantity'].includes(o.id)
        ),
        highlights: ['자유 텍스트·로고 각인', '내구성 있는 소재 선택', '선물·이벤트 소량 제작'],
        images: [IMG.art, IMG.industrial, IMG.medical, IMG.architecture],
        detailImages: [IMG.art, IMG.industrial, IMG.medical],
        sortOrder: 20,
        isActive: true,
    },
    {
        slug: 'pet-figure',
        title: '반려동물 피규어',
        summary: '사진으로 만드는 우리 아이 3D 피규어',
        description:
            '사진을 올리면 AI로 3D 모델을 생성한 뒤 출력까지 이어갈 수 있습니다. 기념일·선물용으로 인기입니다.',
        detailBody:
            '사진을 기반으로 AI 3D 모델을 만든 뒤 출력합니다.\n크기와 포즈를 조정해 기념·선물용으로 마감할 수 있습니다.\n정면·측면 사진이 있으면 변환 품질이 좋아집니다.',
        priceNote: '사진 변환 + 출력 견적가',
        method: 'sla',
        primaryCta: 'photo',
        secondaryCta: 'inquiry',
        options: CUSTOM_OPTION_PRESETS.filter((o) =>
            ['photoUpload', 'size', 'color', 'material'].includes(o.id)
        ),
        highlights: ['사진→3D 변환', '크기·포즈 조정', '기념·선물용 마감'],
        images: [IMG.art, IMG.medical, IMG.architecture, IMG.industrial],
        detailImages: [IMG.art, IMG.medical, IMG.architecture],
        sortOrder: 30,
        isActive: true,
    },
    {
        slug: 'desk-stand',
        title: '맞춤 데스크 스탠드',
        summary: '각도·폭을 맞춘 모니터·폰·태블릿 거치대',
        description:
            '책상 환경에 맞춘 치수와 각도로 제작합니다. 로고 각인 옵션도 함께 요청할 수 있습니다.',
        detailBody:
            '모니터·폰·태블릿 거치 각도에 맞춰 치수를 조정합니다.\n책상 환경에 맞는 안정적인 구조로 제작합니다.\n로고 각인 옵션도 함께 요청할 수 있습니다.',
        priceNote: '맞춤 견적가',
        method: 'fdm',
        primaryCta: 'quote',
        secondaryCta: 'inquiry',
        options: CUSTOM_OPTION_PRESETS.filter((o) =>
            ['size', 'color', 'material', 'engraving'].includes(o.id)
        ),
        highlights: ['시야각·각도 맞춤', '안정적인 구조', '오피스·홈오피스용'],
        images: [IMG.architecture, IMG.industrial, IMG.art, IMG.medical],
        detailImages: [IMG.architecture, IMG.industrial, IMG.art],
        sortOrder: 40,
        isActive: true,
    },
    {
        slug: 'industrial-bracket',
        title: '맞춤 브라켓·지그',
        summary: '현장 치수에 맞춘 기능성 브라켓과 지그',
        description:
            '도면·치수·사용 환경을 알려주시면 소재와 구조를 제안하고 시제품부터 소량 제작까지 진행합니다.',
        detailBody:
            '현장 치수와 하중 조건을 반영해 브라켓·지그를 제작합니다.\n도면 또는 참고 치수를 주시면 소재와 구조를 제안합니다.\n시제품 반복 후 소량 배치로 확장할 수 있습니다.',
        priceNote: '도면 기반 견적가',
        method: 'fdm',
        primaryCta: 'inquiry',
        secondaryCta: 'quote',
        options: CUSTOM_OPTION_PRESETS.filter((o) =>
            ['material', 'size', 'quantity'].includes(o.id)
        ),
        highlights: ['강도·소재 제안', '치수 맞춤 핏', '시제품 반복 개선'],
        images: [IMG.industrial, IMG.medical, IMG.architecture, IMG.art],
        detailImages: [IMG.industrial, IMG.medical, IMG.architecture],
        sortOrder: 50,
        isActive: true,
    },
]

export function getAllCustomProducts(): CustomProductPublic[] {
    return CUSTOM_PRODUCT_SEEDS.map((p, i) => ({ ...p, id: -(i + 1) }))
}

export function getCustomProduct(slug: string): CustomProductPublic | undefined {
    const seed = CUSTOM_PRODUCT_SEEDS.find((p) => p.slug === slug)
    if (!seed) return undefined
    return { ...seed, id: null }
}

export function getProductMainImage(product: Pick<CustomProductPublic, 'images'>): string {
    return product.images[0] || '/placeholder-3d.svg'
}

export function customProductMediaUrlFromKey(r2Key: string): string {
    const trimmed = r2Key.replace(/^\/+/, '')
    if (trimmed.startsWith('custom-products/')) {
        return `/api/custom-products/media/${trimmed.slice('custom-products/'.length)}`
    }
    return `/api/custom-products/media/${trimmed}`
}

export function parseJsonArray<T>(raw: string | null | undefined, fallback: T[]): T[] {
    if (!raw) return fallback
    try {
        const v = JSON.parse(raw)
        return Array.isArray(v) ? (v as T[]) : fallback
    } catch {
        return fallback
    }
}

export function slugifyTitle(title: string): string {
    const base = title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]+/gi, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60)
    return base || `product-${Date.now()}`
}

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const IMAGE_MAX_BYTES = 25 * 1024 * 1024

export function validateCustomProductImage(file: File): string | null {
    const t = (file.type || '').toLowerCase()
    if (!IMAGE_TYPES.has(t) && !/\.(jpe?g|png|webp|gif)$/i.test(file.name)) {
        return 'JPG, PNG, WebP, GIF만 업로드할 수 있습니다'
    }
    if (file.size > IMAGE_MAX_BYTES) return '이미지는 최대 25MB까지 가능합니다'
    return null
}

export function extFromImageFile(file: File): string {
    const n = file.name.toLowerCase()
    if (n.endsWith('.png')) return 'png'
    if (n.endsWith('.webp')) return 'webp'
    if (n.endsWith('.gif')) return 'gif'
    return 'jpg'
}

export function isValidCta(v: unknown): v is CustomProductCta {
    return v === 'quote' || v === 'photo' || v === 'inquiry'
}

export function isValidMethod(v: unknown): v is CustomProductMethod {
    return v === 'fdm' || v === 'sla' || v === 'dlp' || v === 'mixed'
}

export function isValidImageRole(v: unknown): v is CustomProductImageRole {
    return v === 'main' || v === 'sub' || v === 'detail'
}
