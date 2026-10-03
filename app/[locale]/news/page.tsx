import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { MessageSquare, Newspaper, Zap } from 'lucide-react'
import { getPathname, Link } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'
import { absoluteUrl, buildOgImages, SITE_URL } from '@/lib/site-url'
import { getPublishedNewsList } from '@/lib/news-public'
import { isNewsCategory, NEWS_CATEGORIES, NEWS_PAGE_SIZE, type NewsCategory } from '@/lib/news'
import { buildBreadcrumbSchema, buildCollectionPageSchema } from '@/lib/aeo-schema'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import NewsCard from '@/components/news/NewsCard'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** 관리자가 발행한 글이 배포 없이 바로 보이도록 런타임 렌더 */
export const dynamic = 'force-dynamic'

type Props = {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ category?: string; page?: string }>
}

function resolveLocale(localeParam: string): AppLocale {
    return (routing.locales.includes(localeParam as AppLocale)
        ? localeParam
        : routing.defaultLocale) as AppLocale
}

function parseQuery(sp: { category?: string; page?: string }): { category: NewsCategory | null; page: number } {
    const category = isNewsCategory(sp.category) ? sp.category : null
    const n = Number(sp.page)
    const page = Number.isInteger(n) && n > 1 ? n : 1
    return { category, page }
}

function listHref(category: NewsCategory | null, page: number): string {
    const qs = new URLSearchParams()
    if (category) qs.set('category', category)
    if (page > 1) qs.set('page', String(page))
    const s = qs.toString()
    return s ? `/news?${s}` : '/news'
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
    const { locale: localeParam } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)
    const { category, page } = parseQuery(await searchParams)
    const t = await getTranslations({ locale, namespace: 'News' })

    const suffix = [category ? t(`categories.${category}`) : '', page > 1 ? t('pageLabel', { page }) : '']
        .filter(Boolean)
        .join(' · ')
    const title = suffix ? `${t('metaTitle')} (${suffix})` : t('metaTitle')
    const description = t('metaDescription')
    /** 기사 본문은 한국어 전용 — 영문 경로는 한국어 페이지를 정본으로 지정 */
    const koUrl = `${SITE_URL}${getPathname({ locale: 'ko', href: listHref(category, page) })}`
    const ogImages = buildOgImages(locale)

    return {
        title,
        description,
        alternates: {
            canonical: koUrl,
            types: { 'application/rss+xml': `${SITE_URL}/rss.xml` },
        },
        robots: locale === 'en' ? { index: false, follow: true } : undefined,
        openGraph: {
            title,
            description,
            url: koUrl,
            type: 'website',
            locale: 'ko_KR',
            images: ogImages,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: ogImages.map((img) => img.url),
        },
    }
}

