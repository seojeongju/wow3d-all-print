/**
 * 검색 썸네일(네이버 웹문서·구글 이미지)용 실제 출력 사례.
 * - 갤러리 원본(4000×3000, 4MB 내외)을 1200×900 / 600×450 정적 JPEG로 축소해 public/images/work 에 둠
 * - /api/ 경로가 아닌 정적 URL이라 robots 차단·Worker 지연 없이 수집됨
 */
import { absoluteUrl, buildOgImages, type OgImageDescriptor } from '@/lib/site-url'

export type WorkPhotoMethod = 'FDM' | 'SLA' | 'DLP'
export type WorkPhotoFocus = 'fdm' | 'resin' | 'mixed'

type Localized = { ko: string; en: string }

type WorkPhotoSource = {
    slug: string
    galleryId: number
    method: WorkPhotoMethod
    material: Localized
    title: Localized
}

export const WORK_PHOTO_WIDTH = 1200
export const WORK_PHOTO_HEIGHT = 900
export const WORK_PHOTO_SMALL_WIDTH = 600

const WORK_PHOTOS: WorkPhotoSource[] = [
    { slug: 'fdm-arduino-enclosure', galleryId: 506, method: 'FDM', material: { ko: 'PLA', en: 'PLA' }, title: { ko: '아두이노 제품 케이스', en: 'Arduino product enclosure' } },
    { slug: 'clear-resin-bottle-prototype', galleryId: 503, method: 'DLP', material: { ko: '투명 레진', en: 'Clear resin' }, title: { ko: '투명 유리병 시제품', en: 'Clear bottle prototype' } },
    { slug: 'fdm-architecture-model', galleryId: 512, method: 'FDM', material: { ko: 'PLA', en: 'PLA' }, title: { ko: '졸업작품 건축 모형 파트', en: 'Architecture graduation model parts' } },
    { slug: 'resin-flower-sculpture', galleryId: 500, method: 'DLP', material: { ko: '화이트 레진', en: 'White resin' }, title: { ko: '꽃 모양 조형물', en: 'Flower sculpture' } },
    { slug: 'fdm-mac-mini-storage-tray', galleryId: 484, method: 'FDM', material: { ko: 'PLA', en: 'PLA' }, title: { ko: '맥미니 수납 트레이', en: 'Mac mini storage tray' } },
    { slug: 'sla-micro-precision-part', galleryId: 499, method: 'SLA', material: { ko: '레진', en: 'Resin' }, title: { ko: '미세 정밀 부품', en: 'Micro precision part' } },
    { slug: 'petg-small-electronic-parts', galleryId: 504, method: 'FDM', material: { ko: 'PETG', en: 'PETG' }, title: { ko: '소형 전자 부품', en: 'Small electronic components' } },
    { slug: 'resin-fashion-accessory', galleryId: 507, method: 'DLP', material: { ko: '레진', en: 'Resin' }, title: { ko: '패션 액세서리', en: 'Fashion accessory' } },
    { slug: 'fdm-bluetooth-speaker', galleryId: 8, method: 'FDM', material: { ko: 'PLA', en: 'PLA' }, title: { ko: '블루투스 스피커 하우징', en: 'Bluetooth speaker housing' } },
    { slug: 'sla-museum-exhibit-model', galleryId: 485, method: 'SLA', material: { ko: '화이트 레진', en: 'White resin' }, title: { ko: '박물관 전시 모형(독립문·태극기)', en: 'Museum exhibit models' } },
    { slug: 'abs-production-jig', galleryId: 3, method: 'FDM', material: { ko: 'ABS', en: 'ABS' }, title: { ko: '운동화 청소솔 생산 지그', en: 'Shoe-brush production jig' } },
    { slug: 'flexible-resin-part', galleryId: 495, method: 'DLP', material: { ko: '플렉시블 레진', en: 'Flexible resin' }, title: { ko: '플렉시블 레진 기구물', en: 'Flexible resin mechanism' } },
    { slug: 'fdm-levitation-stand', galleryId: 489, method: 'FDM', material: { ko: 'PLA', en: 'PLA' }, title: { ko: '자기부상(반중력) 스탠드', en: 'Magnetic levitation stand' } },
    { slug: 'dlp-button-jig', galleryId: 7, method: 'DLP', material: { ko: '블랙 레진', en: 'Black resin' }, title: { ko: '의류 단추 및 지그', en: 'Garment buttons and jig' } },
    { slug: 'flexible-resin-tire-model', galleryId: 4, method: 'DLP', material: { ko: '플렉시블 레진', en: 'Flexible resin' }, title: { ko: '자동차 모형 타이어', en: 'Scale model car tires' } },
    { slug: 'resin-bottle-cap-prototype', galleryId: 501, method: 'DLP', material: { ko: '화이트 레진', en: 'White resin' }, title: { ko: '음료수병 뚜껑 시제품', en: 'Bottle cap prototype' } },
]

