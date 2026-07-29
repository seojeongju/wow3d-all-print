import { getPublicGallery } from '@/lib/gallery-public'
import type { GalleryItem } from '@/components/home/GallerySection'
import GalleryPageClient from './GalleryPageClient'

const ITEMS_PER_PAGE = 15

/** 갤러리 1페이지를 SSR로 렌더 — 이후 페이지는 클라이언트 fetch */
export default async function GalleryPage() {
    const result = await getPublicGallery({ page: 1, limit: ITEMS_PER_PAGE })

    return (
        <GalleryPageClient
            initialItems={result.items as GalleryItem[]}
            initialTotalPages={result.pagination.totalPages}
        />
    )
}