export default async function NewsListPage({ params, searchParams }: Props) {
    const { locale: localeParam } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)
    const { category, page } = parseQuery(await searchParams)
    const t = await getTranslations({ locale, namespace: 'News' })
    const { items, pageCount } = await getPublishedNewsList({ page, category })

    const hubPath = getPathname({ locale: 'ko', href: '/news' })
    const schemas = [
        buildCollectionPageSchema({
            name: `${t('hubTitle')} ${t('hubTitleAccent')}`,
            description: t('metaDescription'),
            path: hubPath,
        }),
        {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            url: absoluteUrl(hubPath),
            numberOfItems: items.length,
            itemListElement: items.map((p, i) => ({
                '@type': 'ListItem',
                position: (page - 1) * NEWS_PAGE_SIZE + i + 1,
                url: absoluteUrl(getPathname({ locale: 'ko', href: `/news/${p.slug}` })),
                name: p.title,
            })),
        },
        buildBreadcrumbSchema([
            { name: t('breadcrumbHome'), path: locale === 'en' ? '/en' : '/' },
            { name: `${t('hubTitle')} ${t('hubTitleAccent')}`, path: getPathname({ locale, href: '/news' }) },
        ]),
    ]

    const chips: { id: NewsCategory | null; label: string }[] = [
        { id: null, label: t('allCategories') },
        ...NEWS_CATEGORIES.map((c) => ({ id: c, label: t(`categories.${c}`) })),
    ]

    return (
        <main className="relative flex min-h-screen w-full max-w-[100vw] flex-col overflow-x-hidden bg-[#020617] text-slate-50">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />
            <Header />

            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e293b_0%,#020617_100%)]" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-[length:40px_40px] opacity-[0.05]" />
                <div className="absolute right-[8%] top-[12%] h-[36%] w-[36%] max-w-[280px] rounded-full bg-teal-500/10 blur-[120px]" />
            </div>

            <section className="relative z-10 px-4 pb-8 pt-32 sm:px-6 sm:pt-36 md:pb-12 md:pt-44">
                <div className="container mx-auto min-w-0 max-w-6xl space-y-4 text-center sm:space-y-5">
                    <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/15 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-teal-300 sm:px-4 sm:text-[11px] sm:tracking-[0.25em]">
                        <Newspaper className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{t('eyebrow')}</span>
                    </div>
                    <h1 className="break-keep px-1 text-[1.75rem] font-black leading-tight tracking-tight text-white sm:text-4xl md:text-6xl">
                        {t('hubTitle')} <span className="text-teal-400">{t('hubTitleAccent')}</span>
                    </h1>
                    <p className="mx-auto max-w-2xl break-keep px-1 text-sm font-bold leading-relaxed text-white/50 sm:text-base md:text-lg">
                        {t('hubSubtitle')}
                    </p>
                    {t('koreanOnlyNotice') ? (
                        <p className="text-xs font-bold text-amber-300/80">{t('koreanOnlyNotice')}</p>
                    ) : null}
                </div>
            </section>

            <section className="relative z-10 px-4 pb-16 sm:px-6 md:pb-24">
                <div className="container mx-auto min-w-0 max-w-7xl">
                    <nav className="mb-8 flex flex-wrap justify-center gap-2" aria-label={t('allCategories')}>
                        {chips.map((c) => (
                            <Link
                                key={c.id ?? 'all'}
                                href={listHref(c.id, 1)}
                                className={cn(
                                    'rounded-full border px-4 py-2 text-xs font-black transition-colors sm:text-sm',
                                    category === c.id
                                        ? 'border-teal-400/50 bg-teal-400/15 text-teal-200'
                                        : 'border-white/10 bg-white/5 text-white/55 hover:text-white'
                                )}
                            >
                                {c.label}
                            </Link>
                        ))}
                    </nav>

                    {items.length === 0 ? (
                        <p className="rounded-2xl border border-white/10 bg-white/[0.03] py-16 text-center text-sm font-bold text-white/45">
                            {t('empty')}
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 md:gap-6">
                            {items.map((p) => (
                                <NewsCard
                                    key={p.id}
                                    post={p}
                                    categoryLabel={t(`categories.${p.category}`)}
                                    readMoreLabel={t('readMore')}
                                />
                            ))}
                        </div>
                    )}

                    {pageCount > 1 ? (
                        <div className="mt-10 flex items-center justify-center gap-3 text-sm font-bold">
                            {page > 1 ? (
                                <Link
                                    href={listHref(category, page - 1)}
                                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white/80 hover:text-white"
                                    rel="prev"
                                >
                                    {t('prevPage')}
                                </Link>
                            ) : null}
                            <span className="text-white/45">{t('pageOf', { page, total: pageCount })}</span>
                            {page < pageCount ? (
                                <Link
                                    href={listHref(category, page + 1)}
                                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white/80 hover:text-white"
                                    rel="next"
                                >
                                    {t('nextPage')}
                                </Link>
                            ) : null}
                        </div>
                    ) : null}

                    <div className="mt-12 flex min-w-0 flex-col gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 md:mt-16 md:flex-row md:items-center md:gap-8 md:rounded-[2rem] md:p-8">
                        <div className="min-w-0 flex-1 space-y-2">
                            <h2 className="break-keep text-xl font-black text-white md:text-2xl">{t('ctaTitle')}</h2>
                            <p className="break-keep text-sm font-bold text-white/45">{t('ctaDesc')}</p>
                        </div>
                        <div className="flex w-full shrink-0 flex-col gap-3 sm:flex-row md:w-auto">
                            <Link href="/quote" className="block w-full sm:w-auto">
                                <Button className="h-12 w-full gap-2 rounded-xl bg-teal-400 px-6 font-black text-slate-950 sm:w-auto">
                                    <Zap className="h-4 w-4" />
                                    {t('ctaQuote')}
                                </Button>
                            </Link>
                            <Link href="/expert#inquiry" className="block w-full sm:w-auto">
                                <Button
                                    variant="outline"
                                    className="h-12 w-full gap-2 rounded-xl border-white/15 bg-white/5 px-6 font-black text-white sm:w-auto"
                                >
                                    <MessageSquare className="h-4 w-4" />
                                    {t('ctaInquiry')}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    )
}
