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
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

const PRODUCTS = [
    {
        id: 'p7-pro',
        series: '9K Series',
        seriesColor: 'text-violet-300',
        name: 'P7 Pro',
        tagline: '소형 고정밀 — 복잡한 모델에 최적화',
        desc: '9K 해상도 MSLA로 복잡한 구조·정밀 디테일이 필요한 소형 출력에 최적화된 엔트리 프로 모델입니다.',
        buildSize: '153 × 77 × 160 mm',
        resolution: '9K · 28~50 μm',
        image: '/images/products/p7-pro.png',
        border: 'border-violet-400/25',
    },
    {
        id: 'p10-pro',
        series: '8K Series',
        seriesColor: 'text-teal-300',
        name: 'P10 Pro',
        tagline: '중형 올라운더 — 볼륨과 디테일의 균형',
        desc: '중형 빌드와 고해상도 XY 픽셀로 피규어·중형 부품까지 커버하는 데스크탑 프로 베스트셀러입니다.',
        buildSize: '228 × 128 × 250 mm',
        resolution: '8K · 14.85 μm',
        image: '/images/products/p10-pro.png',
        border: 'border-teal-400/35',
        highlight: true,
    },
    {
        id: 'p13-pro',
        series: '16K Series',
        seriesColor: 'text-amber-300',
        name: 'P13 Pro',
        tagline: '대형·초고해상도 — 산업용 최상급',
        desc: '16K 패널과 LED Matrix로 대형 빌드와 초고정밀을 동시에. 산업·덴탈·정밀 시제품에 적합합니다.',
        buildSize: '302 × 162 × 380 mm',
        resolution: '16K · 초고해상도',
        image: '/images/products/p13-pro.png',
        border: 'border-amber-400/25',
    },
]

const BENEFITS = [
    {
        icon: Store,
        title: '스마트상점 기술 분야 연계',
        desc: '소상공인시장진흥공단 스마트상점 기술보급사업의 3D 기술 분야(3D프린터 등)와 연계해 매장·제작 환경 고도화를 검토할 수 있습니다.',
    },
    {
        icon: BadgeCheck,
        title: '공식 공급·기술 지원',
        desc: '(주)와우쓰리디가 MSLA-DLP P7 Pro·P10 Pro·P13 Pro 제품의 공식 공급·도입 상담·교육·A/S 연계를 지원합니다.',
    },
    {
        icon: ShieldCheck,
        title: '현장 맞춤 컨설팅',
        desc: '업종·출력 목적(시제품·피규어·덴탈 등)에 맞는 모델 선정, 레진·후처리 환경까지 함께 안내합니다.',
    },
]

const STEPS = [
    { step: '01', title: '사업·자격 확인', desc: '소상공인 해당 여부·공고 유형(구입형 등)을 공식 안내에서 확인합니다.' },
    { step: '02', title: '장비 선정 상담', desc: '와우쓰리디에 P시리즈 Pro 도입 목적·공간·예산을 알려주시면 모델을 제안합니다.' },
    { step: '03', title: '공고 신청·서류', desc: '스마트상점 공식 채널을 통해 신청·서류를 준비하고, 필요 시 공급 견적을 지원합니다.' },
    { step: '04', title: '설치·교육', desc: '장비 납품·설치·운영 교육과 출력·레진 운용 가이드를 제공합니다.' },
]