export type WorkPhoto = {
    slug: string
    galleryId: number
    method: WorkPhotoMethod
    title: string
    material: string
    alt: string
    src: string
    srcSmall: string
    absoluteSrc: string
}

/**
 * 페이지별 대표(첫 장·og:image) 사진 — 한 사진이 여러 페이지의 대표가 되면
 * 네이버가 공통 이미지로 보고 썸네일에서 빼므로 사진당 최대 2페이지로 배분.
 */
const LEAD_BY_SEED: Record<string, string> = {
    services: 'fdm-arduino-enclosure',
    'print-methods': 'clear-resin-bottle-prototype',
    guides: 'resin-flower-sculpture',
    'service:printing': 'fdm-mac-mini-storage-tray',
    'service:prototype': 'petg-small-electronic-parts',
    'service:fdm': 'abs-production-jig',
    'service:sla': 'sla-micro-precision-part',
    'service:graduation': 'fdm-architecture-model',
    'service:small-batch': 'dlp-button-jig',
    'service:modeling': 'sla-museum-exhibit-model',
    'guide:3d-printing-quote-guide': 'fdm-bluetooth-speaker',
    'guide:fdm-vs-sla-vs-dlp': 'resin-fashion-accessory',
    'guide:3d-printing-file-preparation': 'flexible-resin-part',
    'guide:3d-printing-turnaround-time': 'fdm-levitation-stand',
    'guide:best-materials-for-3d-printing-prototypes': 'resin-bottle-cap-prototype',
    'guide:how-to-reduce-3d-printing-cost': 'flexible-resin-tire-model',
    'service:capstone': 'fdm-levitation-stand',
    'guide:capstone-design-prototype-guide': 'resin-bottle-cap-prototype',
    'guide:choosing-infill-density': 'dlp-button-jig',
    'guide:fixing-stl-file-errors': 'sla-museum-exhibit-model',
    'guide:minimum-wall-thickness': 'fdm-bluetooth-speaker',
    'guide:why-support-costs': 'resin-flower-sculpture',
    'guide:3d-printing-tolerances': 'sla-micro-precision-part',
    'guide:splitting-large-3d-prints': 'fdm-mac-mini-storage-tray',
    'guide:graduation-project-checklist': 'fdm-architecture-model',
    'guide:pla-vs-abs-vs-petg': 'petg-small-electronic-parts',
    'guide:best-materials-for-3d-printed-housings-and-cases': 'fdm-arduino-enclosure',
    'guide:best-materials-for-heat-resistant-and-impact-resistant-parts': 'abs-production-jig',
    'guide:standard-vs-tough-vs-clear-vs-flexible-resin': 'flexible-resin-part',
    'guide:best-materials-for-transparent-3d-printed-parts': 'clear-resin-bottle-prototype',
    'guide:best-materials-for-miniatures-and-figurines': 'resin-fashion-accessory',
}

function hashSeed(seed: string): number {
    let h = 5381
    for (let i = 0; i < seed.length; i++) h = ((h << 5) + h + seed.charCodeAt(i)) >>> 0
    return h
}

function isResin(p: WorkPhotoSource) {
    return p.method !== 'FDM'
}

function orderedPool(focus: WorkPhotoFocus): WorkPhotoSource[] {
    const fdm = WORK_PHOTOS.filter((p) => !isResin(p))
    const resin = WORK_PHOTOS.filter(isResin)
    if (focus === 'fdm') return [...fdm, ...resin]
    if (focus === 'resin') return [...resin, ...fdm]
    const mixed: WorkPhotoSource[] = []
    for (let i = 0; i < Math.max(fdm.length, resin.length); i++) {
        if (fdm[i]) mixed.push(fdm[i])
        if (resin[i]) mixed.push(resin[i])
    }
    return mixed
}

function localize(p: WorkPhotoSource, locale: string): WorkPhoto {
    const en = locale === 'en'
    const title = en ? p.title.en : p.title.ko
    const material = en ? p.material.en : p.material.ko
    const alt = en
        ? `${title} — ${material} ${p.method} 3D printed part by WOW3D`
        : `${title} — ${material} ${p.method} 3D프린팅 출력물 (와우쓰리디)`
    const src = `/images/work/${p.slug}.jpg`
    return {
        slug: p.slug,
        galleryId: p.galleryId,
        method: p.method,
        title,
        material,
        alt,
        src,
        srcSmall: `/images/work/${p.slug}-600.jpg`,
        absoluteSrc: absoluteUrl(src),
    }
}

