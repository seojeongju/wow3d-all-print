'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { motion } from 'framer-motion'
import {
    ArrowLeft,
    ArrowRight,
    Boxes,
    CheckCircle2,
    Layers,
    MessageSquare,
    Sparkles,
} from 'lucide-react'
import type { ShowcaseSlug } from '@/lib/showcase'
import type { ShowcaseDetail, ShowcaseExample } from '@/lib/showcase-public'
import {
    getShowcaseModeledExamples,
    getShowcaseProcessSteps,
} from '@/lib/showcase-detail-model'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { cn } from '@/lib/utils'

function WireframeBackdrop({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]',
                className,
            )}
            aria-hidden
        >
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(45,212,191,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(45,212,191,0.07)_1px,transparent_1px)] bg-[size:28px_28px]" />
            <div className="absolute -right-8 top-1/2 h-40 w-40 -translate-y-1/2 rotate-12 rounded-3xl border border-teal-400/25 bg-teal-400/5" />
            <div className="absolute -left-6 bottom-6 h-24 w-24 -rotate-6 rounded-2xl border border-white/15 bg-white/[0.03]" />
            <Boxes className="absolute right-8 top-8 h-10 w-10 text-teal-400/25" />
        </div>
    )
}

export default function ShowcaseDetailClient({
    slug,
    initialData,
}: {
    slug: ShowcaseSlug
    initialData: ShowcaseDetail
}) {
    const t = useTranslations('Expert')
    const locale = useLocale()
    const data = initialData
    const processSteps = getShowcaseProcessSteps(locale)
    const modeled = getShowcaseModeledExamples(slug, locale)
    const hasDbExamples = data.examples.length > 0

    return (
        <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#020617] font-sans text-slate-50 selection:bg-teal-500/30">
            <Header />

            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e293b_0%,#020617_72%)]" />
                <div className="absolute right-[8%] top-[18%] h-[42%] w-[42%] rounded-full bg-teal-500/10 blur-[130px]" />
                <div className="absolute bottom-[10%] left-[5%] h-[35%] w-[35%] rounded-full bg-cyan-500/5 blur-[120px]" />
            </div>

            <div className="relative z-10 flex-1">
                <div className="container mx-auto max-w-6xl px-6 pb-20 pt-28">
                    <Link
                        href="/expert"
                        className="mb-10 inline-flex items-center gap-2 text-sm font-bold text-teal-400/85 transition-colors hover:text-teal-300"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t('backToExpert')}
                    </Link>

                    {/* Hero */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-20 grid items-center gap-10 lg:mb-24 lg:grid-cols-2 lg:gap-14"
                    >
                        <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:rounded-[2.5rem]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={data.heroImageUrl}
                                alt={t('heroImageAlt', { title: data.title })}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                    ;(e.target as HTMLImageElement).src = '/placeholder-3d.svg'
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/85 via-transparent to-transparent" />
                            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
                                {data.features.slice(0, 3).map((f) => (
                                    <span
                                        key={f}
                                        className="rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[11px] font-bold text-white/90 backdrop-blur-md"
                                    >
                                        {f}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <p className="inline-flex items-center gap-2 rounded-full border border-teal-400/25 bg-teal-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-200">
                                <Sparkles className="h-3.5 w-3.5" />
                                {t('detailBadge')}
                            </p>
                            <h1 className="text-4xl font-black leading-tight tracking-tight text-white break-keep md:text-5xl">
                                {data.title}
                            </h1>
                            <p className="text-base font-medium leading-relaxed text-white/65 break-keep md:text-lg">
                                {data.description}
                            </p>
                            {data.features.length > 0 && (
                                <ul className="space-y-2.5 pt-1">
                                    {data.features.map((f, i) => (
                                        <li
                                            key={i}
                                            className="flex items-start gap-3 text-sm font-semibold text-white/80"
                                        >
                                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-400" />
                                            <span className="break-keep">{f}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                                <Link
                                    href="/expert#inquiry"
                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-teal-400 px-5 text-sm font-black text-slate-950 transition hover:bg-teal-300"
                                >
                                    <MessageSquare className="h-4 w-4" />
                                    {t('detailCtaInquiry')}
                                </Link>
                                <Link
                                    href="/quote"
                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 text-sm font-bold text-white/85 transition hover:border-teal-400/35 hover:text-teal-200"
                                >
                                    {t('detailCtaQuote')}
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </motion.div>

                    {/* Process modeling — 4 steps */}
                    <section className="mb-20 lg:mb-24">
                        <div className="mb-8 flex items-end justify-between gap-4">
                            <div>
                                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-teal-400/80">
                                    {t('processEyebrow')}
                                </p>
                                <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl">
                                    {t('processTitle')}
                                </h2>
                                <p className="mt-2 max-w-xl text-sm font-medium text-white/50 break-keep">
                                    {t('processSubtitle')}
                                </p>
                            </div>
                            <Layers className="hidden h-8 w-8 text-teal-400/30 sm:block" aria-hidden />
                        </div>

                        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {processSteps.map((step, idx) => (
                                <motion.li
                                    key={step.n}
                                    initial={{ opacity: 0, y: 14 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.06 }}
                                    className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                                >
                                    <WireframeBackdrop />
                                    <div className="relative">
                                        <p className="text-[11px] font-black tabular-nums text-teal-300/90">
                                            {step.n}
                                        </p>
                                        <p className="mt-2 text-base font-black text-white">{step.title}</p>
                                        <p className="mt-2 text-xs leading-relaxed text-white/55 break-keep">
                                            {step.desc}
                                        </p>
                                    </div>
                                </motion.li>
                            ))}
                        </ol>
                    </section>

                    {/* Examples */}
                    <section className="border-t border-white/10 pt-16">
                        <h2 className="mb-3 text-2xl font-black tracking-tight text-white md:text-3xl">
                            {t('examplesTitle')}
                        </h2>
                        <p className="mb-12 max-w-2xl text-sm font-medium text-white/50 break-keep">
                            {hasDbExamples ? t('examplesSubtitle') : t('examplesModeledSubtitle')}
                        </p>

                        {hasDbExamples ? (
                            <div className="space-y-10">
                                {data.examples.map((ex, idx) => (
                                    <DbExampleCard key={ex.id} ex={ex} index={idx} />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {modeled.map((ex, idx) => (
                                    <motion.article
                                        key={`${ex.stage}-${ex.title}`}
                                        initial={{ opacity: 0, y: 18 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={cn(
                                            'overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.03]',
                                            'grid gap-0 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)]',
                                        )}
                                    >
                                        <div className="relative min-h-[180px] overflow-hidden border-b border-white/10 lg:min-h-full lg:border-b-0 lg:border-r">
                                            <WireframeBackdrop />
                                            <div className="relative flex h-full flex-col justify-between p-6 sm:p-8">
                                                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-teal-300/90">
                                                    {ex.stage}
                                                </span>
                                                <div className="mt-10 flex items-center gap-3 text-white/25">
                                                    <Boxes className="h-14 w-14" strokeWidth={1.1} />
                                                    <div className="h-px flex-1 bg-gradient-to-r from-teal-400/40 to-transparent" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-6 sm:p-8 lg:p-10">
                                            <h3 className="text-xl font-black text-white md:text-2xl break-keep">
                                                {ex.title}
                                            </h3>
                                            <p className="mt-3 text-sm leading-relaxed text-white/60 break-keep md:text-[15px]">
                                                {ex.description}
                                            </p>
                                            <ul className="mt-5 flex flex-wrap gap-2">
                                                {ex.features.map((f) => (
                                                    <li
                                                        key={f}
                                                        className="rounded-lg border border-teal-500/25 bg-teal-500/10 px-2.5 py-1 text-[11px] font-bold text-teal-200"
                                                    >
                                                        {f}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </motion.article>
                                ))}
                            </div>
                        )}

                        <div className="mt-14 flex flex-col items-start justify-between gap-4 rounded-2xl border border-teal-400/25 bg-teal-400/[0.07] p-6 sm:flex-row sm:items-center sm:p-8">
                            <div>
                                <p className="text-lg font-black text-white break-keep">
                                    {t('detailBottomTitle')}
                                </p>
                                <p className="mt-1 text-sm text-white/60 break-keep">
                                    {t('detailBottomDesc')}
                                </p>
                            </div>
                            <Link
                                href="/expert#inquiry"
                                className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-teal-400 px-5 text-sm font-black text-slate-950 transition hover:bg-teal-300"
                            >
                                {t('detailCtaInquiry')}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </section>
                </div>
            </div>

            <Footer />
        </main>
    )
}

function DbExampleCard({ ex, index }: { ex: ShowcaseExample; index: number }) {
    const media = ex.media
    const primary = media[0]
    const rest = media.slice(1)

    return (
        <motion.article
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: Math.min(index * 0.04, 0.2) }}
            className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.03]"
        >
            <div className="grid gap-0 lg:grid-cols-2">
                <div
                    className={cn(
                        'relative min-h-[220px] overflow-hidden bg-[#0b1220]',
                        index % 2 === 1 && 'lg:order-2',
                    )}
                >
                    {primary ? (
                        primary.kind === 'video' ? (
                            <video
                                src={primary.url}
                                controls
                                className="h-full w-full object-cover"
                                preload="metadata"
                            />
                        ) : (
                            <a href={primary.url} target="_blank" rel="noopener noreferrer" className="block h-full">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={primary.url}
                                    alt={ex.title}
                                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                                />
                            </a>
                        )
                    ) : (
                        <WireframeBackdrop className="opacity-100" />
                    )}
                </div>

                <div className={cn('flex flex-col justify-center p-6 sm:p-8 lg:p-10', index % 2 === 1 && 'lg:order-1')}>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-teal-300/80">
                        Case {String(index + 1).padStart(2, '0')}
                    </p>
                    <h3 className="mt-2 text-xl font-black text-white md:text-2xl break-keep">
                        {ex.title}
                    </h3>
                    {ex.description && (
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/60 break-keep md:text-[15px]">
                            {ex.description}
                        </p>
                    )}
                    {ex.features.length > 0 && (
                        <ul className="mt-5 flex flex-wrap gap-2">
                            {ex.features.map((f, i) => (
                                <li
                                    key={i}
                                    className="rounded-lg border border-teal-500/25 bg-teal-500/10 px-2.5 py-1 text-[11px] font-bold text-teal-200"
                                >
                                    {f}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {rest.length > 0 && (
                <div className="grid gap-3 border-t border-white/10 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
                    {rest.map((m) =>
                        m.kind === 'video' ? (
                            <video
                                key={m.id}
                                src={m.url}
                                controls
                                className="max-h-[240px] w-full rounded-xl border border-white/10 bg-black"
                                preload="metadata"
                            />
                        ) : (
                            <a
                                key={m.id}
                                href={m.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block overflow-hidden rounded-xl border border-white/10"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={m.url}
                                    alt={ex.title}
                                    className="max-h-[240px] w-full object-cover transition-transform hover:scale-[1.02]"
                                />
                            </a>
                        ),
                    )}
                </div>
            )}
        </motion.article>
    )
}
