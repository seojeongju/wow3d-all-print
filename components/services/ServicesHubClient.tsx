'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    ArrowRight,
    Box,
    Droplets,
    GraduationCap,
    ImageIcon,
    Layers,
    Package,
    PenTool,
    Printer,
    Upload,
    Zap,
    type LucideIcon,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { SERVICE_LANDINGS } from '@/lib/seo-service-pages'
import { cn } from '@/lib/utils'

const PROCESS: { step: string; title: string; desc: string; icon: LucideIcon }[] = [
    {
        step: '01',
        title: '업로드',
        desc: '3D 파일 또는 제품 사진',
        icon: Upload,
    },
    {
        step: '02',
        title: '자동견적',
        desc: '공정·소재 선택 후 즉시 가격',
        icon: Zap,
    },
    {
        step: '03',
        title: '제작·검수',
        desc: '출력 후 품질 확인',
        icon: Printer,
    },
    {
        step: '04',
        title: '배송',
        desc: '평균 3~7일 내 수령',
        icon: Package,
    },
]

type ServiceVisual = {
    slug: string
    title: string
    blurb: string
    icon: LucideIcon
    accent: string
    ring: string
}

const SERVICE_VISUALS: Record<string, Omit<ServiceVisual, 'slug'>> = {
    printing: {
        title: '출력대행',
        blurb: 'STL·OBJ·STEP 업로드 후 바로 견적',
        icon: Printer,
        accent: 'text-teal-300',
        ring: 'group-hover:border-teal-400/45 group-hover:bg-teal-400/[0.08]',
    },
    prototype: {
        title: '시제품·목업',
        blurb: '외관 검증부터 기능 시험까지',
        icon: Box,
        accent: 'text-sky-300',
        ring: 'group-hover:border-sky-400/45 group-hover:bg-sky-400/[0.08]',
    },
    fdm: {
        title: 'FDM 출력',
        blurb: '강도·대형·경제형 기능 부품',
        icon: Layers,
        accent: 'text-amber-300',
        ring: 'group-hover:border-amber-400/45 group-hover:bg-amber-400/[0.08]',
    },
    sla: {
        title: 'SLA·레진',
        blurb: '정밀 표면·미세 디테일',
        icon: Droplets,
        accent: 'text-cyan-300',
        ring: 'group-hover:border-cyan-400/45 group-hover:bg-cyan-400/[0.08]',
    },
    'photo-to-3d': {
        title: '사진→AI 3D',
        blurb: '파일 없이 사진만으로 입체·견적',
        icon: ImageIcon,
        accent: 'text-rose-300',
        ring: 'group-hover:border-rose-400/45 group-hover:bg-rose-400/[0.08]',
    },
    graduation: {
        title: '졸업작품',
        blurb: '납기·예산에 맞춘 학생 출력',
        icon: GraduationCap,
        accent: 'text-emerald-300',
        ring: 'group-hover:border-emerald-400/45 group-hover:bg-emerald-400/[0.08]',
    },
    'small-batch': {
        title: '소량생산',
        blurb: '금형 없이 1개부터 반복 제작',
        icon: Package,
        accent: 'text-orange-300',
        ring: 'group-hover:border-orange-400/45 group-hover:bg-orange-400/[0.08]',
    },
    modeling: {
        title: '3D 모델링',
        blurb: '도면·스케치 기반 출력용 모델',
        icon: PenTool,
        accent: 'text-lime-300',
        ring: 'group-hover:border-lime-400/45 group-hover:bg-lime-400/[0.08]',
    },
}

const fadeUp = {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
}

