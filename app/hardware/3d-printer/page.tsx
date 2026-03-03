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
        buildSize: '330 × 330 × 445 mm',
        resolution: '9K · 28~50 μm',
        speed: '최대 60 mm/h',
        led: '단일 구조 LED',
        power: 'DC 24V 5A · 130W',
        chamber: '자동 가열 38°C',
        highlight: false,
        gradient: 'from-violet-500/10 via-transparent to-transparent',
        border: 'border-violet-500/20',
        glow: 'shadow-violet-500/10',
    },
    {
        id: 'p10-pro',
        series: '8K Series',
        seriesColor: 'text-primary',
        name: 'P10 Pro',
        tagline: '중형 올라운더 — 볼륨과 디테일의 균형',
        desc: '228×128×250mm 빌드·14.85μm XY 픽셀로 애니메이션·피규어·중형 산업 부품까지 커버하는 베스트셀러 데스크탑 프로 모델.',
        buildSize: '365 × 280 × 510 mm',
        resolution: '8K · 14.85 μm',
        speed: '최대 60 mm/h',
        led: '내장 활성탄소 필터',
        power: '220–240 VAC · 350W',
        chamber: '자동 가열 38°C',
        highlight: true,
        gradient: 'from-primary/15 via-indigo-500/5 to-transparent',
        border: 'border-primary/40',
        glow: 'shadow-primary/20',
    },
    {
        id: 'p13-pro',
        series: '16K Series',
        seriesColor: 'text-amber-400',
        name: 'P13 Pro',
        tagline: '대형·초고해상도 — 산업용 최상급',
        desc: '16K 패널과 91유닛 LED Matrix로 산업 최상급 해상도와 대형 빌드를 동시에 구현. 고정밀 산업·의료·덴탈 출력의 최종 선택.',
        buildSize: '500 × 430 × 760 mm',
        resolution: '16K · 초고해상도',
        speed: '최대 60 mm/h',
        led: '91 units LED Matrix',
        power: '220–240 VAC · 350W',
        chamber: '자동 가열 35°C',
        highlight: false,
        gradient: 'from-amber-500/10 via-transparent to-transparent',
        border: 'border-amber-500/20',
        glow: 'shadow-amber-500/10',
    },
    {
        id: 'p13',
        series: '6K Series',
        seriesColor: 'text-emerald-400',
        name: 'P13',
        tagline: '대형·효율 — 양산 환경 최적화',
        desc: '대형 빌드 볼륨과 효율적인 6K 해상도를 결합해 반복 양산 환경에 최적화. 비용 대비 최고의 생산성을 요구하는 현장을 위한 모델.',
        buildSize: '500 × 430 × 760 mm',
        resolution: '6K · 양산 최적',
        speed: '최대 60 mm/h',
        led: '91 units LED Matrix',
        power: '220–240 VAC · 350W',
        chamber: '자동 가열 35°C',
        highlight: false,
        gradient: 'from-emerald-500/10 via-transparent to-transparent',
        border: 'border-emerald-500/20',
        glow: 'shadow-emerald-500/10',
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
        color: 'text-primary',
        bg: 'bg-primary/10',
        border: 'border-primary/20',
    },
    {
        icon: Zap,
        title: '60 mm/h 공통 최대 속도',
        subtitle: '전 모델 동일 적용',
        desc: '전 모델 60 mm/h 최대 출력 속도로 효율적인 생산 프로덕션을 실현합니다.',
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
    },
    {
        icon: Thermometer,
        title: '챔버 온도 제어',
        subtitle: '에어 히팅 프린트 챔버',
        desc: '18~28℃ 환경에서 모델별 35~38℃ 내부 자동 가열로 일관된 출력 품질을 보장합니다.',
        color: 'text-rose-400',
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/20',
    },
    {
        icon: Shield,
        title: '전문 A/S 지원',
        subtitle: '기술 엔지니어 직접 지원',
        desc: '전문 엔지니어 기반 사후지원 및 기술 백업으로 장비 가동률을 최대화합니다.',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
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
    { name: '범용 레진', category: 'Standard', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30', desc: '프로토타입·교육·디자인 검증용 경제적 범용' },
    { name: '덴탈 레진', category: 'Dental', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30', desc: '치과 기공·의료 보조기기 전용 생체적합성' },
    { name: '주얼리 레진', category: 'Jewelry', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', desc: '주얼리·금속 캐스팅 마스터 패턴 전용' },
    { name: '산업용 레진', category: 'Engineering', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', desc: '고강도·내열·기능 부품 산업용 엔지니어링' },
    { name: 'Flexible 레진', category: 'Flexible', color: 'bg-violet-500/20 text-violet-300 border-violet-500/30', desc: '탄성·완충 특성이 필요한 유연 부품용' },
    { name: 'Tough 레진', category: 'Tough', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', desc: '충격·마모 저항이 요구되는 구조 부품용' },
];

/* ─────────────────────────────────────────────────────────────
   스펙 행 컴포넌트
───────────────────────────────────────────────────────────── */
function SpecRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between py-2.5 border-b border-white/5 last:border-0">
            <span className="text-xs text-muted-foreground font-medium shrink-0 w-28">{label}</span>
            <span className="text-xs text-foreground/90 text-right font-semibold">{value}</span>
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
        <main className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20 selection:text-primary">
            <Header />

            {/* ── Hero ─────────────────────────────────────── */}
            <section className="relative pt-32 pb-24 overflow-hidden">
                {/* 배경 그라디언트 */}
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/60 via-background/80 to-background pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.18),transparent)] pointer-events-none" />
                {/* 그리드 패턴 */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

                <div className="container mx-auto px-4 relative z-10 text-center">
                    {/* 배지 */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-8"
                    >
                        <Layers className="w-3.5 h-3.5" />
                        Professional Grade 3D Printer
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-black mb-4 tracking-tight"
                    >
                        P-Pro{' '}
                        <span className="bg-gradient-to-r from-primary via-indigo-400 to-violet-400 bg-clip-text text-transparent">
                            Series
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-lg md:text-xl text-muted-foreground mb-6 break-keep"
                    >
                        Technical Specifications &amp; Performance
                    </motion.p>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="text-sm text-muted-foreground/70 mb-10"
                    >
                        MSLA (Mask Stereolithography) · 405nm Industrial UV · 최대 60 mm/h · 레이어 25–150 μm
                    </motion.p>

                    {/* 스펙 배지 행 */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="flex flex-wrap justify-center gap-3 mb-12"
                    >
                        {[
                            { label: 'Technology', value: 'MSLA (Mask Stereolithography)' },
                            { label: 'Wavelength', value: '405 nm Industrial UV' },
                            { label: 'Max Speed', value: '60 mm/h' },
                            { label: 'Layer', value: '25 – 150 μm' },
                        ].map((b) => (
                            <span
                                key={b.label}
                                className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.04] text-sm"
                            >
                                <span className="text-primary font-bold text-xs">{b.label}</span>
                                <span className="text-foreground/80">{b.value}</span>
                            </span>
                        ))}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="flex flex-col sm:flex-row justify-center gap-4"
                    >
                        <Link href="/contact">
                            <Button className="h-12 px-8 rounded-xl bg-white text-black hover:bg-white/90 font-bold text-sm gap-2">
                                <Phone className="w-4 h-4" /> 무료 도입 상담
                            </Button>
                        </Link>
                        <Link href="/quote">
                            <Button variant="outline" className="h-12 px-8 rounded-xl font-bold text-sm gap-2 border-white/20 hover:bg-white/5">
                                견적 바로 받기 <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* ── 제품 라인업 ───────────────────────────────── */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-12"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-2">제품 라인업</h2>
                        <p className="text-sm text-muted-foreground">
                            * 사이즈 정보는 반올림된 수치일 수 있습니다. (W×D×H)
                        </p>
                    </motion.div>

                    {/* 탭 선택 */}
                    <div className="flex flex-wrap gap-2 mb-10">
                        {PRODUCTS.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setActiveProduct(p.id)}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border ${activeProduct === p.id
                                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25'
                                    : 'border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20 hover:bg-white/5'
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
                                className={`relative rounded-2xl border p-6 cursor-pointer transition-all duration-300 bg-gradient-to-br ${product.gradient} ${product.border}
                                    ${activeProduct === product.id
                                        ? `shadow-2xl ${product.glow} scale-[1.02]`
                                        : 'hover:scale-[1.01] hover:shadow-lg opacity-80 hover:opacity-100'
                                    }`}
                            >
                                {/* 추천 배지 */}
                                {product.highlight && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/30 whitespace-nowrap">
                                        <Star className="w-3 h-3 fill-white" /> 베스트셀러
                                    </span>
                                )}

                                <div className={`text-[11px] font-black uppercase tracking-widest mb-2 ${product.seriesColor}`}>
                                    {product.series}
                                </div>
                                <h3 className="text-2xl font-black mb-1">{product.name}</h3>
                                <p className="text-xs text-muted-foreground mb-5 break-keep leading-relaxed">
                                    {product.tagline}
                                </p>

                                {/* 스펙 */}
                                <div className="space-y-0">
                                    <SpecRow label="PRINTER SIZE" value={product.buildSize} />
                                    <SpecRow label="RESOLUTION" value={product.resolution} />
                                    <SpecRow label="MAX SPEED" value={product.speed} />
                                    <SpecRow label="CHAMBER" value={product.chamber} />
                                </div>

                                {activeProduct === product.id && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mt-4 pt-4 border-t border-white/10"
                                    >
                                        <p className="text-xs text-muted-foreground leading-relaxed break-keep">
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
            <section className="py-20 border-t border-white/5">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-10"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-3">
                            하드웨어 스펙{' '}
                            <span className="text-primary">— {active.name}</span>
                        </h2>
                        <p className="text-sm text-muted-foreground">카드를 클릭해 모델별 상세 스펙을 확인하세요.</p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {[
                            {
                                title: '빌드 사이즈', value: active.buildSize, icon: Layers,
                                color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20',
                            },
                            {
                                title: '해상도', value: active.resolution, icon: Cpu,
                                color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20',
                            },
                            {
                                title: '최대 속도', value: active.speed, icon: Zap,
                                color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20',
                            },
                            {
                                title: '챔버 온도', value: active.chamber, icon: Thermometer,
                                color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20',
                            },
                        ].map((spec, i) => (
                            <motion.div
                                key={spec.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.07 }}
                                className={`p-6 rounded-2xl border ${spec.border} bg-gradient-to-br from-white/[0.03] to-transparent`}
                            >
                                <div className={`w-10 h-10 rounded-xl ${spec.bg} flex items-center justify-center mb-4 ${spec.color}`}>
                                    <spec.icon className="w-5 h-5" />
                                </div>
                                <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                                    {spec.title}
                                </div>
                                <div className="text-base font-bold">{spec.value}</div>
                            </motion.div>
                        ))}
                    </div>

                    {/* 상세 스펙 테이블 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-8 grid md:grid-cols-2 gap-5"
                    >
                        <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                                <Thermometer className="w-4 h-4 text-rose-400" /> 온도 · 환경
                            </h3>
                            <div className="space-y-1">
                                <SpecRow label="환경 온도" value="18 – 28 °C (64 – 82 °F)" />
                                <SpecRow label="챔버 가열" value={active.chamber} />
                                <SpecRow label="공기 정화" value={active.led} />
                            </div>
                        </div>
                        <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-400" /> 전원 · 연결
                            </h3>
                            <div className="space-y-1">
                                <SpecRow label="전원" value={active.power} />
                                <SpecRow label="연결" value="USB 2.0" />
                                <SpecRow label="디스플레이" value='5.0" Touch Screen' />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── 핵심 기술 우위 ────────────────────────────── */}
            <section className="py-20 border-t border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(99,102,241,0.06),transparent)] pointer-events-none" />
                <div className="container mx-auto px-4 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-14"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">핵심 기술 우위</h2>
                        <p className="text-muted-foreground break-keep max-w-xl mx-auto">
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
                                className={`group p-6 rounded-2xl border ${feat.border} bg-gradient-to-br from-white/[0.03] to-transparent hover:from-white/[0.06] transition-all duration-300 hover:scale-[1.02]`}
                            >
                                <div className={`w-12 h-12 rounded-2xl ${feat.bg} flex items-center justify-center mb-5 ${feat.color} group-hover:scale-110 transition-transform`}>
                                    <feat.icon className="w-6 h-6" />
                                </div>
                                <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${feat.color}`}>
                                    {feat.subtitle}
                                </div>
                                <h3 className="text-base font-bold mb-3 leading-snug">{feat.title}</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed break-keep">{feat.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 호환 레진 소재 ────────────────────────────── */}
            <section className="py-20 border-t border-white/5">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-10"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-3">호환 레진 소재</h2>
                        <p className="text-muted-foreground text-sm">
                            405nm UV 광원 기반 — 산업·주얼리·덴탈 응용
                        </p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {RESINS.map((resin, i) => (
                            <motion.div
                                key={resin.name}
                                initial={{ opacity: 0, scale: 0.96 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.07 }}
                                className="flex items-start gap-4 p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                            >
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-black border shrink-0 ${resin.color}`}>
                                    {resin.category}
                                </span>
                                <div>
                                    <div className="font-bold text-sm mb-1">{resin.name}</div>
                                    <div className="text-xs text-muted-foreground break-keep">{resin.desc}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 제품 인증 현황 ────────────────────────────── */}
            <section className="py-20 border-t border-white/5">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            <span className="text-primary">(주)와우쓰리디</span> 제품인증현황
                        </h2>
                        <p className="text-muted-foreground break-keep max-w-xl mx-auto text-sm">
                            품질과 기술력을 입증하는 국가 공인 인증 및 특허를 보유하고 있습니다.
                        </p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {CERTIFICATIONS.map((cert, i) => (
                            <motion.div
                                key={cert.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08 }}
                                className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] text-center hover:bg-white/[0.05] transition-all hover:scale-[1.02]"
                            >
                                <div className="text-4xl mb-4">{cert.icon}</div>
                                <div className="flex items-center justify-center gap-1.5 mb-3">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <h3 className="font-bold text-sm">{cert.title}</h3>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed break-keep">{cert.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ──────────────────────────────────────── */}
            <section className="py-28 border-t border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(99,102,241,0.12),transparent)] pointer-events-none" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

                <div className="container mx-auto px-4 text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-8">
                            <FlaskConical className="w-3.5 h-3.5" />
                            데모 출력 &amp; 무료 도입 상담
                        </div>

                        <h2 className="text-3xl md:text-5xl font-black mb-6 break-keep">
                            용도에 맞는 P-Pro 모델과<br />
                            <span className="text-primary">레진을 1:1로 추천</span>해 드립니다.
                        </h2>
                        <p className="text-muted-foreground mb-10 break-keep max-w-lg mx-auto">
                            WOW3DHD · (주)와우쓰리디에 문의하세요.<br />
                            전문 엔지니어가 도입부터 운용까지 함께합니다.
                        </p>

                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link href="/contact">
                                <Button size="lg" className="h-14 px-10 rounded-xl bg-white text-black hover:bg-white/90 font-black text-base gap-2 shadow-2xl">
                                    <Phone className="w-5 h-5" /> 무료 상담 신청
                                </Button>
                            </Link>
                            <a
                                href="https://wow3dsw.co.kr/hardware/3d-printer/"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button size="lg" variant="outline" className="h-14 px-10 rounded-xl font-bold text-base gap-2 border-white/20 hover:bg-white/5">
                                    제조사 공식 사이트 <ExternalLink className="w-4 h-4" />
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
