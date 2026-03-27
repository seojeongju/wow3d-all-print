'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import {
    Cpu, Zap, Thermometer, Award, FlaskConical, ArrowRight,
    CheckCircle2, Shield, Layers, Star, ExternalLink, Phone
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import Image from 'next/image';

/* ─────────────────────────────────────────────────────────────
   제품 데이터
───────────────────────────────────────────────────────────── */
const PRODUCTS = [
    {
        id: 'p7-pro',
        series: '9K Series',
        seriesColor: 'text-violet-400',
        name: 'P7 Pro',
        tagline: '소형 고정밀 — 복잡한 모델에 최적화',
        desc: '9K 해상도의 MSLA 방식으로 복잡한 구조와 정밀한 디테일을 요구하는 소형 출력물에 최적화된 엔트리 프로 모델.',
        printerSize: '230 × 230 × 446 mm',
        buildSize: '153 × 77 × 160 mm',
        weight: '7.8 kg',
        resolution: '9K · 28~50 μm',
        speed: '최대 60 mm/h',
        led: '단일 구조 LED',
        power: 'DC 24V 5A · 130W',
        chamber: '자동 가열 38°C',
        highlight: false,
        gradient: 'from-violet-500/10 via-transparent to-transparent',
        border: 'border-violet-500/20',
        glow: 'shadow-violet-500/10',
        image: '/images/products/p7-pro.png',
    },
    {
        id: 'p10-pro',
        series: '8K Series',
        seriesColor: 'text-primary',
        name: 'P10 Pro',
        tagline: '중형 올라운더 — 볼륨과 디테일의 균형',
        desc: '228×128×250mm 빌드·14.85μm XY 픽셀로 애니메이션·피규어·중형 산업 부품까지 커버하는 베스트셀러 데스크탑 프로 모델.',
        printerSize: '365 × 380 × 610 mm',
        buildSize: '228 × 128 × 250 mm',
        weight: '25.5 kg',
        resolution: '8K · 14.85 μm',
        speed: '최대 60 mm/h',
        led: '내장 활성탄소 필터',
        power: '220–240 VAC · 350W',
        chamber: '자동 가열 38°C',
        highlight: true,
        gradient: 'from-primary/15 via-indigo-500/5 to-transparent',
        border: 'border-primary/40',
        glow: 'shadow-primary/20',
        image: '/images/products/p10-pro.png',
    },
    {
        id: 'p13-pro',
        series: '16K Series',
        seriesColor: 'text-amber-400',
        name: 'P13 Pro',
        tagline: '대형·초고해상도 — 산업용 최상급',
        desc: '16K 패널과 91유닛 LED Matrix로 산업 최상급 해상도와 대형 빌드를 동시에 구현. 고정밀 산업·의료·덴탈 출력의 최종 선택.',
        printerSize: '500 × 420 × 769 mm',
        buildSize: '302 × 162 × 380 mm',
        weight: '58 kg',
        resolution: '16K · 초고해상도',
        speed: '최대 60 mm/h',
        led: '91 units LED Matrix',
        power: '220–240 VAC · 350W',
        chamber: '자동 가열 35°C',
        highlight: false,
        gradient: 'from-amber-500/10 via-transparent to-transparent',
        border: 'border-amber-500/20',
        glow: 'shadow-amber-500/10',
        image: '/images/products/p13-pro.png',
    },
    {
        id: 'p13',
        series: '6K Series',
        seriesColor: 'text-emerald-400',
        name: 'P13',
        tagline: '대형·효율 — 양산 환경 최적화',
        desc: '대형 빌드 볼륨과 효율적인 6K 해상도를 결합해 반복 양산 환경에 최적화. 비용 대비 최고의 생산성을 요구하는 현장을 위한 모델.',
        printerSize: '500 × 420 × 769 mm',
        buildSize: '277 × 156 × 380 mm',
        weight: '58 kg',
        resolution: '6K · 양산 최적',
        speed: '최대 60 mm/h',
        led: '91 units LED Matrix',
        power: '220–240 VAC · 350W',
        chamber: '자동 가열 35°C',
        highlight: false,
        gradient: 'from-emerald-500/10 via-transparent to-transparent',
        border: 'border-emerald-500/20',
        glow: 'shadow-emerald-500/10',
        image: '/images/products/p13.png',
    },
];

