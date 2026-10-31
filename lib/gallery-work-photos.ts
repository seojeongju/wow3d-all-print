/**
 * 출력 갤러리 연동 "실제 출력 사례" — 페이지 주제와 맞는 최신 갤러리 사진을 자동 선별.
 * - 최신 갤러리 사진 중 제목·설명·태그에 주제 단어가 들어간 것만 최신순으로 고른다.
 * - 모자라면 고정 출력 사진(seo-work-photos)으로 채워 섹션이 비지 않게 한다.
 * - 이미지는 축소 WebP 썸네일(/api/gallery/image/...?w=)로 제공 — robots에서 허용된 경로라 검색엔진도 수집 가능.
 * 검색 썸네일(og:image)은 수집마다 바뀌지 않도록 기존 고정 사진을 그대로 쓴다.
 */
import { getPublicGallery, type PublicGalleryItem } from '@/lib/gallery-public'
import { resolveGalleryImageUrl } from '@/lib/gallery-image-url'
import { absoluteUrl } from '@/lib/site-url'
import { pickServiceWorkPhotos, type WorkPhoto, type WorkPhotoMethod } from '@/lib/seo-work-photos'

/** 갤러리 사진 출처 표시 (고정 사진과 구분) */
export type GalleryWorkPhoto = WorkPhoto & { fromGallery: boolean }

type TopicRule = {
    /** 한국어 원문·영문 번역 모두에서 찾을 단어 (소문자 비교) */
    keywords: string[]
}

/** 페이지 주제별 선별 단어 — 서비스 slug 기준 */
const TOPIC_RULES: Record<string, TopicRule> = {
    capstone: {
        keywords: [
            '캡스톤', '졸업', '시제품', '시작품', '목업', '프로토타입', '케이스', '하우징', '외장', '부품', '파츠',
            '기구', '브라켓', '조립', '지그', '모듈', '기계', '전자', '설계',
            'capstone', 'graduation', 'prototype', 'mockup', 'mock-up', 'enclosure', 'case', 'housing', 'part',
            'bracket', 'assembly', 'jig', 'module', 'mechanical', 'electronic',
        ],
    },
}

/** 최근 몇 건 안에서 고를지 (갤러리 API 한 페이지 최대 50건) */
const RECENT_PAGES = 2
const PAGE_SIZE = 50

const METHODS: Record<string, WorkPhotoMethod> = { fdm: 'FDM', sla: 'SLA', dlp: 'DLP' }

function parseTags(raw: string | undefined): string[] {
    if (!raw) return []
    try {
        const v = JSON.parse(raw)
        return Array.isArray(v) ? v.map(String) : []
    } catch {
        return []
    }
}

function matchesTopic(item: PublicGalleryItem, rule: TopicRule): boolean {
    const text = [item.title, item.description, ...parseTags(item.tags)].filter(Boolean).join(' ').toLowerCase()
    return rule.keywords.some((k) => text.includes(k))
}

function toWorkPhoto(item: PublicGalleryItem, locale: string): GalleryWorkPhoto | null {
    // R2 갤러리 사진만 (썸네일 변환 가능) — 외부·플레이스홀더 이미지는 제외
    const resolved = resolveGalleryImageUrl(item.image_url)
    if (!resolved.startsWith('/api/gallery/image/')) return null
    const method = METHODS[String(item.print_method || '').toLowerCase()]
    if (!method) return null
    const en = locale === 'en'
    const title = String(item.title || '').trim()
    if (!title) return null
    const material = String(item.material || '').trim() || (method === 'FDM' ? 'PLA' : en ? 'Resin' : '레진')
    const alt = en
        ? `${title} — ${material} ${method} 3D printed part by WOW3D`
        : `${title} — ${material} ${method} 3D프린팅 출력물 (와우쓰리디)`
    const src = `${resolved}?w=960`
    return {
        slug: `gallery-${item.id}`,
        galleryId: Number(item.id),
        method,
        title,
        material,
        alt,
        src,
        srcSmall: `${resolved}?w=480`,
        absoluteSrc: absoluteUrl(src),
        fromGallery: true,
    }
}

/**
 * 서비스 페이지용 출력 사례 사진 (갤러리 연동).
 * 주제 규칙이 없거나 갤러리 조회에 실패하면 기존 고정 사진을 돌려준다.
 */
export async function getServiceGalleryPhotos(
    slug: string,
    locale: string,
    count = 12
): Promise<GalleryWorkPhoto[]> {
    const fixed = (): GalleryWorkPhoto[] =>
        pickServiceWorkPhotos(slug, locale).map((p) => ({ ...p, fromGallery: false }))
    const rule = TOPIC_RULES[slug]
    if (!rule) return fixed()

    const picked: GalleryWorkPhoto[] = []
    try {
        for (let page = 1; page <= RECENT_PAGES && picked.length < count; page++) {
            const { items, pagination } = await getPublicGallery({ page, limit: PAGE_SIZE, locale })
            for (const item of items) {
                if (picked.length >= count) break
                if (!matchesTopic(item, rule)) continue
                const photo = toWorkPhoto(item, locale)
                if (photo && !picked.some((p) => p.galleryId === photo.galleryId)) picked.push(photo)
            }
            if (page >= pagination.totalPages) break
        }
    } catch (e) {
        console.error('갤러리 출력 사례 선별 실패', slug, e)
    }

    // 한 화면(4칸)이 안 차면 고정 사진으로 채움 (같은 갤러리 항목 중복 제외)
    for (const p of fixed()) {
        if (picked.length >= 4) break
        if (!picked.some((x) => x.galleryId === p.galleryId)) picked.push(p)
    }
    return picked.slice(0, count)
}
