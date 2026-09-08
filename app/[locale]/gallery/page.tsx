import { Suspense } from 'react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getPublicGallery, getPublicGalleryItemById } from '@/lib/gallery-public'
import type { GalleryItem } from '@/components/home/GallerySection'
import { routing, type AppLocale } from '@/i18n/routing'
import GalleryPageClient from './GalleryPageClient'

export const dynamic = 'force-dynamic'

const ITEMS_PER_PAGE = 15

type Props = {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ tag?: string; id?: string }>
}

function resolveLocale(localeParam: string): AppLocale {
    return (routing.locales.includes(localeParam as AppLocale)
        ? localeParam
        : routing.defaultLocale) as AppLocale
}

export default async function GalleryPage({ params, searchParams }: Props) {
    const { locale: localeParam } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)
    const t = await getTranslations({ locale, namespace: 'Gallery' })

    const { tag, id } = await searchParams
    const galleryTag = tag === 'photo-to-3d' ? ('photo-to-3d' as const) : null
    const result = await getPublicGallery({ page: 1, limit: ITEMS_PER_PAGE, tag: galleryTag })
    const initialItemId = id?.trim() || null

    let seedItems = result.items as GalleryItem[]
    if (initialItemId && !seedItems.some((i) => String(i.id) === String(initialItemId))) {
        const one = await getPublicGalleryItemById(initialItemId)
        if (one) seedItems = [one as GalleryItem, ...seedItems]
    }

    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white/40 text-sm">
                    {t('loadingFallback')}
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