/* ─────────────────────────────────────────────────────────────
   핵심 기술 우위
───────────────────────────────────────────────────────────── */
const TECH_FEATURES = [
    {
        icon: Cpu,
        title: '그레이스케일 XY 픽셀',
        subtitle: 'Imadjust™',
        desc: 'XY 픽셀 그레이스케일 조정으로 DLP급 디테일 성능을 MSLA에서 구현합니다.',
        color: 'text-indigo-300',
        bg: 'bg-indigo-500/20',
        border: 'border-indigo-500/30',
    },
    {
        icon: Zap,
        title: '60 mm/h 공통 최대 속도',
        subtitle: '전 모델 동일 적용',
        desc: '전 모델 60 mm/h 최대 출력 속도로 효율적인 생산 프로덕션을 실현합니다.',
        color: 'text-amber-300',
        bg: 'bg-amber-500/20',
        border: 'border-amber-500/30',
    },
    {
        icon: Thermometer,
        title: '챔버 온도 제어',
        subtitle: '에어 히팅 프린트 챔버',
        desc: '18~28℃ 환경에서 모델별 35~38℃ 내부 자동 가열로 일관된 출력 품질을 보장합니다.',
        color: 'text-rose-300',
        bg: 'bg-rose-500/20',
        border: 'border-rose-500/30',
    },
    {
        icon: Shield,
        title: '전문 A/S 지원',
        subtitle: '기술 엔지니어 직접 지원',
        desc: '전문 엔지니어 기반 사후지원 및 기술 백업으로 장비 가동률을 최대화합니다.',
        color: 'text-emerald-300',
        bg: 'bg-emerald-500/20',
        border: 'border-emerald-500/30',
    },
];

/* ─────────────────────────────────────────────────────────────
   제품 인증 현황
───────────────────────────────────────────────────────────── */
const CERTIFICATIONS = [
    {
        icon: '🏅',
        title: 'KC 인증',
        desc: '방송통신기자재등의 적합등록 (모델명: DP-P7, P9, P13)',
    },
    {
        icon: '🏭',
        title: '직접생산확인증명서',
        desc: '3차원프린터 직접 생산 시설 및 공정 보유 공식 인증',
    },
    {
        icon: '📜',
        title: '특허등록증',
        desc: '복합소재 성형용 3D프린팅 장치 기술 특허 보유',
    },
    {
        icon: '🏛️',
        title: '입찰참가자격등록',
        desc: '국가종합전자조달시스템 경쟁입찰참가자격 공식 등록',
    },
];

/* ─────────────────────────────────────────────────────────────
   호환 레진 소재
───────────────────────────────────────────────────────────── */
const RESINS = [
    { name: '범용 레진', category: 'Standard', color: 'bg-slate-500/25 text-slate-200 border-slate-400/40', desc: '프로토타입·교육·디자인 검증용 경제적 범용' },
    { name: '덴탈 레진', category: 'Dental', color: 'bg-pink-500/25 text-pink-200 border-pink-400/40', desc: '치과 기공·의료 보조기기 전용 생체적합성' },
    { name: '주얼리 레진', category: 'Jewelry', color: 'bg-amber-500/25 text-amber-200 border-amber-400/40', desc: '주얼리·금속 캐스팅 마스터 패턴 전용' },
    { name: '산업용 레진', category: 'Engineering', color: 'bg-blue-500/25 text-blue-200 border-blue-400/40', desc: '고강도·내열·기능 부품 산업용 엔지니어링' },
    { name: 'Flexible 레진', category: 'Flexible', color: 'bg-violet-500/25 text-violet-200 border-violet-400/40', desc: '탄성·완충 특성이 필요한 유연 부품용' },
    { name: 'Tough 레진', category: 'Tough', color: 'bg-emerald-500/25 text-emerald-200 border-emerald-400/40', desc: '충격·마모 저항이 요구되는 구조 부품용' },
];