export default function ServicesHubClient() {
    return (
        <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#020617] font-sans text-slate-50 selection:bg-teal-500/30">
            <Header />

            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_20%,#1e293b_0%,#020617_60%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:32px_32px] opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
                <div className="absolute left-[-12%] top-[-8%] h-[48%] w-[48%] rounded-full bg-teal-500/10 blur-[130px]" />
                <div className="absolute bottom-[-18%] right-[-8%] h-[42%] w-[42%] rounded-full bg-indigo-500/10 blur-[140px]" />
            </div>

            <div className="relative z-10 flex-1">
                {/* Hero — brand first, customer-facing copy only */}
                <section className="pb-14 pt-32 sm:pb-20 sm:pt-40">
                    <div className="container mx-auto px-6">
                        <div className="mx-auto max-w-4xl text-center">
                            <motion.p
                                {...fadeUp}
                                className="mb-5 text-[11px] font-black uppercase tracking-[0.32em] text-teal-400"
                            >
                                WOW3D PRO Services
                            </motion.p>
                            <motion.h1
                                {...fadeUp}
                                transition={{ delay: 0.05 }}
                                className="text-4xl font-black tracking-tight text-white sm:text-6xl md:text-7xl"
                            >
                                WOW3D PRO
                                <span className="mt-2 block text-teal-400 sm:mt-3">핵심서비스</span>
                            </motion.h1>
                            <motion.p
                                {...fadeUp}
                                transition={{ delay: 0.1 }}
                                className="mx-auto mt-6 max-w-2xl text-base font-medium leading-relaxed text-white/55 break-keep sm:text-lg"
                            >
                                업로드부터 자동견적·제작·배송까지.
                                목적에 맞는 서비스를 고르고 바로 견적으로 이어가세요.
                            </motion.p>
                            <motion.div
                                {...fadeUp}
                                transition={{ delay: 0.15 }}
                                className="mt-8 flex flex-wrap items-center justify-center gap-3"
                            >
                                <Link href="/quote">
                                    <Button className="h-12 gap-2 rounded-2xl bg-teal-400 px-7 text-sm font-black text-slate-950 shadow-[0_0_28px_rgba(45,212,191,0.28)] hover:bg-teal-300 sm:h-14 sm:px-8 sm:text-base">
                                        3D프린팅 자동견적
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                                <Link href="/quote?entry=photo">
                                    <Button
                                        variant="outline"
                                        className="h-12 gap-2 rounded-2xl border-white/15 bg-white/[0.04] px-7 text-sm font-bold text-white/85 hover:bg-white/[0.08] hover:text-white sm:h-14 sm:px-8 sm:text-base"
                                    >
                                        사진으로 3D 만들기
                                    </Button>
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Infographic process */}
                <section className="pb-16 sm:pb-20" aria-labelledby="service-flow-heading">
                    <div className="container mx-auto px-6">
                        <div className="mx-auto mb-10 max-w-2xl text-center">
                            <h2 id="service-flow-heading" className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                                한눈에 보는 <span className="text-teal-400">제작 흐름</span>
                            </h2>
                            <p className="mt-3 text-sm text-white/45 break-keep sm:text-base">
                                견적부터 수령까지 네 단계로 이어집니다.
                            </p>
                        </div>

                        <ol className="relative mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
                            {/* connector line (desktop) */}
                            <div
                                aria-hidden
                                className="pointer-events-none absolute left-[12%] right-[12%] top-[52px] hidden h-px bg-gradient-to-r from-teal-400/0 via-teal-400/40 to-teal-400/0 lg:block"
                            />
                            {PROCESS.map((item, index) => {
                                const Icon = item.icon
                                return (
                                    <motion.li
                                        key={item.step}
                                        initial={{ opacity: 0, y: 16 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: '-40px' }}
                                        transition={{ delay: index * 0.06 }}
                                        className="relative flex flex-col items-center text-center"
                                    >
                                        <div className="relative z-[1] mb-4 flex h-[104px] w-[104px] flex-col items-center justify-center rounded-full border border-teal-400/30 bg-[#0b1220] shadow-[0_0_0_8px_rgba(2,6,23,0.9)]">
                                            <span className="text-[10px] font-black tracking-[0.2em] text-teal-400/80">
                                                {item.step}
                                            </span>
                                            <Icon className="mt-1.5 h-6 w-6 text-teal-300" aria-hidden />
                                        </div>
                                        <p className="text-base font-black text-white">{item.title}</p>
                                        <p className="mt-1 max-w-[11rem] text-xs font-medium text-white/45 break-keep">
                                            {item.desc}
                                        </p>
                                        {index < PROCESS.length - 1 && (
                                            <ArrowRight
                                                className="mt-3 h-4 w-4 text-white/20 lg:hidden"
                                                aria-hidden
                                            />
                                        )}
                                    </motion.li>
                                )
                            })}
                        </ol>
                    </div>
                </section>

                {/* Service mosaic */}
                <section className="pb-20 sm:pb-28" aria-labelledby="core-services-heading">
                    <div className="container mx-auto px-6">
                        <div className="mx-auto mb-10 flex max-w-6xl flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-teal-400/80">
                                    Core Lineup
                                </p>
                                <h2
                                    id="core-services-heading"
                                    className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl"
                                >
                                    목적별 서비스 선택
                                </h2>
                            </div>
                            <p className="max-w-md text-sm text-white/40 break-keep">
                                각 서비스를 선택하면 안내와 함께 자동견적·문의로 바로 연결됩니다.
                            </p>
                        </div>

                        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {/* Featured auto quote */}
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="sm:col-span-2 xl:col-span-1"
                            >
                                <Link
                                    href="/quote"
                                    className="group relative flex h-full min-h-[220px] flex-col overflow-hidden rounded-[1.75rem] border border-teal-400/35 bg-gradient-to-br from-teal-400/20 via-teal-500/10 to-transparent p-6 transition-all hover:border-teal-300/55 hover:shadow-[0_0_40px_rgba(45,212,191,0.15)] sm:p-7"
                                >
                                    <div
                                        aria-hidden
                                        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-teal-400/20 blur-3xl transition-opacity group-hover:opacity-100"
                                    />
                                    <div className="relative z-[1] flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-400 text-slate-950">
                                        <Zap className="h-6 w-6" />
                                    </div>
                                    <p className="relative z-[1] mt-5 text-[10px] font-black uppercase tracking-[0.24em] text-teal-200">
                                        Start Here
                                    </p>
                                    <h3 className="relative z-[1] mt-2 text-2xl font-black text-white">
                                        3D프린팅 자동견적
                                    </h3>
                                    <p className="relative z-[1] mt-2 flex-1 text-sm font-medium text-white/65 break-keep">
                                        파일 업로드 후 공정·소재를 고르면 즉시 가격을 확인할 수 있습니다.
                                    </p>
                                    <span className="relative z-[1] mt-5 inline-flex items-center gap-1.5 text-sm font-extrabold text-teal-200">
                                        견적 시작
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                    </span>
                                </Link>
                            </motion.div>

                            {SERVICE_LANDINGS.map((service, index) => {
                                const visual = SERVICE_VISUALS[service.slug]
                                if (!visual) return null
                                const Icon = visual.icon
                                return (
                                    <motion.div
                                        key={service.slug}
                                        initial={{ opacity: 0, y: 16 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: Math.min(index * 0.04, 0.24) }}
                                    >
                                        <Link
                                            href={service.path}
                                            className={cn(
                                                'group flex h-full min-h-[200px] flex-col rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6 transition-all sm:p-7',
                                                visual.ring,
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                                                    <Icon className={cn('h-5 w-5', visual.accent)} aria-hidden />
                                                </div>
                                                <span className="text-[10px] font-black tracking-[0.18em] text-white/30">
                                                    {String(index + 1).padStart(2, '0')}
                                                </span>
                                            </div>
                                            <h3 className="mt-5 text-xl font-black text-white group-hover:text-white">
                                                {visual.title}
                                            </h3>
                                            <p className="mt-2 flex-1 text-sm font-medium leading-relaxed text-white/50 break-keep">
                                                {visual.blurb}
                                            </p>
                                            <span
                                                className={cn(
                                                    'mt-5 inline-flex items-center gap-1.5 text-sm font-bold',
                                                    visual.accent,
                                                )}
                                            >
                                                자세히 보기
                                                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                            </span>
                                        </Link>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>
                </section>

                {/* Bottom CTA band */}
                <section className="border-t border-white/10 bg-white/[0.02] py-16 sm:py-20">
                    <div className="container mx-auto px-6">
                        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
                            <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl break-keep">
                                지금 바로 견적을 확인해 보세요
                            </h2>
                            <p className="max-w-xl text-sm text-white/45 break-keep sm:text-base">
                                회원가입 없이도 파일 업로드와 가격 확인이 가능합니다.
                            </p>
                            <div className="flex flex-wrap justify-center gap-3">
                                <Link href="/quote">
                                    <Button className="h-12 gap-2 rounded-2xl bg-teal-400 px-6 font-black text-slate-950 hover:bg-teal-300">
                                        자동견적 받기
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                                <Link href="/contact">
                                    <Button
                                        variant="outline"
                                        className="h-12 rounded-2xl border-white/15 bg-transparent px-6 font-bold text-white/80 hover:bg-white/5 hover:text-white"
                                    >
                                        1:1 문의
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
