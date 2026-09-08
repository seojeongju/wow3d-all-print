'use client'

import { motion } from 'framer-motion'
import {
    BadgeCheck,
    Building2,
    CheckCircle2,
    ChevronRight,
    ExternalLink,
    Handshake,
    Printer,
    ShieldCheck,
    Sparkles,
    Store,
} from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

type Benefit = { title: string; desc: string }
type Step = { step: string; title: string; desc: string }

const PRODUCTS = [
    {
        id: 'p7-pro',
        msgKey: 'p7Pro' as const,
        series: '9K Series',
        seriesColor: 'text-violet-300',
        name: 'P7 Pro',
        buildSize: '153 × 77 × 160 mm',
        resolution: '9K · 28~50 μm',
        image: '/images/products/p7-pro.png',
        border: 'border-violet-400/25',
    },
    {
        id: 'p10-pro',
        msgKey: 'p10Pro' as const,
        series: '8K Series',
        seriesColor: 'text-teal-300',
        name: 'P10 Pro',
        buildSize: '228 × 128 × 250 mm',
        resolution: '8K · 14.85 μm',
        image: '/images/products/p10-pro.png',
        border: 'border-teal-400/35',
        highlight: true,
    },
    {
        id: 'p13-pro',
        msgKey: 'p13Pro' as const,
        series: '16K Series',
        seriesColor: 'text-amber-300',
        name: 'P13 Pro',
        buildSize: '302 × 162 × 380 mm',
        resolution: '16K · Ultra-HR',
        image: '/images/products/p13-pro.png',
        border: 'border-amber-400/25',
    },
]

const BENEFIT_ICONS = [Store, BadgeCheck, ShieldCheck] as const

