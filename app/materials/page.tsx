'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import { Printer, Droplets, Zap, ArrowRight, Box, Layers, Shield } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// FDM 소재
const FDM_MATERIALS = [
    {
        id: 'pla',
        name: 'PLA',
        nameKo: '폴리폴리락트산',
        color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30',
        accent: 'text-emerald-500',
        features: ['옥수수·사탕수수 등 식물 기반, 생분해·친환경', '수축·뒤틀림이 적어 인쇄가 쉽고 초보자에게 적합', '경량, 표면이 깨끗함', '내열·내충격은 ABS·PETG보다 낮음'],
        applications: ['시제품·디스플레이', '교육·졸업작품', '패키징·포장', '저부하 부품·인테리어'],
        methods: ['FDM'],
    },
    {
        id: 'abs',
        name: 'ABS',
        nameKo: '아크릴로니트릴-부타디엔-스티렌',
        color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30',
        accent: 'text-amber-500',
        features: ['내충격·내구성·내열성 우수', '연마·도장·접착·용접 등 후가공에 적합', '인쇄 시 냄새·수축에 주의, 환기 필요'],
        applications: ['케이스·하우징', '자동차·가전 부품', '조립·기능 시험', '툴링·지그'],
        methods: ['FDM'],
    },
    {
        id: 'petg',
        name: 'PETG',
        nameKo: '폴리에틸렌 테레프탈레이트(PET)에 글리콜을 첨가하여 내구성과 투명성, 가공성을 높인 열가소성 플라스틱',
        color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30',
        accent: 'text-blue-500',
        features: ['PLA와 ABS의 장점을 겸비, 강성·내충격·내열', '투명·반투명 제형 가능', '식품·의료 접촉 등급 제품 존재', '습기 관리 필요'],
        applications: ['기능 부품·보호 케이스', '의료·식품 관련 구조물', '야외·내후 용도', '투명 덮개·창'],
        methods: ['FDM'],
    },
    {
        id: 'tpu',
        name: 'TPU',
        nameKo: '열가소성 폴리우레탄',
        color: 'from-pink-500/20 to-rose-500/10 border-pink-500/30',
        accent: 'text-pink-500',
        features: ['고무처럼 유연·탄성, 셔어 A 수십~90대', '내마모·내오일·충격 흡수', '인쇄 시 인피드·설정 신경 써야 함'],
        applications: ['그립·부싱·갸스켓', '실링·튜브', '웨어러블·보호대', '충격 완화 패드'],
        methods: ['FDM'],
    },
];

// 레진 소재 (SLA·DLP 공통)
const RESIN_MATERIALS = [
    {
        id: 'standard',
        name: 'Standard',
        nameKo: '표준 레진',
        color: 'from-violet-500/20 to-purple-500/10 border-violet-500/30',
        accent: 'text-violet-500',
        features: ['매끄러운 표면·뛰어난 디테일', '다양한 색상, 비교적 경제적', '내충격·강도는 Tough·엔지니어링 계열보다 낮음'],
        applications: ['시각 프로토타입·디자인 검증', '보석·패션 악세서리', '마스터·실리콘 몰드 원형', '디오라마·피규어'],
        methods: ['SLA', 'DLP'],
    },
    {
        id: 'tough',
        name: 'Tough',
        nameKo: '고강도 레진',
        color: 'from-slate-500/20 to-zinc-500/10 border-slate-500/30',
        accent: 'text-slate-300',
        features: ['내충격·인장 강도 우수, 기능 시험 용이', '나사·체결·조립에 적합', 'Standard보다 단가·비중 높음'],
        applications: ['장착·기능 테스트', '케이스·하우징', '툴링·지그', '소량 기능 부품'],
        methods: ['SLA', 'DLP'],
    },
    {
        id: 'clear',
        name: 'Clear',
        nameKo: '투명 레진',
        color: 'from-cyan-500/20 to-sky-500/10 border-cyan-500/30',
        accent: 'text-cyan-400',
        features: ['높은 투명도·시인성', '연마·코팅 후 유리-like 투명도', 'UV·열에 따라 변색 가능성'],
        applications: ['등화·렌즈 덮개', '유리·창 대체', '시각 검사·관측 창', '의료·실험 장비'],
        methods: ['SLA', 'DLP'],
    },
    {
        id: 'flexible',
        name: 'Flexible',
        nameKo: '연성 레진',
        color: 'from-lime-500/20 to-green-500/10 border-lime-500/30',
        accent: 'text-lime-400',
        features: ['고무에 가까운 인성·변형', '캐치·그립·압입에 적합', '경화·보관 조건에 따라 경도 차이'],
        applications: ['실리콘 몰드·프레스 패드', '그립·케이스 내삽', '웨어러블·보호대', '밀봉·완충'],
        methods: ['SLA', 'DLP'],
    },
];

