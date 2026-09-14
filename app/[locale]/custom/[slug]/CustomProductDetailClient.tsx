'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import {
    ArrowLeft,
    Camera,
    CheckCircle2,
    ChevronRight,
    MessageSquare,
    Share2,
    Sparkles,
    Zap,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CustomProductCta, CustomProductPublic } from '@/lib/custom-products'
import { getProductMainImage } from '@/lib/custom-products'

function ctaHref(cta: CustomProductCta, slug: string): string {
    if (cta === 'photo') return `/quote?entry=photo&from=custom&product=${slug}`
    if (cta === 'inquiry') return `/expert#inquiry`
    return `/quote?from=custom&product=${slug}`
}

function CtaButton({
    cta,
    slug,
    primary,
    className,
}: {
    cta: CustomProductCta
    slug: string
    primary?: boolean
    className?: string
}) {
    const t = useTranslations('CustomProducts')
    const href = ctaHref(cta, slug)
    const label =
        cta === 'photo' ? t('ctaPhoto') : cta === 'inquiry' ? t('ctaInquiry') : t('ctaQuote')
    const Icon = cta === 'photo' ? Camera : cta === 'inquiry' ? MessageSquare : Zap

    return (
        <Link href={href} className={cn('block', className)}>
            <Button
                className={cn(
                    'h-12 w-full rounded-xl font-black gap-2',
                    primary
                        ? 'bg-teal-400 text-slate-950 hover:bg-teal-300'
                        : 'border border-white/15 bg-white/5 text-white hover:bg-white/10'
                )}
                variant={primary ? 'default' : 'outline'}
            >
                <Icon className="w-4 h-4" />
                {label}
            </Button>
        </Link>
    )
}

