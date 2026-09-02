'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    ArrowRight,
    Check,
    ChevronRight,
    Droplets,
    Layers,
    Printer,
    X,
    Zap,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import {
    PRINT_METHOD_COMPARE_ROWS,
    PRINT_METHOD_FAQS,
    PRINT_METHOD_FEATURED,
    PRINT_METHOD_JOURNEY,
    PRINT_METHOD_STATS,
    PRINT_METHODS,
    type PrintMethod,
} from '@/lib/print-methods-data'

function FloatingIcon({
    children,
    className,
    delay = 0,
}: {
    children: ReactNode
    className?: string
    delay?: number
}) {
    return (
        <motion.div
            className={className}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
        >
            {children}
        </motion.div>
    )
}

function MethodQuickCard({ method, index }: { method: PrintMethod; index: number }) {
    const Icon = method.icon
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
        >
            <Link
                href={`#method-${method.id}`}
                className={`group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-br ${method.gradient} p-6 transition-all hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_20px_60px_-20px_rgba(20,184,166,0.2)]`}
            >
                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border ${method.iconBg} ${method.accent}`}>
                    <Icon className="h-7 w-7 transition-transform group-hover:scale-110" />
                </div>
                <h3 className="text-2xl font-black text-white">{method.name}</h3>
                <p className="mt-1 text-xs font-bold text-white/45">{method.nameKo}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-white/60 break-keep line-clamp-2">
                    {method.principle}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-teal-400/80 group-hover:gap-2">
                    상세 보기 <ChevronRight className="h-3.5 w-3.5" />
                </span>
            </Link>
        </motion.div>
    )
}

function MethodDetailCard({ method, index }: { method: PrintMethod; index: number }) {
    const Icon = method.icon
    return (
        <motion.article
            id={`method-${method.id}`}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br ${method.gradient}`}
        >
            <div className="absolute -right-8 -top-8 opacity-[0.07]">
                <Icon className="h-48 w-48" />
            </div>
            <div className="relative p-8 md:p-10">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${method.iconBg} ${method.accent}`}>
                            <Icon className="h-8 w-8" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white">{method.name}</h2>
                            <p className="text-sm text-white/50">
                                {method.fullName} · {method.nameKo}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={method.serviceHref}
                            className="rounded-full border border-white/15 bg-black/20 px-4 py-2 text-xs font-bold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                        >
                            서비스 보기
                        </Link>
                        <Link
                            href={method.guideHref}
                            className="rounded-full border border-teal-400/25 bg-teal-400/10 px-4 py-2 text-xs font-bold text-teal-300 transition-colors hover:bg-teal-400/20"
                        >
                            비교 가이드
                        </Link>
                    </div>
                </div>

                <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {method.specs.map((spec) => {
                        const SpecIcon = spec.icon
                        return (
                            <div
                                key={spec.label}
                                className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-sm"
                            >
                                <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40">
                                    <SpecIcon className="h-3.5 w-3.5" />
                                    {spec.label}
                                </div>
                                <p className="text-lg font-black text-white">{spec.value}</p>
                            </div>
                        )
                    })}
                </div>

                <div className="mb-8 rounded-2xl border border-white/10 bg-black/20 p-5 md:p-6">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-white/40">원리</p>
                    <p className="leading-relaxed text-white/80 break-keep">{method.principle}</p>
                </div>

                <div className="mb-8 grid gap-6 md:grid-cols-2">
                    <div>
                        <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-white/40">주요 소재</p>
                        <div className="flex flex-wrap gap-2">
                            {method.materials.map((mat) => (
                                <span
                                    key={mat}
                                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-bold text-white/70"
                                >
                                    {mat}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-white/40">적합 용도</p>
                        <ul className="space-y-2">
                            {method.uses.map((u) => (
                                <li key={u} className="flex items-center gap-2 text-sm text-white/75">
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400/80" />
                                    {u}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-5">
                        <p className="mb-3 flex items-center gap-2 text-sm font-black text-emerald-300">
                            <Check className="h-4 w-4" /> 장점
                        </p>
                        <ul className="space-y-2">
                            {method.strengths.map((s) => (
                                <li key={s} className="flex items-start gap-2 text-sm text-white/75 break-keep">
                                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="rounded-2xl border border-amber-400/15 bg-amber-400/5 p-5">
                        <p className="mb-3 flex items-center gap-2 text-sm font-black text-amber-300">
                            <X className="h-4 w-4" /> 참고
                        </p>
                        <ul className="space-y-2">
                            {method.weaknesses.map((w) => (
                                <li key={w} className="flex items-start gap-2 text-sm text-white/75 break-keep">
                                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/80" />
                                    {w}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </motion.article>
    )
}

export default function PrintMethodsClient() {
    return (
        <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white selection:bg-teal-500/30">
            <Header />

            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e293b_0%,#020617_55%)]" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-[length:40px_40px] opacity-[0.04] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
                <div className="absolute left-[-10%] top-[8%] h-[45%] w-[45%] animate-pulse rounded-full bg-amber-500/6 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-8%] h-[40%] w-[40%] animate-pulse rounded-full bg-cyan-500/6 blur-[130px]" />
            </div>

            {/* Hero */}
            <section className="relative z-10 border-b border-white/10 pt-32 pb-16 md:pb-20">
                <div className="container mx-auto max-w-6xl px-6">
                    <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-teal-300">
                                <Layers className="h-3.5 w-3.5" />
                                Print Methods
                            </div>
                            <h1 className="text-4xl font-black leading-[1.1] tracking-tight md:text-6xl">
                                3D 프린터
                                <br />
                                <span className="bg-gradient-to-r from-amber-300 via-teal-300 to-violet-300 bg-clip-text text-transparent">
                                    출력방식 비교
                                </span>
                            </h1>
                            <p className="max-w-xl text-lg leading-relaxed text-white/65 break-keep">
                                FDM·SLA·DLP의 원리, 소재, 장단점, 추천 용도를 한눈에 비교하고
                                프로젝트에 맞는 공정을 빠르게 선택하세요.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <Link href="/quote">
                                    <Button className="h-12 rounded-2xl bg-teal-400 px-6 font-black text-slate-950 hover:bg-teal-300">
                                        자동견적 시작 <ArrowRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </Link>
                                <Link href="/guides/fdm-vs-sla-vs-dlp">
                                    <Button
                                        variant="outline"
                                        className="h-12 rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                                    >
                                        공정 비교 가이드
                                    </Button>
                                </Link>
                            </div>
                            <div className="flex flex-wrap gap-6 pt-2">
                                {PRINT_METHOD_STATS.map((stat, i) => (
                                    <motion.div
                                        key={stat.label}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 + i * 0.08 }}
                                    >
                                        <p className="text-2xl font-black text-white">{stat.value}</p>
                                        <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">
                                            {stat.label}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.15 }}
                            className="relative mx-auto hidden aspect-square w-full max-w-md lg:block"
                        >
                            <div className="absolute inset-0 rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-sm" />
                            <FloatingIcon
                                className="absolute left-[10%] top-[20%] flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/15 text-amber-300 shadow-lg"
                                delay={0}
                            >
                                <Printer className="h-8 w-8" />
                            </FloatingIcon>
                            <FloatingIcon
                                className="absolute right-[8%] top-[30%] flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/15 text-cyan-300 shadow-lg"
                                delay={0.6}
                            >
                                <Droplets className="h-7 w-7" />
                            </FloatingIcon>
                            <FloatingIcon
                                className="absolute bottom-[24%] left-[20%] flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-400/30 bg-violet-400/15 text-violet-300 shadow-lg"
                                delay={1.1}
                            >
                                <Zap className="h-7 w-7" />
                            </FloatingIcon>
                            <motion.div
                                className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-3xl border border-white/20 bg-gradient-to-br from-teal-500/20 to-indigo-600/20 shadow-2xl"
                                animate={{ rotate: [0, 2, -2, 0] }}
                                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <Layers className="h-12 w-12 text-teal-300" />
                            </motion.div>
                            <motion.div
                                className="absolute inset-x-8 bottom-8 rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-md"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <p className="text-[10px] font-black uppercase tracking-widest text-teal-400/80">
                                    Quick tip
                                </p>
                                <p className="mt-1 text-sm font-bold text-white">기능 시제품 → FDM</p>
                                <p className="mt-0.5 text-xs text-white/50">외관·정밀 모형 → SLA / DLP</p>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Journey */}
            <section className="relative z-10 py-14">
                <div className="container mx-auto max-w-6xl px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-8 text-center"
                    >
                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/35">How to choose</p>
                        <h2 className="mt-2 text-2xl font-black md:text-3xl">출력 방식 선택 3단계</h2>
                    </motion.div>
                    <div className="grid gap-4 md:grid-cols-3">
                        {PRINT_METHOD_JOURNEY.map((step, i) => {
                            const Icon = step.icon
                            return (
                                <motion.div
                                    key={step.step}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm"
                                >
                                    <div className="mb-4 flex items-center gap-3">
                                        <span className="text-xs font-black text-teal-400">{step.step}</span>
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-teal-300">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <h3 className="mb-1 text-lg font-black">{step.title}</h3>
                                    <p className="text-sm text-white/55 break-keep">{step.desc}</p>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Quick cards */}
            <section className="relative z-10 pb-8">
                <div className="container mx-auto max-w-6xl px-6">
                    <div className="grid gap-5 md:grid-cols-3">
                        {PRINT_METHODS.map((m, i) => (
                            <MethodQuickCard key={m.id} method={m} index={i} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Compare table */}
            <section className="relative z-10 py-10">
                <div className="container mx-auto max-w-6xl px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03]"
                    >
                        <div className="border-b border-white/10 bg-gradient-to-r from-teal-500/10 to-indigo-500/10 px-6 py-5 md:px-8">
                            <h2 className="text-xl font-black md:text-2xl">한눈에 보는 공정 비교</h2>
                            <p className="mt-1 text-sm text-white/50">프로젝트 목적에 따라 빠르게 비교하세요</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[640px] text-left text-sm">
                                <thead>
                                    <tr className="border-b border-white/10 text-[11px] font-black uppercase tracking-widest text-white/40">
                                        <th className="px-6 py-4 md:px-8">항목</th>
                                        <th className="px-4 py-4 text-amber-300">FDM</th>
                                        <th className="px-4 py-4 text-cyan-300">SLA</th>
                                        <th className="px-4 py-4 text-violet-300">DLP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {PRINT_METHOD_COMPARE_ROWS.map((row, i) => (
                                        <tr
                                            key={row.label}
                                            className={i < PRINT_METHOD_COMPARE_ROWS.length - 1 ? 'border-b border-white/5' : ''}
                                        >
                                            <td className="px-6 py-4 font-bold text-white/70 md:px-8">{row.label}</td>
                                            <td className="px-4 py-4 text-white/60">{row.fdm}</td>
                                            <td className="px-4 py-4 text-white/60">{row.sla}</td>
                                            <td className="px-4 py-4 text-white/60">{row.dlp}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Method details */}
            <section className="relative z-10 py-12 md:py-16">
                <div className="container mx-auto max-w-6xl space-y-10 px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center"
                    >
                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/35">Deep dive</p>
                        <h2 className="mt-2 text-2xl font-black md:text-3xl">공정별 상세 안내</h2>
                    </motion.div>
                    {PRINT_METHODS.map((m, i) => (
                        <MethodDetailCard key={m.id} method={m} index={i} />
                    ))}
                </div>
            </section>

            {/* FAQ */}
            <section className="relative z-10 pb-12">
                <div className="container mx-auto max-w-6xl px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-8 md:p-10"
                    >
                        <div className="mb-8 max-w-2xl">
                            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-300">
                                Common Questions
                            </p>
                            <h2 className="mt-2 text-2xl font-black md:text-3xl">출력 방식 선택 전 자주 묻는 질문</h2>
                            <p className="mt-2 text-white/55 break-keep">
                                FDM, SLA, DLP 중 무엇이 맞는지 고민할 때 가장 많이 받는 질문을 정리했습니다.
                            </p>
                        </div>
                        <div className="grid gap-4">
                            {PRINT_METHOD_FAQS.map((item, i) => (
                                <motion.article
                                    key={item.q}
                                    initial={{ opacity: 0, y: 12 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.06 }}
                                    className="rounded-2xl border border-white/10 bg-black/25 p-6 transition-colors hover:border-white/15 hover:bg-black/35"
                                >
                                    <h3 className="mb-2 text-lg font-black text-white break-keep">{item.q}</h3>
                                    <p className="text-sm leading-relaxed text-white/60 break-keep">{item.a}</p>
                                </motion.article>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Featured guides */}
            <section className="relative z-10 pb-12">
                <div className="container mx-auto max-w-6xl px-6">
                    <div className="grid gap-5 md:grid-cols-2">
                        {PRINT_METHOD_FEATURED.map((item, i) => {
                            const Icon = item.icon
                            return (
                                <motion.div
                                    key={item.href}
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.08 }}
                                >
                                    <Link
                                        href={item.href}
                                        className="group flex h-full flex-col rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6 transition-all hover:-translate-y-1 hover:border-teal-400/20 hover:bg-white/[0.05]"
                                    >
                                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-400/20 bg-teal-400/10 text-teal-300 transition-transform group-hover:scale-110">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-teal-400/80">
                                            {item.eyebrow}
                                        </p>
                                        <h3 className="mt-2 text-xl font-black text-white">{item.title}</h3>
                                        <p className="mt-2 flex-1 text-sm text-white/55 break-keep">{item.desc}</p>
                                        <span className="mt-4 inline-flex items-center gap-1 text-xs font-black text-teal-400 group-hover:gap-2">
                                            가이드 읽기 <ArrowRight className="h-3.5 w-3.5" />
                                        </span>
                                    </Link>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="relative z-10 pb-20">
                <div className="container mx-auto max-w-6xl px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="overflow-hidden rounded-[2rem] border border-teal-400/20 bg-teal-400/5 p-8 md:p-12"
                    >
                        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
                            <div className="space-y-3">
                                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-300">
                                    Ready to print?
                                </p>
                                <h2 className="text-2xl font-black md:text-3xl">공정을 정했다면 바로 견적을 받아보세요</h2>
                                <p className="text-white/65 break-keep leading-relaxed">
                                    파일을 업로드하고 FDM·SLA·DLP 중 원하는 방식으로 실시간 견적과 예상 납기를 확인할 수 있습니다.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Link href="/quote">
                                    <Button className="h-12 rounded-2xl bg-teal-400 px-6 font-black text-slate-950 hover:bg-teal-300">
                                        견적 받기 <ArrowRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </Link>
                                <Link href="/materials">
                                    <Button
                                        variant="outline"
                                        className="h-12 rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                                    >
                                        소재 살펴보기
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </main>
    )
}