export default function MaterialsPage() {
    return (
        <main className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20 selection:text-primary">
            <Header />

            {/* Hero */}
            <section className="pt-32 pb-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="container mx-auto px-4 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-3xl mx-auto"
                    >
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 word-keep-all">
                            소재 <span className="text-primary">살펴보기</span>
                        </h1>
                        <p className="text-xl text-muted-foreground break-keep">
                            각 소재의 특징·적용 분야를 확인하고, 출력방식(FDM, SLA, DLP)별로 사용 가능한 소재를 선택하세요.
                        </p>
                        <Link href="/materials/safety" className="inline-flex items-center gap-2 mt-6 text-sm font-medium text-amber-500 hover:text-amber-400 transition-colors">
                            <Shield className="w-4 h-4" />
                            소재 안전 정보
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* 출력방식별 사용 가능한 소재 요약 */}
            <section className="py-12 pb-16">
                <div className="container mx-auto px-4 max-w-5xl">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-2xl font-bold mb-8 flex items-center gap-3"
                    >
                        <Layers className="w-7 h-7 text-primary" />
                        출력방식별 사용 가능한 소재
                    </motion.h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="p-6 rounded-2xl border bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                                    <Printer className="w-5 h-5" />
                                </div>
                                <span className="font-bold">FDM</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">필라멘트 적층 방식</p>
                            <div className="flex flex-wrap gap-2">
                                {['PLA', 'ABS', 'PETG', 'TPU'].map((m) => (
                                    <span key={m} className="px-2.5 py-1 rounded-lg bg-background/80 text-sm font-medium">
                                        {m}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="p-6 rounded-2xl border bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/20"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
                                    <Droplets className="w-5 h-5" />
                                </div>
                                <span className="font-bold">SLA</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">광조형 레진</p>
                            <div className="flex flex-wrap gap-2">
                                {['Standard', 'Tough', 'Clear', 'Flexible'].map((m) => (
                                    <span key={m} className="px-2.5 py-1 rounded-lg bg-background/80 text-sm font-medium">
                                        {m}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="p-6 rounded-2xl border bg-gradient-to-br from-purple-500/10 to-violet-500/5 border-purple-500/20"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-500">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <span className="font-bold">DLP</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">디지털 광조형 레진</p>
                            <div className="flex flex-wrap gap-2">
                                {['Standard', 'Tough', 'Clear', 'Flexible'].map((m) => (
                                    <span key={m} className="px-2.5 py-1 rounded-lg bg-background/80 text-sm font-medium">
                                        {m}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* FDM 소재 상세 */}
            <section className="py-12 pb-24">
                <div className="container mx-auto px-4 max-w-5xl">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-2xl font-bold mb-8 flex items-center gap-3"
                    >
                        <Printer className="w-7 h-7 text-amber-500" />
                        FDM 소재
                    </motion.h2>
                    <div className="space-y-8">
                        {FDM_MATERIALS.map((m, i) => (
                            <motion.article
                                key={m.id}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.06 }}
                                className={`p-8 rounded-3xl border bg-gradient-to-br ${m.color}`}
                            >
                                <div className="flex flex-wrap items-center gap-3 mb-6">
                                    <div className={`w-12 h-12 rounded-2xl bg-background/80 flex items-center justify-center ${m.accent}`}>
                                        <Box className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">{m.name}</h3>
                                        <p className="text-sm text-muted-foreground">{m.nameKo}</p>
                                    </div>
                                    <span className="ml-auto px-3 py-1 rounded-full bg-amber-500/20 text-amber-500 text-xs font-bold">
                                        FDM
                                    </span>
                                </div>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div>
                                        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">특징</h4>
                                        <ul className="space-y-2 text-sm">
                                            {m.features.map((f) => (
                                                <li key={f} className="flex items-start gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-2 shrink-0" />
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">적용</h4>
                                        <ul className="space-y-2 text-sm">
                                            {m.applications.map((a) => (
                                                <li key={a} className="flex items-start gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-2 shrink-0" />
                                                    {a}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                </div>
            </section>

            {/* 레진 소재 상세 (SLA·DLP) */}
            <section className="py-12 pb-24">
                <div className="container mx-auto px-4 max-w-5xl">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-2xl font-bold mb-8 flex items-center gap-3"
                    >
                        <Droplets className="w-7 h-7 text-blue-500" />
                        레진 소재 (SLA · DLP)
                    </motion.h2>
                    <div className="space-y-8">
                        {RESIN_MATERIALS.map((m, i) => (
                            <motion.article
                                key={m.id}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.06 }}
                                className={`p-8 rounded-3xl border bg-gradient-to-br ${m.color}`}
                            >
                                <div className="flex flex-wrap items-center gap-3 mb-6">
                                    <div className={`w-12 h-12 rounded-2xl bg-background/80 flex items-center justify-center ${m.accent}`}>
                                        <Box className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">{m.name}</h3>
                                        <p className="text-sm text-muted-foreground">{m.nameKo}</p>
                                    </div>
                                    <div className="ml-auto flex gap-2">
                                        <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">SLA</span>
                                        <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold">DLP</span>
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div>
                                        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">특징</h4>
                                        <ul className="space-y-2 text-sm">
                                            {m.features.map((f) => (
                                                <li key={f} className="flex items-start gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-2 shrink-0" />
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">적용</h4>
                                        <ul className="space-y-2 text-sm">
                                            {m.applications.map((a) => (
                                                <li key={a} className="flex items-start gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-2 shrink-0" />
                                                    {a}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 border-t border-border">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-muted-foreground mb-6 break-keep">
                        소재를 선택했다면, 파일을 업로드하고 견적을 받아보세요.
                    </p>
                    <Link href="/quote">
                        <Button size="lg" className="h-14 px-10 text-lg rounded-full gap-2">
                            견적 받기 <ArrowRight className="w-5 h-5" />
                        </Button>
                    </Link>
                </div>
            </section>

            <Footer />
        </main>
    );
}
