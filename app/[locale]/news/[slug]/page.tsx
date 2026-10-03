import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ArrowLeft, ChevronRight, ExternalLink, Lightbulb, ListChecks, MessageSquare, Zap } from 'lucide-react'
import { getPathname, Link } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'
import { absoluteUrl, BRAND_LOGO_PATH, OG_IMAGE_WIDE_PATH, SITE_URL } from '@/lib/site-url'
import { getLatestNews, getPublishedNewsBySlug } from '@/lib/news-public'
import { formatNewsDateKo, resolveNewsDescription, utcSqlToIso, type NewsPost } from '@/lib/news'
import { buildBreadcrumbSchema } from '@/lib/aeo-schema'
import { isProbablyHtml, plainTextToHtml, sanitizeDetailHtml } from '@/lib/sanitize-html'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import NewsCard, { NEWS_BODY_CLASS } from '@/components/news/NewsCard'
import { NewsCoverImage } from '@/components/news/NewsCoverImage'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

type Props = {
    params: Promise<{ locale: string; slug: string }>
}

function resolveLocale(localeParam: string): AppLocale {
    return (routing.locales.includes(localeParam as AppLocale)
        ? localeParam
        : routing.defaultLocale) as AppLocale
}

function koUrl(slug: string): string {
    return `${SITE_URL}${getPathname({ locale: 'ko', href: `/news/${slug}` })}`
}

function coverAbsolute(post: NewsPost): string {
    return absoluteUrl(post.coverUrl || OG_IMAGE_WIDE_PATH)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale: localeParam, slug } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)
    const post = await getPublishedNewsBySlug(slug)
    if (!post) return { title: 'Not Found', robots: { index: false } }

    const t = await getTranslations({ locale, namespace: 'News' })
    const description = resolveNewsDescription(post)
    const canonical = koUrl(post.slug)
    const image = coverAbsolute(post)

    return {
        title: post.title,
        description,
        keywords: post.tags.length > 0 ? post.tags : undefined,
        /** 기사 본문은 한국어 전용 — 영문 경로는 한국어 페이지를 정본으로 지정 */
        alternates: {
            canonical,
            types: { 'application/rss+xml': `${SITE_URL}/rss.xml` },
        },
        robots: locale === 'en' ? { index: false, follow: true } : undefined,
        openGraph: {
            title: post.title,
            description,
            url: canonical,
            type: 'article',
            locale: 'ko_KR',
            publishedTime: utcSqlToIso(post.publishedAt) ?? undefined,
            modifiedTime: utcSqlToIso(post.updatedAt) ?? undefined,
            section: t(`categories.${post.category}`),
            tags: post.tags,
            images: [{ url: image, alt: post.coverAlt || post.title }],
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description,
            images: [image],
        },
    }
}