/**
 * 페이지별로 다른 사진 조합을 고정적으로 선택.
 * 같은 seed → 항상 같은 결과(썸네일이 매 수집마다 바뀌지 않도록).
 * focus 우선군 안에서만 회전해 첫 장(대표 이미지)이 페이지 주제와 맞게 함.
 */
export function pickWorkPhotos(options: {
    seed: string
    locale: string
    focus?: WorkPhotoFocus
    count?: number
}): WorkPhoto[] {
    const { seed, locale, focus = 'mixed', count = 4 } = options
    const pool = orderedPool(focus)
    const primaryLen =
        focus === 'mixed' ? pool.length : WORK_PHOTOS.filter((p) => (focus === 'resin') === isResin(p)).length
    const primary = pool.slice(0, primaryLen)
    const leadIndex = primary.findIndex((p) => p.slug === LEAD_BY_SEED[seed])
    const offset = leadIndex >= 0 ? leadIndex : hashSeed(seed) % primary.length
    const rotated = [...primary.slice(offset), ...primary.slice(0, offset), ...pool.slice(primaryLen)]
    return rotated.slice(0, Math.min(count, rotated.length)).map((p) => localize(p, locale))
}

const SERVICE_FOCUS: Record<string, WorkPhotoFocus> = {
    fdm: 'fdm',
    sla: 'resin',
    graduation: 'fdm',
}

/** 서비스 랜딩 slug별 사진 (photo-to-3d는 자체 전후 비교 사진을 쓰므로 제외) */
export function pickServiceWorkPhotos(slug: string, locale: string): WorkPhoto[] {
    if (slug === 'photo-to-3d') return []
    return pickWorkPhotos({ seed: `service:${slug}`, locale, focus: SERVICE_FOCUS[slug] ?? 'mixed' })
}

const GUIDE_FOCUS: Record<string, WorkPhotoFocus> = {
    'pla-vs-abs-vs-petg': 'fdm',
    'standard-vs-tough-vs-clear-vs-flexible-resin': 'resin',
    'best-materials-for-transparent-3d-printed-parts': 'resin',
    'best-materials-for-miniatures-and-figurines': 'resin',
    'best-materials-for-3d-printed-housings-and-cases': 'fdm',
    'best-materials-for-heat-resistant-and-impact-resistant-parts': 'fdm',
}

/** 가이드 slug별 사진 — 본문 그리드와 og:image가 같은 조합을 쓰도록 공용 */
export function pickGuideWorkPhotos(slug: string, locale: string): WorkPhoto[] {
    return pickWorkPhotos({ seed: `guide:${slug}`, locale, focus: GUIDE_FOCUS[slug] ?? 'mixed' })
}

/** 페이지 고유 대표 이미지(실사) → 공통 OG 순 */
export function buildWorkPhotoOgImages(photos: WorkPhoto[]): OgImageDescriptor[] {
    const lead = photos[0]
    if (!lead) return buildOgImages()
    return [
        {
            url: lead.absoluteSrc,
            width: WORK_PHOTO_WIDTH,
            height: WORK_PHOTO_HEIGHT,
            alt: lead.alt,
            type: 'image/jpeg',
        },
        ...buildOgImages(),
    ]
}

/** 사진(이미지)→3D 페이지: 본문 전후 비교에 쓰는 실사 사진을 대표 이미지로 */
export function buildPhotoTo3DOgImages(locale: string): OgImageDescriptor[] {
    return [
        {
            url: absoluteUrl('/images/photo-to-3d/engine-prototype.jpg'),
            width: 1024,
            height: 984,
            alt:
                locale === 'en'
                    ? 'Engine prototype photo converted to a 3D printable model — WOW3D'
                    : '엔진 시제품 사진을 3D 모델로 변환해 출력 — 와우쓰리디 사진→3D',
            type: 'image/jpeg',
        },
        ...buildOgImages(),
    ]
}

export function buildWorkPhotoSchema(photos: WorkPhoto[], locale: string) {
    const org = locale === 'en' ? 'WOW3D Co., Ltd.' : '(주)와우쓰리디'
    return photos.map((p) => ({
        '@context': 'https://schema.org',
        '@type': 'ImageObject',
        contentUrl: p.absoluteSrc,
        url: p.absoluteSrc,
        name: p.title,
        caption: p.alt,
        width: WORK_PHOTO_WIDTH,
        height: WORK_PHOTO_HEIGHT,
        encodingFormat: 'image/jpeg',
        creator: { '@type': 'Organization', name: org, url: absoluteUrl('/') },
        creditText: org,
        copyrightNotice: `© ${org}`,
    }))
}
