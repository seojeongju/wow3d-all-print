'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import {
    ArrowLeft,
    Camera,
    CheckCircle2,
    MessageSquare,
    Sparkles,
    Zap,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import type { CustomProductCta, CustomProductDef } from '@/lib/custom-products'

function ctaHref(cta: CustomProductCta, slug: string): string {
    if (cta === 'photo') return `/quote?entry=photo&from=custom&product=${slug}`
    if (cta === 'inquiry') return `/expert#inquiry`
    return `/quote?from=custom&product=${slug}`
}

function CtaButton({
    cta,
    slug,
    primary,
}: {
    cta: CustomProductCta
    slug: string
    primary?: boolean
}) {
    const t = useTranslations('CustomProducts')
    const href = ctaHref(cta, slug)
    const label =
        cta === 'photo' ? t('ctaPhoto') : cta === 'inquiry' ? t('ctaInquiry') : t('ctaQuote')
    const Icon = cta === 'photo' ? Camera : cta === 'inquiry' ? MessageSquare : Zap

    if (primary) {
        return (
            <Link href={href}>
                <Button className="h-12 px-6 rounded-xl bg-teal-400 text-slate-950 font-black gap-2 w-full sm:w-auto">
                    <Icon className="w-4 h-4" />
                    {label}
                </Button>
            </Link>
        )
    }

    return (
        <Link href={href}>
            <Button
                variant="outline"
                className="h-12 px-6 rounded-xl border-white/15 bg-white/5 text-white font-black gap-2 w-full sm:w-auto"
            >
                <Icon className="w-4 h-4" />
                {label}
            </Button>
        </Link>
    )
}

export default function CustomProductDetailClient({ product }: { product: CustomProductDef }) {
    const t = useTranslations('CustomProducts')
    const title = t(`products.${product.slug}.title`)
    const summary = t(`products.${product.slug}.summary`)
    const description = t(`products.${product.slug}.description`)

    return (
        <main className="min-h-screen bg-[#020617] text-slate-50 flex flex-col relative overflow-hidden">
            <Header />

            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_0%,#1e293b_0%,#020617_100%)]" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-[length:40px_40px] opacity-[0.05]" />
            </div>

            <div className="relative z-10 container mx-auto max-w-6xl px-6 pt-32 md:pt-40 pb-16 md:pb-24">
                <Link
                    href="/custom"
                    className="inline-flex items-center gap-2 text-sm font-bold text-teal-400/85 hover:text-teal-300 mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {t('backToHub')}
                </Link>

                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start mb-12 md:mb-16">
                    <div className="relative aspect-[4/3] rounded-[1.75rem] overflow-hidden border border-white/10 bg-slate-900">
                        <img
                            src={product.image}
                            alt={title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                ;(e.target as HTMLImageElement).src = '/placeholder-3d.svg'
                            }}
                        />
                    </div>

                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/25 bg-teal-400/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-teal-200">
                            <Sparkles className="w-3.5 h-3.5" />
                            {t(`method.${product.method === 'mixed' ? 'fdm' : product.method}`)}
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight break-keep">
                            {title}
                        </h1>
                        <p className="text-base md:text-lg font-bold text-white/55 leading-relaxed break-keep">
                            {summary}
                        </p>
                        <p className="text-sm font-medium text-white/45 leading-relaxed break-keep">
                            {description}
                        </p>

                        <ul className="space-y-2.5 pt-1">
                            {product.highlightKeys.map((key) => (
                                <li
                                    key={key}
                                    className="flex items-start gap-3 text-sm font-semibold text-white/80"
                                >
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-400" />
                                    <span className="break-keep">
                                        {t(`products.${product.slug}.highlights.${key}`)}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <CtaButton cta={product.primaryCta} slug={product.slug} primary />
                            {product.secondaryCta ? (
                                <CtaButton cta={product.secondaryCta} slug={product.slug} />
                            ) : null}
                        </div>
                    </div>
                </div>

                <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6 md:p-8 mb-10">
                    <h2 className="text-xl md:text-2xl font-black text-white mb-2">{t('optionsTitle')}</h2>
                    <p className="text-sm font-bold text-white/45 mb-6 break-keep">{t('optionsDesc')}</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {product.optionIds.map((optId) => (
                            <div
                                key={optId}
                                className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-2"
                            >
                                <h3 className="text-sm font-black text-teal-300">
                                    {t(`options.${optId}.label`)}
                                </h3>
                                <p className="text-[13px] font-bold text-white/55 leading-relaxed break-keep">
                                    {t(`options.${optId}.values`)}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="rounded-[1.75rem] border border-teal-400/25 bg-teal-400/[0.07] p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-5">
                    <div className="flex-1 space-y-1">
                        <h2 className="text-xl font-black text-white">{t('nextTitle')}</h2>
                        <p className="text-sm text-white/60 break-keep">{t('nextDesc')}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                        <CtaButton cta={product.primaryCta} slug={product.slug} primary />
                        <Link href="/custom">
                            <Button
                                variant="outline"
                                className="h-12 px-6 rounded-xl border-white/15 bg-white/5 text-white font-black w-full sm:w-auto"
                            >
                                {t('browseMore')}
                            </Button>
                        </Link>
                    </div>
                </section>
            </div>

            <Footer />
        </main>
    )
}