export default function SmartStoreSupportPage() {
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
                                Smart Store Support
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 }}
                                className="text-4xl font-black leading-[1.15] tracking-tight text-white md:text-6xl break-keep"
                            >
                                스마트상점 지원사업
                                <span className="mt-3 block text-teal-300">MSLA-DLP 공식 공급 안내</span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="mx-auto max-w-2xl text-base font-medium leading-relaxed text-white/45 md:text-lg break-keep"
                            >
                                소상공인시장진흥공단 스마트상점 기술보급사업과 연계해,
                                (주)와우쓰리디가 MSLA-DLP <strong className="text-white/80">P7 Pro · P10 Pro · P13 Pro</strong>를
                                공식 공급·도입 상담합니다.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="flex flex-wrap items-center justify-center gap-3 pt-2"
                            >
                                <Link href="/contact?category=partnership">
                                    <Button
                                        size="lg"
                                        className="h-14 gap-2 rounded-2xl bg-teal-400 px-8 font-black tracking-wide text-slate-950 shadow-[0_0_30px_rgba(45,212,191,0.28)] hover:bg-teal-300"
                                    >
                                        도입 상담 신청
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
                                        공식 사업 안내
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
                                    Official Supplier
                                </p>
                                <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl">
                                    (주)와우쓰리디 — MSLA-DLP P시리즈 Pro 공식 공급
                                </h2>
                                <p className="text-sm font-medium leading-relaxed text-white/45 break-keep md:text-[15px]">
                                    WOW3D는 산업·제작 현장에 맞는 MSLA(면광원 LCD) 기반 고정밀 3D프린터
                                    P7 Pro, P10 Pro, P13 Pro를 공급합니다. 스마트상점 지원사업을 준비 중인
                                    소상공인·파트너사께 장비 선정부터 설치·교육까지 연결해 드립니다.
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
                                스마트상점 지원사업이란?
                            </h2>
                            <p className="mt-4 text-sm font-medium leading-relaxed text-white/45 break-keep md:text-base">
                                중소벤처기업부·소상공인시장진흥공단이 소상공인의 경영 효율화를 위해
                                스마트기술 도입을 지원하는 사업입니다. 키오스크·로봇·AI·IoT와 함께
                                <strong className="text-white/70"> 3D프린터</strong> 등 3D 기술 분야가
                                기술 분류에 포함됩니다.
                            </p>
                        </div>

                        <div className="grid gap-5 md:grid-cols-3">
                            {BENEFITS.map((b) => (
                                <div
                                    key={b.title}
                                    className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 transition-colors hover:border-teal-400/25 hover:bg-teal-400/[0.04]"
                                >
                                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-400/10 text-teal-300">
                                        <b.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-lg font-black text-white">{b.title}</h3>
                                    <p className="mt-3 text-sm font-medium leading-relaxed text-white/40 break-keep">
                                        {b.desc}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-relaxed text-white/30 break-keep">
                            ※ 지원 한도·보조율·모집 일정은 연도별 공고에 따라 달라집니다.
                            최신 내용은{' '}
                            <a
                                href="https://www.sbiz.or.kr/smst/index.do"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-teal-400/80 underline-offset-2 hover:underline"
                            >
                                소상공인 스마트상점 공식 사이트
                            </a>
                            및 공고문을 반드시 확인해 주세요.
                        </p>
                    </div>
                </section>

                {/* Products */}
                <section className="pb-24">
                    <div className="container mx-auto px-6">
                        <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-teal-400/80">
                                    Product Line-up
                                </p>
                                <h2 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">
                                    공식 공급 제품 — P시리즈 Pro
                                </h2>
                                <p className="mt-3 max-w-xl text-sm font-medium text-white/40 break-keep">
                                    스마트상점·제작 스튜디오·시제품 현장에서 바로 활용 가능한 MSLA-DLP 라인업입니다.
                                </p>
                            </div>
                            <Link
                                href="/hardware/3d-printer"
                                className="inline-flex items-center gap-1.5 text-sm font-bold text-teal-300 hover:text-teal-200"
                            >
                                전체 제품 스펙 보기
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
                                            alt={`${p.name} MSLA-DLP 3D프린터`}
                                            fill
                                            className="object-contain p-6"
                                            sizes="(max-width: 1024px) 100vw, 33vw"
                                        />
                                        {p.highlight && (
                                            <span className="absolute left-4 top-4 rounded-full bg-teal-400 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-950">
                                                Best Seller
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
                                        <p className="text-sm font-bold text-white/55">{p.tagline}</p>
                                        <p className="text-sm leading-relaxed text-white/40 break-keep">{p.desc}</p>
                                        <ul className="mt-auto space-y-2 border-t border-white/5 pt-4 text-[13px] font-medium text-white/50">
                                            <li className="flex items-center gap-2">
                                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal-400/80" />
                                                빌드: {p.buildSize}
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal-400/80" />
                                                해상도: {p.resolution}
                                            </li>
                                        </ul>
                                        <Link href={`/hardware/3d-printer#${p.id}`} className="pt-2">
                                            <Button
                                                variant="ghost"
                                                className="w-full rounded-xl border border-white/10 bg-white/5 font-bold text-white/70 hover:bg-white/10 hover:text-white"
                                            >
                                                상세 스펙
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
                                도입 진행 흐름
                            </h2>
                            <p className="mt-3 text-sm text-white/40 break-keep">
                                공고 일정과 서류는 공식 채널 기준이며, 와우쓰리디는 장비·견적·교육 파트를 지원합니다.
                            </p>
                        </div>
                        <div className="mx-auto max-w-3xl space-y-8">
                            {STEPS.map((s, i) => (
                                <div key={s.step} className="relative flex gap-6 md:gap-8">
                                    {i < STEPS.length - 1 && (
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
                                스마트상점 · P시리즈 도입,
                                <br />
                                <span className="text-teal-300">와우쓰리디</span>에 문의하세요
                            </h2>
                            <p className="mx-auto mt-5 max-w-xl text-sm font-medium text-white/40 break-keep md:text-base">
                                사업 공고·자격은 공식 기관 안내를 따르며, 장비 선정·견적·납품·교육은
                                (주)와우쓰리디가 도와드립니다.
                            </p>
                            <div className="mt-10 flex flex-wrap justify-center gap-3">
                                <Link href="/contact?category=partnership">
                                    <Button
                                        size="lg"
                                        className="h-14 gap-2 rounded-2xl bg-teal-400 px-10 font-black text-slate-950 hover:bg-teal-300"
                                    >
                                        <Handshake className="h-5 w-5" />
                                        상담 신청
                                    </Button>
                                </Link>
                                <Link href="/partnership">
                                    <Button
                                        variant="ghost"
                                        size="lg"
                                        className="h-14 rounded-2xl border border-white/10 bg-white/5 px-10 font-bold text-white/60 hover:bg-white/10 hover:text-white"
                                    >
                                        대리점·파트너십 안내
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
