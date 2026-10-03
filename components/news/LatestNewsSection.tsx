import { getTranslations } from 'next-intl/server'
import { ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { AppLocale } from '@/i18n/routing'
import { getLatestNews } from '@/lib/news-public'
import NewsCard from './NewsCard'

/** 가이드 허브 등에 붙이는 최신 동향 3개 — 발행 글이 없으면 렌더하지 않음 */
export default async function LatestNewsSection({ locale, limit = 3 }: { locale: AppLocale; limit?: number }) {
    const posts = await getLatestNews(limit)
    if (posts.length === 0) return null
    const t = await getTranslations({ locale, namespace: 'News' })

    return (
        <section className="relative z-10 pb-16">
            <div className="container mx-auto max-w-6xl px-6">
                <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                    <div className="space-y-2">
                        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-300">
                            {t('guidesSectionEyebrow')}
                        </p>
                        <h2 className="text-2xl font-black text-white md:text-3xl">{t('guidesSectionTitle')}</h2>
                        <p className="break-keep text-sm text-white/55">{t('guidesSectionDesc')}</p>
                    </div>
                    <Link
                        href="/news"
                        className="inline-flex items-center gap-1 text-sm font-black text-teal-300 hover:text-teal-200"
                    >
                        {t('viewAll')}
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {posts.map((p) => (
                        <NewsCard
                            key={p.id}
                            post={p}
                            categoryLabel={t(`categories.${p.category}`)}
                            readMoreLabel={t('readMore')}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}
