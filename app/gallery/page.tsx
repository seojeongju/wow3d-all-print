import { getPublicGallery } from '@/lib/gallery-public'
import type { GalleryItem } from '@/components/home/GallerySection'
import GalleryPageClient from './GalleryPageClient'

const ITEMS_PER_PAGE = 15

type Props = {
    searchParams: Promise<{ tag?: string }>
}

/** 갤러리 1페이지를 SSR로 렌더 — 이후 페이지는 클라이언트 fetch */
export default async function GalleryPage({ searchParams }: Props) {
    const { tag } = await searchParams
    const galleryTag = tag === 'photo-to-3d' ? ('photo-to-3d' as const) : null
    const result = await getPublicGallery({ page: 1, limit: ITEMS_PER_PAGE, tag: galleryTag })

    return (
        <GalleryPageClient
            initialItems={result.items as GalleryItem[]}
            initialTotalPages={result.pagination.totalPages}
            initialTag={galleryTag ? 'photo-to-3d' : 'all'}
        />
    )
}