/* ─────────────────────────────────────────────────────────────
   스펙 행 컴포넌트
───────────────────────────────────────────────────────────── */
function SpecRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between py-2.5 border-b border-white/5 last:border-0">
            <span className="text-[10px] text-white/40 font-black uppercase tracking-widest shrink-0 w-32">{label}</span>
            <span className="text-[11px] text-white font-bold text-right leading-relaxed">{value}</span>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   메인 페이지
───────────────────────────────────────────────────────────── */
export default function PrinterProductPage() {
    const [activeProduct, setActiveProduct] = useState('p10-pro');
    const active = PRODUCTS.find(p => p.id === activeProduct) ?? PRODUCTS[1];

    return (
        <main className="min-h-screen bg-[#020617] text-white selection:bg-teal-500/30 selection:text-teal-400 overflow-x-hidden pt-20">
            <Header />

            {/* ── 배경 시스템 ───────────────────────────── */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[#020617]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(45,212,191,0.08)_0%,transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.08)_0%,transparent_50%)]" />
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:60px_60px]" />
            </div>
            <section className="relative pt-24 pb-20 overflow-hidden z-10">
                <div className="container mx-auto px-4 text-center">
                    {/* 배지 */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-teal-400/20 bg-teal-400/5 text-teal-400 text-[11px] font-black uppercase tracking-[0.3em] mb-10 shadow-xl shadow-teal-400/5"
                    >
                        <Layers className="w-4 h-4" />
                        Professional Grade 3D Printer
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-6xl md:text-8xl font-black mb-6 tracking-tight leading-none"
                    >
                        P-Pro{' '}
                        <span className="bg-gradient-to-r from-teal-400 via-indigo-400 to-teal-400 bg-clip-text text-transparent">
                            Series
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg md:text-xl text-white/60 font-bold mb-10 break-keep max-w-2xl mx-auto"
                    >
                        최상의 정밀도와 속도를 실현하는 산업용 MSLA 3D 프린터의 기준,<br />
                        <span className="text-white">P-Pro 시리즈</span>의 압도적인 퍼포먼스를 경험하세요.
                    </motion.p>

                    {/* 스펙 배지 행 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-wrap justify-center gap-4 mb-12"
                    >
                        {[
                            { label: 'Technology', value: 'MSLA' },
                            { label: 'Wavelength', value: '405 nm UV' },
                            { label: 'Max Speed', value: '60 mm/h' },
                            { label: 'Resolution', value: 'Up to 16K' },
                        ].map((b) => (
                            <span
                                key={b.label}
                                className="flex items-center gap-3 px-6 py-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl text-sm font-bold shadow-2xl"
                            >
                                <span className="text-teal-400 text-[10px] font-black uppercase tracking-widest">{b.label}</span>
                                <span className="text-white/80">{b.value}</span>
                            </span>
                        ))}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-col sm:flex-row justify-center gap-5"
                    >
                        <Link href="/contact">
                            <Button className="h-16 px-10 rounded-2xl bg-teal-400 text-slate-950 hover:bg-teal-300 font-black uppercase tracking-widest gap-3 shadow-xl shadow-teal-400/20 transition-all hover:scale-105 active:scale-95">
                                <Phone className="w-5 h-5" /> 무료 도입 상담
                            </Button>
                        </Link>
                        <Link href="/quote">
                            <Button variant="outline" className="h-16 px-10 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest gap-3 transition-all hover:scale-105 active:scale-95">
                                실시간 견적 <ArrowRight className="w-5 h-5" />
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* ── 제품 라인업 ───────────────────────────────── */}
            <section className="relative py-24 z-10">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="mb-14"
                    >
                        <h2 className="text-4xl md:text-5xl font-black mb-4 text-white uppercase tracking-tight">제품 라인업</h2>
                        <div className="h-1.5 w-24 bg-teal-400 rounded-full mb-6" />
                        <p className="text-white/40 text-lg font-bold">
                            정밀 제작 환경에 최적화된 최신 P-Pro 라인업을 만나보세요.
                        </p>
                    </motion.div>

                    {/* 탭 선택 */}
                    <div className="flex flex-wrap gap-3 mb-12">
                        {PRODUCTS.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setActiveProduct(p.id)}
                                className={`px-8 py-3.5 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all ${activeProduct === p.id
                                    ? 'bg-teal-400 text-slate-950 shadow-[0_10px_30px_rgba(45,212,191,0.3)]'
                                    : 'bg-white/5 text-white/40 border border-white/10 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                {p.name}
                            </button>
                        ))}
                    </div>

                    {/* 제품 카드 그리드 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                        {PRODUCTS.map((product, i) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08 }}
                                onClick={() => setActiveProduct(product.id)}
                                className={`relative rounded-[2.5rem] border p-8 cursor-pointer transition-all duration-500 overflow-hidden group
                                    ${activeProduct === product.id
                                        ? 'bg-white/10 border-teal-400/50 shadow-2xl shadow-teal-400/20 scale-[1.02]'
                                        : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
                                    }`}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-teal-400/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                {/* 추천 배지 */}
                                {product.highlight && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/30 whitespace-nowrap">
                                        <Star className="w-3 h-3 fill-white" /> 베스트셀러
                                    </span>
                                )}

                                <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${product.seriesColor}`}>
                                    {product.series}
                                </div>
                                <h3 className="text-3xl font-black mb-2 text-white">{product.name}</h3>
                                <p className="text-sm text-white/40 font-bold mb-8 break-keep leading-relaxed">
                                    {product.tagline}
                                </p>

                                {/* 제품 이미지 추가 - 화이트 디스플레이 케이스 방식 */}
                                <div className="relative w-full aspect-[4/3] mb-8 rounded-2xl bg-white overflow-hidden group/img">
                                    <Image
                                        src={product.image || ''}
                                        alt={product.name}
                                        fill
                                        className="object-contain p-6 group-hover/img:scale-110 transition-transform duration-700"
                                    />
                                </div>

                                {/* 스펙 */}
                                <div className="space-y-1">
                                    <SpecRow label="장비 크기" value={product.printerSize!} />
                                    <SpecRow label="장비 중량" value={product.weight!} />
                                    <SpecRow label="출력 사이즈" value={product.buildSize} />
                                </div>

                                {activeProduct === product.id && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mt-6 pt-6 border-t border-white/10"
                                    >
                                        <p className="text-[13px] text-white/50 font-bold leading-relaxed break-keep">
                                            {product.desc}
                                        </p>
                                    </motion.div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 하드웨어 스펙 상세 ─────────────────────── */}
            <section className="relative py-24 z-10">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-14"
                    >
                        <h2 className="text-4xl md:text-5xl font-black mb-4 text-white uppercase tracking-tight">
                            하드웨어 스펙{' '}
                            <span className="text-teal-400">— {active.name}</span>
                        </h2>
                        <div className="h-1 w-24 bg-white/10 rounded-full mb-6" />
                        <p className="text-white/40 text-lg font-bold">모델별 상세 사양을 확인해 보세요.</p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                title: '빌드 볼륨', value: active.buildSize, icon: Layers,
                                color: 'text-teal-400', bg: 'bg-teal-400/10', border: 'border-teal-400/20',
                            },
                            {
                                title: '장비 규격', value: active.printerSize || '', icon: Zap,
                                color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20',
                            },
                            {
                                title: '장비 무게', value: active.weight || '', icon: Cpu,
                                color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20',
                            },
                            {
                                title: '해상도', value: active.resolution, icon: Thermometer,
                                color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20',
                            },
                        ].map((spec, i) => (
                            <motion.div
                                key={spec.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.07 }}
                                className={`p-8 rounded-[2rem] border ${spec.border} bg-white/[0.03] backdrop-blur-xl shadow-2xl relative overflow-hidden group`}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                                <div className={`w-14 h-14 rounded-2xl ${spec.bg} flex items-center justify-center mb-6 ${spec.color} relative z-10 group-hover:scale-110 transition-transform`}>
                                    <spec.icon className="w-8 h-8" strokeWidth={2} />
                                </div>
                                <div className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em] mb-2 relative z-10">
                                    {spec.title}
                                </div>
                                <div className="text-xl font-black text-white relative z-10">{spec.value}</div>
                            </motion.div>
                        ))}
                    </div>

                    {/* 상세 스펙 테이블 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-12 grid md:grid-cols-2 gap-8"
                    >
                        <div className="p-8 rounded-[2.5rem] border border-white/5 bg-white/[0.03] backdrop-blur-xl">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-rose-400 mb-8 flex items-center gap-3">
                                <Thermometer className="w-5 h-5 shrink-0" /> 환경 및 규격
                            </h3>
                            <div className="space-y-4">
                                <SpecRow label="장비 크기" value={active.printerSize || ''} />
                                <SpecRow label="장비 중량" value={active.weight || ''} />
                                <SpecRow label="챔버 가열" value={active.chamber} />
                                <SpecRow label="공기 정화" value={active.led} />
                            </div>
                        </div>
                        <div className="p-8 rounded-[2.5rem] border border-white/5 bg-white/[0.03] backdrop-blur-xl">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-400 mb-8 flex items-center gap-3">
                                <Zap className="w-5 h-5 shrink-0" /> 전원 및 인터페이스
                            </h3>
                            <div className="space-y-4">
                                <SpecRow label="공급 전원" value={active.power} />
                                <SpecRow label="연결 방식" value="USB 2.0" />
                                <SpecRow label="디스플레이" value='5.0" Touch Screen' />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── 핵심 기술 우위 ────────────────────────────── */}
            <section className="relative py-32 z-10">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <h2 className="text-4xl md:text-5xl font-black mb-6 text-white uppercase tracking-tight">핵심 기술 우위</h2>
                        <p className="text-white/40 text-lg font-bold break-keep max-w-2xl mx-auto">
                            와우쓰리디 P-Pro Series만의 독자 기술로 경쟁 제품과 차별화된 출력 품질을 경험하세요.
                        </p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {TECH_FEATURES.map((feat, i) => (
                            <motion.div
                                key={feat.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className={`group p-8 rounded-[2.5rem] border border-white/5 bg-white/[0.03] backdrop-blur-xl hover:bg-white/[0.06] transition-all duration-500 hover:scale-[1.05]`}
                            >
                                <div className={`w-16 h-16 rounded-[1.5rem] ${feat.bg} flex items-center justify-center mb-8 ${feat.color} group-hover:scale-110 transition-transform shadow-2xl`}>
                                    <feat.icon className="w-8 h-8" strokeWidth={2} />
                                </div>
                                <div className={`text-[10px] font-black uppercase tracking-[0.3em] mb-3 ${feat.color}`}>
                                    {feat.subtitle}
                                </div>
                                <h3 className="text-xl font-black text-white mb-4 leading-tight">{feat.title}</h3>
                                <p className="text-sm text-white/40 font-bold leading-relaxed break-keep">{feat.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 호환 레진 소재 ────────────────────────────── */}
            <section className="relative py-32 z-10">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-14"
                    >
                        <h2 className="text-4xl md:text-5xl font-black mb-6 text-white uppercase tracking-tight">호환 레진 소재</h2>
                        <p className="text-white/40 text-lg font-bold">
                            405nm UV 광원 기반 — 광범위한 산업·의료·주얼리 응용
                        </p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {RESINS.map((resin, i) => (
                            <motion.div
                                key={resin.name}
                                initial={{ opacity: 0, scale: 0.96 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.07 }}
                                className="flex items-start gap-6 p-8 rounded-[2rem] border border-white/5 bg-white/[0.03] backdrop-blur-xl hover:bg-white/[0.06] transition-all active:scale-95 group"
                            >
                                <div className={`px-4 py-2 rounded-xl text-[10px] font-black border group-hover:scale-110 transition-transform ${resin.color}`}>
                                    {resin.category}
                                </div>
                                <div className="space-y-1">
                                    <div className="font-black text-lg text-white">{resin.name}</div>
                                    <div className="text-[13px] text-white/30 font-bold leading-relaxed break-keep">{resin.desc}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 제품 인증 현황 ────────────────────────────── */}
            <section className="relative py-32 z-10">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <h2 className="text-4xl md:text-5xl font-black mb-6 text-white uppercase tracking-tight">
                            <span className="text-teal-400">(주)와우쓰리디</span> 인증 및 특허
                        </h2>
                        <p className="text-white/40 font-bold break-keep max-w-xl mx-auto text-lg leading-relaxed">
                            국가 공인 인증과 독자적인 특허 기술로 최상의 품질을 보장합니다.
                        </p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {CERTIFICATIONS.map((cert, i) => (
                            <motion.div
                                key={cert.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08 }}
                                className="p-10 rounded-[2.5rem] border border-white/5 bg-white/[0.03] backdrop-blur-xl text-center hover:bg-white/[0.06] transition-all hover:scale-105 group"
                            >
                                <div className="text-5xl mb-8 group-hover:scale-125 transition-transform" aria-hidden>{cert.icon}</div>
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" strokeWidth={3} />
                                    <h3 className="font-black text-white text-lg">{cert.title}</h3>
                                </div>
                                <p className="text-[13px] text-white/30 font-bold leading-relaxed break-keep">{cert.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ──────────────────────────────────────── */}
            <section className="relative py-40 z-10 overflow-hidden">
                <div className="container mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full border border-teal-400/20 bg-teal-400/5 text-teal-400 text-[11px] font-black uppercase tracking-[0.3em] mb-12 shadow-2xl">
                            <FlaskConical className="w-5 h-5" />
                            데모 출력 &amp; 도입 상담
                        </div>

                        <h2 className="text-5xl md:text-7xl font-black mb-10 tracking-tight leading-none text-white uppercase">
                            Your Precision,<br />
                            <span className="text-teal-400">Our Performance</span>
                        </h2>
                        <p className="text-white/40 text-xl font-bold mb-16 break-keep max-w-2xl mx-auto leading-relaxed">
                            최상의 출력 품질을 위한 정밀 전문가들이 대기하고 있습니다.<br />
                            산업군에 최적화된 하드웨어와 레진 솔루션을 확인해 보세요.
                        </p>

                        <div className="flex flex-col sm:flex-row justify-center gap-6">
                            <Link href="/contact">
                                <Button size="lg" className="h-20 px-12 rounded-[2rem] bg-teal-400 text-slate-950 hover:bg-teal-300 font-black uppercase tracking-[0.2em] text-lg gap-3 shadow-[0_20px_50px_rgba(45,212,191,0.3)] transition-all hover:scale-105 active:scale-95">
                                    <Phone className="w-6 h-6" /> 무료 도입 상담
                                </Button>
                            </Link>
                            <a
                                href="https://wow3dsw.co.kr/hardware/3d-printer/"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button size="lg" variant="outline" className="h-20 px-12 rounded-[2rem] border-white/10 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-[0.2em] text-lg gap-3 transition-all hover:scale-105 active:scale-95">
                                    공식 사이트 방문 <ExternalLink className="w-6 h-6" />
                                </Button>
                            </a>
                        </div>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