export default function SmartStoreSupportPage() {
    const t = useTranslations('PartnershipSmartStore')
    const benefits = t.raw('benefits') as Benefit[]
    const steps = t.raw('steps') as Step[]

    return (
        <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#020617] font-sans text-slate-50 selection:bg-teal-500/30">
            <Header />

            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#1e293b_0%,#020617_70%)]" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-[length:40px_40px] opacity-[0.05] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
                <div className="absolute left-[-10%] top-[-15%] h-[50%] w-[50%] rounded-full bg-teal-400/5 blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] h-[50%] w-[55%] rounded-full bg-sky-500/5 blur-[140px]" />
            </div>

            <div className="relative z-10 w-full">
                {/* Hero */}
                <section className="pb-16 pt-36 md:pb-24 md:pt-44">
                    <div className="container mx-auto px-6">
                        <div className="mx-auto max-w-4xl space-y-8 text-center">
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-2 rounded-full border border-teal-400/25 bg-teal-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-teal-300"
                            >
                                <Store className="h-3.5 w-3.5" />
                                {t('eyebrow')}
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 }}
                                className="text-4xl font-black leading-[1.15] tracking-tight text-white md:text-6xl break-keep"
                            >
                                {t('heroTitle')}
                                <span className="mt-3 block text-teal-300">{t('heroTitleAccent')}</span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="mx-auto max-w-2xl text-base font-medium leading-relaxed text-white/45 md:text-lg break-keep"
                            >
                                {t('heroSubtitle')}
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="flex flex-wrap items-center justify-center gap-3 pt-2"
                            >
                                <Link href={{ pathname: '/contact', query: { category: 'partnership' } }}>
                                    <Button
                                        size="lg"
                                        className="h-14 gap-2 rounded-2xl bg-teal-400 px-8 font-black tracking-wide text-slate-950 shadow-[0_0_30px_rgba(45,212,191,0.28)] hover:bg-teal-300"
                                    >
                                        {t('ctaConsult')}
                                        <ChevronRight className="h-5 w-5" />
                                    </Button>
                                </Link>
                                <a
                                    href="https://www.sbiz.or.kr/smst/index.do"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button
                                        variant="ghost"
                                        size="lg"
                                        className="h-14 gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 font-bold text-white/60 hover:bg-white/10 hover:text-white"
                                    >
                                        {t('ctaOfficial')}
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                </a>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Supplier badge */}
                <section className="pb-16">
                    <div className="container mx-auto px-6">
                        <div className="mx-auto flex max-w-4xl flex-col items-start gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:flex-row md:items-center md:gap-10 md:p-10">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-teal-400/15 text-teal-300">
                                <Building2 className="h-8 w-8" />
                            </div>
                            <div className="min-w-0 space-y-3">
                                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-400/80">
                                    {t('supplierEyebrow')}
                                </p>
                                <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl">
                                    {t('supplierTitle')}
                                </h2>
                                <p className="text-sm font-medium leading-relaxed text-white/45 break-keep md:text-[15px]">
                                    {t('supplierDesc')}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* About program */}
                <section className="pb-20">
                    <div className="container mx-auto px-6">
                        <div className="mx-auto mb-12 max-w-3xl text-center">
                            <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                                {t('aboutTitle')}
                            </h2>
                            <p className="mt-4 text-sm font-medium leading-relaxed text-white/45 break-keep md:text-base">
                                {t('aboutDesc')}
                            </p>
                        </div>

                        <div className="grid gap-5 md:grid-cols-3">
                            {benefits.map((b, idx) => {
                                const Icon = BENEFIT_ICONS[idx] ?? Store
                                return (
                                    <div
                                        key={b.title}
                                        className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 transition-colors hover:border-teal-400/25 hover:bg-teal-400/[0.04]"
                                    >
                                        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-400/10 text-teal-300">
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-lg font-black text-white">{b.title}</h3>
                                        <p className="mt-3 text-sm font-medium leading-relaxed text-white/40 break-keep">
                                            {b.desc}
                                        </p>
                                    </div>
                                )
                            })}
                        </div>

                        <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-relaxed text-white/30 break-keep">
                            {t('disclaimerBefore')}
                            <a
                                href="https://www.sbiz.or.kr/smst/index.do"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-teal-400/80 underline-offset-2 hover:underline"
                            >
                                {t('disclaimerLink')}
                            </a>
                            {t('disclaimerAfter')}
                        </p>
                    </div>
                </section>

                {/* Products */}
                <section className="pb-24">
                    <div className="container mx-auto px-6">
                        <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-teal-400/80">
                                    {t('productsEyebrow')}
                                </p>
                                <h2 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">
                                    {t('productsTitle')}
                                </h2>
                                <p className="mt-3 max-w-xl text-sm font-medium text-white/40 break-keep">
                                    {t('productsSubtitle')}
                                </p>
                            </div>
                            <Link
                                href="/hardware/3d-printer"
                                className="inline-flex items-center gap-1.5 text-sm font-bold text-teal-300 hover:text-teal-200"
                            >
                                {t('allSpecs')}
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-3">
                            {PRODUCTS.map((p) => (
                                <article
                                    key={p.id}
                                    className={`flex flex-col overflow-hidden rounded-3xl border bg-white/[0.03] ${p.border} ${
                                        p.highlight ? 'ring-1 ring-teal-400/30' : ''
                                    }`}
                                >
                                    <div className="relative aspect-[4/3] bg-black/40">
                                        <Image
                                            src={p.image}
                                            alt={t('productAlt', { name: p.name })}
                                            fill
                                            className="object-contain p-6"
                                            sizes="(max-width: 1024px) 100vw, 33vw"
                                        />
                                        {p.highlight && (
                                            <span className="absolute left-4 top-4 rounded-full bg-teal-400 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-950">
                                                {t('bestSeller')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-1 flex-col gap-3 p-6">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={`text-[11px] font-black uppercase tracking-widest ${p.seriesColor}`}>
                                                {p.series}
                                            </span>
                                            <Printer className="h-4 w-4 text-white/25" />
                                        </div>
                                        <h3 className="text-2xl font-black text-white">{p.name}</h3>
                                        <p className="text-sm font-bold text-white/55">
                                            {t(`products.${p.msgKey}.tagline`)}
                                        </p>
                                        <p className="text-sm leading-relaxed text-white/40 break-keep">
                                            {t(`products.${p.msgKey}.desc`)}
                                        </p>
                                        <ul className="mt-auto space-y-2 border-t border-white/5 pt-4 text-[13px] font-medium text-white/50">
                                            <li className="flex items-center gap-2">
                                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal-400/80" />
                                                {t('buildLabel')}: {p.buildSize}
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal-400/80" />
                                                {t('resolutionLabel')}: {p.resolution}
                                            </li>
                                        </ul>
                                        <Link href={`/hardware/3d-printer#${p.id}`} className="pt-2">
                                            <Button
                                                variant="ghost"
                                                className="w-full rounded-xl border border-white/10 bg-white/5 font-bold text-white/70 hover:bg-white/10 hover:text-white"
                                            >
                                                {t('detailSpec')}
                                            </Button>
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Steps */}
                <section className="pb-24">
                    <div className="container mx-auto px-6">
                        <div className="mx-auto mb-12 max-w-2xl text-center">
                            <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                                {t('stepsTitle')}
                            </h2>
                            <p className="mt-3 text-sm text-white/40 break-keep">
                                {t('stepsSubtitle')}
                            </p>
                        </div>
                        <div className="mx-auto max-w-3xl space-y-8">
                            {steps.map((s, i) => (
                                <div key={s.step} className="relative flex gap-6 md:gap-8">
                                    {i < steps.length - 1 && (
                                        <div className="absolute left-[27px] top-14 bottom-[-32px] w-px bg-white/10 md:left-[31px]" />
                                    )}
                                    <div className="z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-teal-400/25 bg-teal-400/10 text-sm font-black text-teal-300 md:h-16 md:w-16 md:text-base">
                                        {s.step}
                                    </div>
                                    <div className="space-y-1.5 pt-2">
                                        <h3 className="text-xl font-black text-white">{s.title}</h3>
                                        <p className="text-sm font-medium leading-relaxed text-white/40 break-keep">
                                            {s.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="pb-32">
                    <div className="container mx-auto px-6">
                        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-teal-400/10 via-transparent to-sky-500/5 p-10 text-center md:p-16">
                            <Sparkles className="mx-auto mb-6 h-8 w-8 text-teal-300" />
                            <h2 className="text-3xl font-black tracking-tight text-white md:text-5xl break-keep">
                                {t('ctaTitleBefore')}
                                <br />
                                <span className="text-teal-300">{t('ctaTitleAccent')}</span>
                                {t('ctaTitleAfter')}
                            </h2>
                            <p className="mx-auto mt-5 max-w-xl text-sm font-medium text-white/40 break-keep md:text-base">
                                {t('ctaSubtitle')}
                            </p>
                            <div className="mt-10 flex flex-wrap justify-center gap-3">
                                <Link href={{ pathname: '/contact', query: { category: 'partnership' } }}>
                                    <Button
                                        size="lg"
                                        className="h-14 gap-2 rounded-2xl bg-teal-400 px-10 font-black text-slate-950 hover:bg-teal-300"
                                    >
                                        <Handshake className="h-5 w-5" />
                                        {t('ctaApply')}
                                    </Button>
                                </Link>
                                <Link href="/partnership">
                                    <Button
                                        variant="ghost"
                                        size="lg"
                                        className="h-14 rounded-2xl border border-white/10 bg-white/5 px-10 font-bold text-white/60 hover:bg-white/10 hover:text-white"
                                    >
                                        {t('ctaPartnership')}
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
