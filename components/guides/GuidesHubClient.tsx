'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    ArrowRight,
    BookOpen,
    Box,
    Calculator,
    FileBox,
    Printer,
    Sparkles,
    Clock,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import {
    GUIDE_HUB_JOURNEY,
    GUIDE_HUB_SECTIONS,
    GUIDE_HUB_STATS,
    type GuideHubItem,
} from '@/lib/guides-hub-data'

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
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
        >
            {children}
        </motion.div>
    )
}

function GuideCard({ item, index }: { item: GuideHubItem; index: number }) {
    const Icon = item.icon
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ delay: (index % 6) * 0.05, duration: 0.35 }}
        >
            <Link
                href={item.href}
                className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06] hover:shadow-[0_20px_60px_-20px_rgba(20,184,166,0.25)]"
            >
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-teal-400/10 to-indigo-500/10 blur-2xl opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 ${item.accent} transition-transform duration-300 group-hover:scale-110`}
                    >
                        <Icon className="h-5 w-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] font-bold text-white/45">
                        <Clock className="h-3 w-3" />
                        {item.readMin}분
                    </span>
                </div>
                <h3 className="mb-2 text-lg font-black leading-snug text-white transition-colors group-hover:text-teal-100">
                    {item.title}
                </h3>
                <p className="mb-5 flex-1 text-sm leading-relaxed text-white/55 break-keep">{item.desc}</p>
                <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-teal-400/80 transition-all group-hover:gap-2.5 group-hover:text-teal-300">
                    가이드 읽기
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
            </Link>
        </motion.div>
    )
}

export default function GuidesHubClient() {
    const totalGuides = GUIDE_HUB_SECTIONS.reduce((n, s) => n + s.items.length, 0)

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white selection:bg-teal-500/30">
            <Header />

            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e293b_0%,#020617_55%)]" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-[length:40px_40px] opacity-[0.04] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
                <div className="absolute left-[-10%] top-[10%] h-[50%] w-[50%] animate-pulse rounded-full bg-teal-500/8 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] h-[45%] w-[45%] animate-pulse rounded-full bg-indigo-600/8 blur-[140px]" />
            </div>

            {/* Hero */}
            <section className="relative z-10 border-b border-white/10 pt-32 pb-16 md:pb-20">
                <div className="container mx-auto max-w-6xl px-6">
                    <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="space-y-6"
                        >
                            <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-teal-300">
                                <Sparkles className="h-3.5 w-3.5" />
                                Guide Hub
                            </div>
                            <h1 className="text-4xl font-black leading-[1.1] tracking-tight md:text-6xl">
                                WOW3D 3D 프린팅
                                <br />
                                <span className="bg-gradient-to-r from-teal-300 via-teal-400 to-cyan-300 bg-clip-text text-transparent">
                                    가이드 모음
                                </span>
                            </h1>
                            <p className="max-w-xl text-lg leading-relaxed text-white/65 break-keep">
                                견적 계산, 출력 공정 비교, 파일 준비, 납기, 소재 선택까지 — 처음 방문하는
                                고객도 바로 이해할 수 있도록 카테고리별로 정리했습니다.
                            </p>
                            <div className="flex flex-wrap gap-3 pt-1">
                                <Link href="/quote">
                                    <Button className="h-12 rounded-2xl bg-teal-400 px-6 font-black text-slate-950 hover:bg-teal-300">
                                        자동견적 시작 <ArrowRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </Link>
                                <Link href="/guides/photo-to-3d-printing-quote">
                                    <Button
                                        variant="outline"
                                        className="h-12 rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                                    >
                                        사진→AI 3D 가이드
                                    </Button>
                                </Link>
                            </div>
                            <div className="flex flex-wrap gap-6 pt-2">
                                {GUIDE_HUB_STATS.map((stat, i) => (
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
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.54 }}
                                >
                                    <p className="text-2xl font-black text-teal-400">{totalGuides}</p>
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">
                                        전체 문서
                                    </p>
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* Hero illustration */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.15 }}
                            className="relative mx-auto hidden aspect-square w-full max-w-md lg:block"
                        >
                            <div className="absolute inset-0 rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-sm" />
                            <div className="absolute inset-4 rounded-[2rem] border border-teal-400/15 bg-teal-400/5" />
                            <FloatingIcon
                                className="absolute left-[12%] top-[18%] flex h-16 w-16 items-center justify-center rounded-2xl border border-teal-400/30 bg-teal-400/15 text-teal-300 shadow-lg"
                                delay={0}
                            >
                                <Printer className="h-8 w-8" />
                            </FloatingIcon>
                            <FloatingIcon
                                className="absolute right-[10%] top-[28%] flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-400/30 bg-indigo-400/15 text-indigo-300 shadow-lg"
                                delay={0.5}
                            >
                                <FileBox className="h-7 w-7" />
                            </FloatingIcon>
                            <FloatingIcon
                                className="absolute bottom-[22%] left-[22%] flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/15 text-cyan-300 shadow-lg"
                                delay={1}
                            >
                                <Calculator className="h-7 w-7" />
                            </FloatingIcon>
                            <motion.div
                                className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-3xl border border-white/20 bg-gradient-to-br from-teal-500/20 to-indigo-600/20 shadow-2xl"
                                animate={{ rotate: [0, 3, -3, 0] }}
                                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <BookOpen className="h-12 w-12 text-teal-300" />
                            </motion.div>
                            <motion.div
                                className="absolute inset-x-8 bottom-8 rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-md"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <p className="text-[10px] font-black uppercase tracking-widest text-teal-400/80">
                                    Popular
                                </p>
                                <p className="mt-1 text-sm font-bold text-white">사진만으로 AI 3D 견적</p>
                                <p className="mt-0.5 text-xs text-white/50">파일 없이도 시작 가능</p>
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
                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/35">
                            How to use
                        </p>
                        <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">
                            가이드 활용 3단계
                        </h2>
                    </motion.div>
                    <div className="grid gap-4 md:grid-cols-3">
                        {GUIDE_HUB_JOURNEY.map((step, i) => {
                            const Icon = step.icon
                            return (
                                <motion.div
                                    key={step.step}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm"
                                >
                                    {i < GUIDE_HUB_JOURNEY.length - 1 && (
                                        <div className="absolute right-0 top-1/2 hidden h-px w-8 translate-x-full bg-gradient-to-r from-white/20 to-transparent md:block" />
                                    )}
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

            {/* Featured */}
            <section className="relative z-10 pb-6">
                <div className="container mx-auto max-w-6xl px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <Link
                            href="/guides/photo-to-3d-printing-quote"
                            className="group relative block overflow-hidden rounded-[2rem] border border-teal-400/25 bg-gradient-to-br from-teal-500/15 via-indigo-500/10 to-transparent p-8 md:p-10"
                        >
                            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-teal-400/20 blur-3xl transition-transform group-hover:scale-110" />
                            <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
                                <div className="space-y-3">
                                    <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-300">
                                        Featured Guide
                                    </p>
                                    <h2 className="text-2xl font-black md:text-3xl">
                                        사진(이미지)만으로 3D 프린팅 견적 받기
                                    </h2>
                                    <p className="max-w-2xl text-white/65 break-keep leading-relaxed">
                                        STL 파일이 없어도 괜찮습니다. 사진 업로드 → AI 3D 변환 → 자동견적까지
                                        한 번에 이어지는 전체 흐름을 단계별로 안내합니다.
                                    </p>
                                </div>
                                <div className="flex h-20 w-20 shrink-0 items-center justify-center self-start rounded-3xl border border-teal-400/30 bg-teal-400/15 text-teal-300 transition-transform group-hover:scale-105 md:self-center">
                                    <Box className="h-10 w-10" />
                                </div>
                            </div>
                            <span className="relative mt-6 inline-flex items-center gap-2 text-sm font-black text-teal-300 group-hover:gap-3">
                                지금 읽어보기 <ArrowRight className="h-4 w-4" />
                            </span>
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Sections */}
            <section className="relative z-10 py-12 md:py-16">
                <div className="container mx-auto max-w-6xl space-y-16 px-6">
                    {GUIDE_HUB_SECTIONS.map((section, sectionIndex) => {
                        const SectionIcon = section.icon
                        return (
                            <motion.div
                                key={section.id}
                                id={section.id}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-60px' }}
                                transition={{ duration: 0.4 }}
                                className="space-y-6"
                            >
                                <div
                                    className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-r ${section.gradient} p-6 md:p-8`}
                                >
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div
                                            className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${section.iconBg} ${section.iconColor}`}
                                        >
                                            <SectionIcon className="h-7 w-7" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black md:text-3xl">{section.title}</h2>
                                            <p className="mt-1 text-sm text-white/55">{section.subtitle}</p>
                                        </div>
                                        <span className="ml-auto rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-bold text-white/50">
                                            {section.items.length}개
                                        </span>
                                    </div>
                                </div>
                                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                                    {section.items.map((item, i) => (
                                        <GuideCard key={item.href} item={item} index={sectionIndex * 3 + i} />
                                    ))}
                                </div>
                            </motion.div>
                        )
                    })}
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
                                <h2 className="text-2xl font-black md:text-3xl">가이드를 읽었다면, 바로 견적을 받아보세요</h2>
                                <p className="text-white/65 break-keep leading-relaxed">
                                    파일 업로드 또는 AI 3D 변환 후 소재·옵션을 선택하면 실시간 견적이 표시됩니다.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Link href="/quote">
                                    <Button className="h-12 rounded-2xl bg-teal-400 px-6 font-black text-slate-950 hover:bg-teal-300">
                                        자동견적 시작 <ArrowRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </Link>
                                <Link href="/materials">
                                    <Button
                                        variant="outline"
                                        className="h-12 rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                                    >
                                        소재 전체 보기
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