export default async function NewsDetailPage({ params }: Props) {
    const { locale: localeParam, slug } = await params
    const locale = resolveLocale(localeParam)
    setRequestLocale(locale)
    const post = await getPublishedNewsBySlug(slug)
    if (!post) notFound()

    const t = await getTranslations({ locale, namespace: 'News' })
    const more = await getLatestNews(3, post.id)
    const description = resolveNewsDescription(post)
    const canonical = koUrl(post.slug)
    const hubName = `${t('hubTitle')} ${t('hubTitleAccent')}`
    const publishedIso = utcSqlToIso(post.publishedAt)
    const modifiedIso = utcSqlToIso(post.updatedAt)
    const showUpdated =
        publishedIso && modifiedIso && formatNewsDateKo(post.updatedAt) !== formatNewsDateKo(post.publishedAt)
    const bodyHtml = post.bodyHtml
        ? sanitizeDetailHtml(isProbablyHtml(post.bodyHtml) ? post.bodyHtml : plainTextToHtml(post.bodyHtml))
        : ''

    const organization = {
        '@type': 'Organization',
        name: '(주)와우쓰리디',
        url: SITE_URL,
        logo: { '@type': 'ImageObject', url: absoluteUrl(BRAND_LOGO_PATH) },
    }
    const schemas: Record<string, unknown>[] = [
        {
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            headline: post.title,
            description,
            image: [coverAbsolute(post)],
            datePublished: publishedIso ?? undefined,
            dateModified: modifiedIso ?? publishedIso ?? undefined,
            author: organization,
            publisher: organization,
            mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
            url: canonical,
            articleSection: t(`categories.${post.category}`),
            keywords: post.tags.length > 0 ? post.tags.join(', ') : undefined,
            inLanguage: 'ko-KR',
            ...(post.summary.length > 0 ? { abstract: post.summary.join(' ') } : {}),
            ...(post.sourceUrl
                ? {
                      isBasedOn: {
                          '@type': 'CreativeWork',
                          url: post.sourceUrl,
                          ...(post.sourceName ? { name: post.sourceName } : {}),
                      },
                  }
                : {}),
        },
        buildBreadcrumbSchema([
            { name: t('breadcrumbHome'), path: locale === 'en' ? '/en' : '/' },
            { name: hubName, path: getPathname({ locale, href: '/news' }) },
            { name: post.title, path: getPathname({ locale, href: `/news/${post.slug}` }) },
        ]),
    ]
    if (post.faqs.length > 0) {
        schemas.push({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: post.faqs.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
            url: canonical,
        })
    }

    return (
        <main className="relative flex min-h-screen w-full max-w-[100vw] flex-col overflow-x-hidden bg-[#020617] text-slate-50">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />
            <Header />

            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e293b_0%,#020617_100%)]" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-[length:40px_40px] opacity-[0.05]" />
            </div>

            <article className="relative z-10 px-4 pb-16 pt-28 sm:px-6 sm:pt-32 md:pt-40">
                <div className="container mx-auto min-w-0 max-w-3xl">
                    <nav aria-label="breadcrumb" className="mb-6 flex flex-wrap items-center gap-1 text-xs font-bold text-white/40">
                        <Link href="/" className="hover:text-white">
                            {t('breadcrumbHome')}
                        </Link>
                        <ChevronRight className="h-3.5 w-3.5" />
                        <Link href="/news" className="hover:text-white">
                            {hubName}
                        </Link>
                        <ChevronRight className="h-3.5 w-3.5" />
                        <Link href={`/news?category=${post.category}`} className="text-teal-300 hover:text-teal-200">
                            {t(`categories.${post.category}`)}
                        </Link>
                    </nav>

                    <header className="space-y-4">
                        <h1 className="break-keep text-[1.6rem] font-black leading-tight tracking-tight text-white sm:text-4xl md:text-[2.6rem]">
                            {post.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-white/45 sm:text-sm">
                            <span>(주)와우쓰리디</span>
                            {publishedIso ? (
                                <span>
                                    {t('published')} <time dateTime={publishedIso}>{formatNewsDateKo(post.publishedAt)}</time>
                                </span>
                            ) : null}
                            {showUpdated ? (
                                <span>
                                    {t('updated')} <time dateTime={modifiedIso!}>{formatNewsDateKo(post.updatedAt)}</time>
                                </span>
                            ) : null}
                        </div>
                        {t('koreanOnlyNotice') ? (
                            <p className="text-xs font-bold text-amber-300/80">{t('koreanOnlyNotice')}</p>
                        ) : null}
                    </header>

                    {post.summary.length > 0 ? (
                        <section className="mt-8 rounded-2xl border border-teal-400/25 bg-teal-400/[0.06] p-5 sm:p-6" aria-labelledby="news-summary">
                            <h2 id="news-summary" className="mb-3 flex items-center gap-2 text-sm font-black text-teal-300">
                                <ListChecks className="h-4 w-4" />
                                {t('summaryTitle')}
                            </h2>
                            <ul className="space-y-2">
                                {post.summary.map((line, i) => (
                                    <li key={i} className="flex gap-2 break-keep text-[15px] font-bold leading-relaxed text-white/85">
                                        <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
                                        <span>{line}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ) : null}

                    {post.coverUrl ? (
                        <figure className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
                            <NewsCoverImage src={post.coverUrl} alt={post.coverAlt || post.title} loading="eager" />
                            {post.coverAlt ? (
                                <figcaption className="px-4 py-2 text-xs font-medium text-white/40">{post.coverAlt}</figcaption>
                            ) : null}
                        </figure>
                    ) : null}

                    {bodyHtml ? (
                        <div className={`mt-8 min-w-0 overflow-x-auto ${NEWS_BODY_CLASS}`} dangerouslySetInnerHTML={{ __html: bodyHtml }} />
                    ) : null}

                    {post.insight ? (
                        <section className="mt-10 rounded-2xl border border-amber-300/25 bg-amber-300/[0.06] p-5 sm:p-6" aria-labelledby="news-insight">
                            <h2 id="news-insight" className="mb-3 flex items-center gap-2 text-sm font-black text-amber-200">
                                <Lightbulb className="h-4 w-4" />
                                {t('insightTitle')}
                            </h2>
                            <p className="whitespace-pre-line break-keep text-[15px] font-medium leading-[1.85] text-white/80">{post.insight}</p>
                        </section>
                    ) : null}

                    {post.sourceUrl ? (
                        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5" aria-labelledby="news-source">
                            <h2 id="news-source" className="mb-2 text-sm font-black text-white">
                                {t('sourceTitle')}
                            </h2>
                            <a
                                href={post.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer nofollow"
                                className="inline-flex items-center gap-1.5 break-all text-sm font-bold text-teal-300 underline underline-offset-2 hover:text-teal-200"
                            >
                                {post.sourceName || post.sourceUrl}
                                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                            </a>
                            {post.sourcePublishedAt ? (
                                <p className="mt-1 text-xs font-bold text-white/40">
                                    {t('sourceDate')} {post.sourcePublishedAt.replace(/-/g, '.')}
                                </p>
                            ) : null}
                            <p className="mt-3 break-keep text-xs font-medium leading-relaxed text-white/40">{t('sourceNotice')}</p>
                        </section>
                    ) : null}

                    {post.relatedLinks.length > 0 ? (
                        <section className="mt-8" aria-labelledby="news-related">
                            <h2 id="news-related" className="mb-3 text-sm font-black text-white">
                                {t('relatedTitle')}
                            </h2>
                            <ul className="grid gap-2 sm:grid-cols-2">
                                {post.relatedLinks.map((l) => {
                                    const external = /^https?:\/\//i.test(l.href)
                                    const cls =
                                        'flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold text-white/80 transition-colors hover:border-teal-400/40 hover:text-white'
                                    return (
                                        <li key={l.href + l.title}>
                                            {external ? (
                                                <a href={l.href} target="_blank" rel="noopener noreferrer" className={cls}>
                                                    <span className="break-keep">{l.title}</span>
                                                    <ExternalLink className="h-4 w-4 shrink-0 text-teal-300" />
                                                </a>
                                            ) : (
                                                <Link href={l.href} className={cls}>
                                                    <span className="break-keep">{l.title}</span>
                                                    <ChevronRight className="h-4 w-4 shrink-0 text-teal-300" />
                                                </Link>
                                            )}
                                        </li>
                                    )
                                })}
                            </ul>
                        </section>
                    ) : null}

                    {post.faqs.length > 0 ? (
                        <section className="mt-10" aria-labelledby="news-faq">
                            <h2 id="news-faq" className="mb-3 text-lg font-black text-white">
                                {t('faqTitle')}
                            </h2>
                            <div className="space-y-2">
                                {post.faqs.map((f, i) => (
                                    <details
                                        key={i}
                                        className="group rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 open:border-teal-400/30"
                                        open={i === 0}
                                    >
                                        <summary className="cursor-pointer list-none break-keep text-sm font-black text-white [&::-webkit-details-marker]:hidden">
                                            Q. {f.q}
                                        </summary>
                                        <p className="mt-2 whitespace-pre-line break-keep text-sm font-medium leading-relaxed text-white/65">{f.a}</p>
                                    </details>
                                ))}
                            </div>
                        </section>
                    ) : null}

                    {post.tags.length > 0 ? (
                        <div className="mt-8 flex flex-wrap gap-2" aria-label={t('tagsTitle')}>
                            {post.tags.map((tag) => (
                                <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white/50">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    ) : null}

                    <div className="mt-12 flex min-w-0 flex-col gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 md:flex-row md:items-center md:gap-6">
                        <div className="min-w-0 flex-1 space-y-2">
                            <h2 className="break-keep text-lg font-black text-white md:text-xl">{t('ctaTitle')}</h2>
                            <p className="break-keep text-sm font-bold text-white/45">{t('ctaDesc')}</p>
                        </div>
                        <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row md:w-auto md:flex-col">
                            <Link href="/quote" className="block">
                                <Button className="h-11 w-full gap-2 rounded-xl bg-teal-400 px-5 font-black text-slate-950">
                                    <Zap className="h-4 w-4" />
                                    {t('ctaQuote')}
                                </Button>
                            </Link>
                            <Link href="/expert#inquiry" className="block">
                                <Button
                                    variant="outline"
                                    className="h-11 w-full gap-2 rounded-xl border-white/15 bg-white/5 px-5 font-black text-white"
                                >
                                    <MessageSquare className="h-4 w-4" />
                                    {t('ctaInquiry')}
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="mt-8">
                        <Link href="/news" className="inline-flex items-center gap-1.5 text-sm font-black text-white/60 hover:text-white">
                            <ArrowLeft className="h-4 w-4" />
                            {t('backToList')}
                        </Link>
                    </div>
                </div>
            </article>

            {more.length > 0 ? (
                <section className="relative z-10 px-4 pb-20 sm:px-6">
                    <div className="container mx-auto min-w-0 max-w-6xl">
                        <h2 className="mb-5 text-xl font-black text-white">{t('moreNewsTitle')}</h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {more.map((p) => (
                                <NewsCard
                                    key={p.id}
                                    post={p}
                                    categoryLabel={t(`categories.${p.category}`)}
                                    readMoreLabel={t('readMore')}
                                    compact
                                />
                            ))}
                        </div>
                    </div>
                </section>
            ) : null}

            <Footer />
        </main>
    )
}
