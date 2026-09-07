import { Suspense } from 'react'
import { getPublicGallery, getPublicGalleryItemById } from '@/lib/gallery-public'
import type { GalleryItem } from '@/components/home/GallerySection'
import GalleryPageClient from './GalleryPageClient'

export const dynamic = 'force-dynamic'

const ITEMS_PER_PAGE = 15

type Props = {
    searchParams: Promise<{ tag?: string; id?: string }>
}

/** 갤러리 1페이지를 SSR로 렌더 — 이후 페이지는 클라이언트 fetch */
export default async function GalleryPage({ searchParams }: Props) {
    const { tag, id } = await searchParams
    const galleryTag = tag === 'photo-to-3d' ? ('photo-to-3d' as const) : null
    const result = await getPublicGallery({ page: 1, limit: ITEMS_PER_PAGE, tag: galleryTag })
    const initialItemId = id?.trim() || null

    // id가 1페이지에 없으면 단건 조회로 상세 시드 (홈 슬라이더 → 상세 진입)
    let seedItems = result.items as GalleryItem[]
    if (initialItemId && !seedItems.some((i) => String(i.id) === String(initialItemId))) {
        const one = await getPublicGalleryItemById(initialItemId)
        if (one) seedItems = [one as GalleryItem, ...seedItems]
    }

    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white/40 text-sm">
                    갤러리 불러오는 중…
                </div>
            }
        >
            <GalleryPageClient
                initialItems={seedItems}
                initialTotalPages={result.pagination.totalPages}
                initialTag={galleryTag ? 'photo-to-3d' : 'all'}
                initialItemId={initialItemId}
            />
        </Suspense>
    )
}
