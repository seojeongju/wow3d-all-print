import { getTranslations } from 'next-intl/server'
import { ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import {
    buildWorkPhotoSchema,
    WORK_PHOTO_HEIGHT,
    WORK_PHOTO_SMALL_WIDTH,
    WORK_PHOTO_WIDTH,
    type WorkPhoto,
} from '@/lib/seo-work-photos'

type Props = {
    photos: WorkPhoto[]
    locale: string
    /** section: 페이지 폭 섹션(자체 컨테이너) / block: 이미 컨테이너 안에 끼워 넣을 때 */
    layout?: 'section' | 'block'
}

/**
 * 서버 렌더링되는 실제 출력 사진 그리드.
 * 검색 로봇(Yeti·Googlebot)은 JS를 실행하지 않아도 <img src>를 바로 읽을 수 있어야 썸네일 후보가 됨.
 */
export default async function WorkPhotosSection({ photos, locale, layout = 'section' }: Props) {
    if (photos.length === 0) return null
    const t = await getTranslations({ locale, namespace: 'WorkPhotos' })
    const headingId = `work-photos-${photos[0].slug}`

    const body = (
        <section aria-labelledby={headingId}>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWorkPhotoSchema(photos, locale)) }}
            />
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-teal-400 mb-3">{t('eyebrow')}</p>
            <h2 id={headingId} className="text-2xl md:text-3xl font-black tracking-tight text-white mb-3 break-keep">
                {t('heading')}
            </h2>
            <p className="text-white/60 leading-relaxed break-keep mb-8 max-w-3xl">{t('description')}</p>
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {photos.map((p, i) => (
                    <li key={p.slug}>
                        <figure className="h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                            <Link
                                href={{ pathname: '/gallery', query: { id: String(p.galleryId) } }}
                                className="block overflow-hidden"
                            >
                                <img
                                    src={p.src}
                                    srcSet={`${p.srcSmall} ${WORK_PHOTO_SMALL_WIDTH}w, ${p.src} ${WORK_PHOTO_WIDTH}w`}
                                    sizes="(min-width: 768px) 25vw, 50vw"
                                    alt={p.alt}
                                    width={WORK_PHOTO_WIDTH}
                                    height={WORK_PHOTO_HEIGHT}
                                    loading={i === 0 ? 'eager' : 'lazy'}
                                    decoding="async"
                                    className="aspect-[4/3] w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                                />
                            </Link>
                            <figcaption className="p-3">
                                <p className="text-sm font-bold text-white break-keep">{p.title}</p>
                                <p className="mt-0.5 text-xs text-white/45">
                                    {p.method} · {p.material}
                                </p>
                            </figcaption>
                        </figure>
                    </li>
                ))}
            </ul>
            <div className="mt-6">
                <Link
                    href="/gallery"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-teal-300 hover:text-teal-200"
                >
                    {t('more')}
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </section>
    )

    if (layout === 'block') return body

    return (
        <div className="relative z-10 border-t border-white/10 py-16 sm:py-20">
            <div className="container mx-auto px-6 max-w-6xl">{body}</div>
        </div>
    )
}