export default function CustomProductDetailClient({
    product,
}: {
    product: CustomProductPublic
}) {
    const t = useTranslations('CustomProducts')
    const title = product.title
    const summary = product.summary
    const description = product.description
    const priceNote = product.priceNote
    const detailBody = product.detailBody

    const gallery = useMemo(
        () => (product.images.length > 0 ? product.images : [getProductMainImage(product)]),
        [product]
    )
    const [activeIndex, setActiveIndex] = useState(0)
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})

    const activeImage = gallery[Math.min(activeIndex, gallery.length - 1)]

    const shareProduct = async () => {
        try {
            const url = typeof window !== 'undefined' ? window.location.href : ''
            if (navigator.share) {
                await navigator.share({ title, text: summary, url })
                return
            }
            await navigator.clipboard.writeText(url)
        } catch {
            /* ignore */
        }
    }

    return (
        <main className="min-h-screen bg-[#0b0f17] text-slate-50 flex flex-col relative">
            <Header />

            <div className="relative z-10 container mx-auto max-w-6xl px-4 sm:px-6 pt-28 md:pt-36 pb-16 md:pb-24">
                <nav className="flex flex-wrap items-center gap-1.5 text-[12px] font-bold text-white/40 mb-5">
                    <Link href="/custom" className="hover:text-teal-300 transition-colors">
                        {t('backToHub')}
                    </Link>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className="text-white/70 truncate">{title}</span>
                </nav>

                <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-6 lg:gap-10 items-start mb-10 md:mb-14">
                    <div className="space-y-3">
                        <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-[#121826]">
                            <img
                                src={activeImage}
                                alt={title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    ;(e.target as HTMLImageElement).src = '/placeholder-3d.svg'
                                }}
                            />
                        </div>
                        {gallery.length > 1 ? (
                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                {gallery.map((src, idx) => (
                                    <button
                                        key={`${src}-${idx}`}
                                        type="button"
                                        onClick={() => setActiveIndex(idx)}
                                        className={cn(
                                            'relative aspect-square rounded-xl overflow-hidden border transition-all',
                                            idx === activeIndex
                                                ? 'border-teal-400 ring-2 ring-teal-400/40'
                                                : 'border-white/10 hover:border-white/30'
                                        )}
                                        aria-label={t('subImageLabel', { n: idx + 1 })}
                                    >
                                        <img
                                            src={src}
                                            alt=""
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                ;(e.target as HTMLImageElement).src =
                                                    '/placeholder-3d.svg'
                                            }}
                                        />
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#121826]/80 p-5 sm:p-6 md:p-7 space-y-5 lg:sticky lg:top-28">
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-2 min-w-0">
                                <div className="inline-flex items-center gap-1.5 rounded-md border border-teal-400/25 bg-teal-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-teal-200">
                                    <Sparkles className="w-3 h-3" />
                                    {product.method === 'mixed'
                                        ? t('methodMixed')
                                        : t(`method.${product.method}` as 'method.fdm')}
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight break-keep leading-snug">
                                    {title}
                                </h1>
                            </div>
                            <button
                                type="button"
                                onClick={shareProduct}
                                className="shrink-0 h-10 w-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white/50 hover:text-teal-300 hover:border-teal-400/30"
                                aria-label={t('share')}
                            >
                                <Share2 className="w-4 h-4" />
                            </button>
                        </div>

                        <p className="text-sm font-bold text-white/55 leading-relaxed break-keep">
                            {summary}
                        </p>

                        <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3">
                            <p className="text-[11px] font-black uppercase tracking-wider text-white/35 mb-1">
                                {t('priceLabel')}
                            </p>
                            <p className="text-xl font-black text-teal-300 break-keep">{priceNote}</p>
                            <p className="text-[12px] font-bold text-white/40 mt-1 break-keep">
                                {t('priceHint')}
                            </p>
                        </div>

                        {product.options.length > 0 ? (
                            <div className="space-y-4 border-t border-white/10 pt-4">
                                <p className="text-[11px] font-black uppercase tracking-wider text-white/35">
                                    {t('optionSelectTitle')}
                                </p>
                                {product.options.map((opt) => (
                                    <div key={opt.id} className="space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-sm font-black text-white/80">
                                                {opt.label}
                                            </span>
                                            {selectedOptions[opt.id] ? (
                                                <span className="text-[11px] font-bold text-teal-300/90 truncate">
                                                    {selectedOptions[opt.id]}
                                                </span>
                                            ) : (
                                                <span className="text-[11px] font-bold text-white/30">
                                                    {t('optionRequired')}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {opt.choices.map((choice) => {
                                                const active = selectedOptions[opt.id] === choice
                                                return (
                                                    <button
                                                        key={choice}
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedOptions((prev) => ({
                                                                ...prev,
                                                                [opt.id]: choice,
                                                            }))
                                                        }
                                                        className={cn(
                                                            'h-9 px-3 rounded-lg text-[12px] font-black border transition-colors',
                                                            active
                                                                ? 'bg-teal-400 text-slate-950 border-teal-400'
                                                                : 'bg-white/[0.04] text-white/70 border-white/10 hover:border-teal-400/40 hover:text-white'
                                                        )}
                                                    >
                                                        {choice}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : null}

                        {product.highlights.length > 0 ? (
                            <ul className="space-y-2">
                                {product.highlights.map((text) => (
                                    <li
                                        key={text}
                                        className="flex items-start gap-2 text-[13px] font-semibold text-white/75"
                                    >
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
                                        <span className="break-keep">{text}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : null}

                        <div className="grid sm:grid-cols-2 gap-2.5 pt-1">
                            <CtaButton cta={product.primaryCta} slug={product.slug} primary />
                            {product.secondaryCta ? (
                                <CtaButton cta={product.secondaryCta} slug={product.slug} />
                            ) : (
                                <Link href="/custom" className="block">
                                    <Button
                                        variant="outline"
                                        className="h-12 w-full rounded-xl border-white/15 bg-white/5 text-white font-black"
                                    >
                                        {t('browseMore')}
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                <section className="rounded-2xl border border-white/10 bg-[#121826]/60 overflow-hidden">
                    <div className="border-b border-white/10 px-5 sm:px-8 py-4 flex items-center gap-3">
                        <h2 className="text-lg sm:text-xl font-black text-white">
                            {t('detailSectionTitle')}
                        </h2>
                        <span className="text-[11px] font-bold text-white/35">
                            {t('detailSectionHint')}
                        </span>
                    </div>

                    <div className="px-5 sm:px-8 py-8 space-y-8 max-w-3xl mx-auto">
                        <div className="space-y-3 text-center">
                            <h3 className="text-2xl font-black text-white break-keep">{title}</h3>
                            <p className="text-sm font-bold text-white/50 leading-relaxed break-keep">
                                {description}
                            </p>
                        </div>

                        <div className="prose-invert space-y-4">
                            {detailBody
                                .split('\n')
                                .filter(Boolean)
                                .map((line, i) => (
                                    <p
                                        key={i}
                                        className="text-[14px] sm:text-[15px] font-medium text-white/65 leading-relaxed break-keep text-center"
                                    >
                                        {line}
                                    </p>
                                ))}
                        </div>

                        <div className="space-y-4">
                            {(product.detailImages.length > 0 ? product.detailImages : gallery).map(
                                (src, idx) => (
                                    <div
                                        key={`detail-${idx}`}
                                        className="rounded-xl overflow-hidden border border-white/10 bg-black/30"
                                    >
                                        <img
                                            src={src}
                                            alt={`${title} ${t('detailImageAlt', { n: idx + 1 })}`}
                                            className="w-full h-auto object-cover"
                                            onError={(e) => {
                                                ;(e.target as HTMLImageElement).src =
                                                    '/placeholder-3d.svg'
                                            }}
                                        />
                                    </div>
                                )
                            )}
                        </div>

                        <div className="rounded-xl border border-teal-400/25 bg-teal-400/[0.07] p-5 space-y-3 text-center">
                            <p className="text-sm font-black text-white">{t('nextTitle')}</p>
                            <p className="text-[13px] font-bold text-white/55 break-keep">
                                {t('nextDesc')}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-1">
                                <CtaButton
                                    cta={product.primaryCta}
                                    slug={product.slug}
                                    primary
                                    className="sm:w-auto"
                                />
                                <Link href="/custom" className="sm:w-auto">
                                    <Button
                                        variant="outline"
                                        className="h-12 w-full sm:w-auto px-6 rounded-xl border-white/15 bg-white/5 text-white font-black gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        {t('browseMore')}
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <Footer />
        </main>
    )
}
