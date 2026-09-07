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
        <main className="min-h-screen bg-[#020617] text-slate-50 flex flex-col selection:bg-teal-500/30 overflow-hidden relative font-sans">
            <Header />

            {/* Premium Background System */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1e293b_0%,#020617_100%)]" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-[length:40px_40px] opacity-[0.05] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-teal-500/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/5 rounded-full blur-[140px] animate-pulse" />
            </div>

            {/* Hero */}
            <section className="pt-40 pb-20 relative z-10">
                <div className="container mx-auto px-6 relative">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-4xl mx-auto space-y-6"
                    >
                        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-teal-400/10 border border-teal-400/20 text-[11px] font-black uppercase tracking-[0.3em] text-teal-400 mb-2">
                            Material Intelligence
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[1.1] shadow-text">
                            소재 <span className="text-teal-400">살펴보기</span>
                        </h1>
                        <p className="text-lg md:text-xl font-bold text-white/40 leading-relaxed break-keep max-w-2xl mx-auto">
                            PLA, ABS, PETG 차이는 무엇인지, 어떤 소재가 시제품과 기능 부품에 적합한지,
                            레진과 필라멘트는 어떤 기준으로 고르면 되는지 한 번에 확인할 수 있습니다.
                        </p>
                        <div className="flex flex-wrap justify-center gap-3 pt-2">
                            <Link href="/guides/pla-vs-abs-vs-petg" className="group flex items-center gap-3 px-6 py-3 rounded-2xl bg-teal-400/10 border border-teal-400/20 text-xs font-black text-teal-300 uppercase tracking-widest hover:text-white hover:bg-teal-400/15 transition-all">
                                PLA / ABS / PETG Guide
                            </Link>
                            <Link href="/guides/best-materials-for-3d-printing-prototypes" className="group flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs font-black text-white/50 uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all">
                                Prototype Material Guide
                            </Link>
                            <Link href="/materials/safety" className="group flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs font-black text-white/40 uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all">
                                <Shield className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
                                Material Safety Data
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 출력방식별 사용 가능한 소재 요약 */}
            <section className="py-20 relative z-10">
                <div className="container mx-auto px-6">
                    <motion.h2
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="text-2xl font-black text-white/90 mb-12 flex items-center gap-4 px-2"
                    >
                        <Layers className="w-8 h-8 text-teal-400" />
                        출력방식별 핵심 소재
                    </motion.h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { title: 'FDM', desc: '고강도 실용 부품', color: 'teal', icon: <Printer className="w-5 h-5" />, items: ['PLA', 'ABS', 'PETG', 'TPU'] },
                            { title: 'SLA', desc: '초정밀 매끄러운 표면', color: 'indigo', icon: <Droplets className="w-5 h-5" />, items: ['Standard', 'Tough', 'Clear', 'Flexible'] },
                            { title: 'DLP', desc: '복잡한 디테일 구현', color: 'purple', icon: <Zap className="w-5 h-5" />, items: ['Standard', 'Tough', 'Clear', 'Flexible'] }
                        ].map((m, idx) => (
                            <motion.div
                                key={m.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all group backdrop-blur-xl relative overflow-hidden"
                            >
                                <div className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${m.color === 'teal' ? 'from-teal-400' : m.color === 'indigo' ? 'from-indigo-400' : 'from-purple-400'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                                <div className="flex items-center gap-4 mb-6">
                                    <div className={`w-12 h-12 rounded-2xl bg-${m.color}-400/10 border border-${m.color}-400/20 flex items-center justify-center text-${m.color}-400 group-hover:scale-110 transition-transform`}>
                                        {m.icon}
                                    </div>
                                    <div>
                                        <span className="text-xl font-black text-white">{m.title}</span>
                                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-0.5">{m.desc}</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {m.items.map((item) => (
                                        <span key={item} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[11px] font-bold text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FDM 소재 상세 */}
            <section className="py-20 relative z-10">
                <div className="container mx-auto px-6">
                    <div className="mb-10 rounded-[2rem] border border-teal-400/15 bg-teal-400/5 p-6 md:p-8">
                        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-400 mb-3">Popular Guide</p>
                        <h2 className="text-2xl md:text-3xl font-black text-white mb-3">PLA, ABS, PETG 중 어떤 소재가 맞을까요?</h2>
                        <p className="text-white/60 break-keep leading-relaxed mb-5">
                            FDM 소재 선택에서 가장 많이 비교되는 세 가지 필라멘트를 강도, 내열성, 후가공성, 추천 용도 기준으로 따로 정리했습니다.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/guides/pla-vs-abs-vs-petg" className="inline-flex items-center gap-2 text-sm font-black text-teal-300 hover:text-white transition-colors">
                                비교 가이드 자세히 보기 <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link href="/guides/best-materials-for-3d-printed-housings-and-cases" className="inline-flex items-center gap-2 text-sm font-black text-amber-300 hover:text-white transition-colors">
                                하우징·케이스용 소재 추천 보기 <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link href="/guides/best-materials-for-heat-resistant-and-impact-resistant-parts" className="inline-flex items-center gap-2 text-sm font-black text-rose-300 hover:text-white transition-colors">
                                내열·내충격 부품용 소재 추천 보기 <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                    <motion.h2
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="text-2xl font-black text-white/90 mb-12 flex items-center gap-4 px-2"
                    >
                        <div className="w-2 h-8 bg-teal-400 rounded-full" />
                        FDM Materials
                    </motion.h2>
                    <div className="space-y-8">
                        {FDM_MATERIALS.map((m, i) => (
                            <motion.article
                                key={m.id}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05 }}
                                className="p-8 md:p-10 rounded-[3rem] bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.04] transition-all backdrop-blur-3xl relative group overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Box className="w-32 h-32 text-white" />
                                </div>
                                <div className="flex flex-wrap items-center gap-5 mb-10">
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl">
                                        <Box className="w-8 h-8 text-teal-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white tracking-tight">{m.name}</h3>
                                        <p className="text-[13px] font-bold text-white/30 tracking-tight">{m.nameKo}</p>
                                    </div>
                                    <div className="ml-auto px-5 py-2 rounded-full bg-teal-400/10 border border-teal-400/20 text-teal-400 text-[10px] font-black uppercase tracking-widest">
                                        FDM Logic
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-12 relative z-10">
                                    <div className="space-y-4">
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-teal-400/80 mb-2">Mechanical Propertis</h4>
                                        <ul className="space-y-3">
                                            {m.features.map((f) => (
                                                <li key={f} className="flex items-start gap-3 group/item">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400/40 mt-1.5 group-hover/item:scale-125 transition-transform" />
                                                    <span className="text-[14px] font-bold text-white/50 group-hover/item:text-white/80 transition-colors leading-relaxed">{f}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-teal-400/80 mb-2">Practical Applications</h4>
                                        <ul className="space-y-3">
                                            {m.applications.map((a) => (
                                                <li key={a} className="flex items-start gap-3 group/item">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-white/20 mt-1.5 group-hover/item:bg-teal-400/60 transition-colors" />
                                                    <span className="text-[14px] font-bold text-white/50 group-hover/item:text-white/80 transition-colors leading-relaxed">{a}</span>
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
            <section className="py-20 relative z-10">
                <div className="container mx-auto px-6">
                    <div className="mb-10 rounded-[2rem] border border-indigo-400/15 bg-indigo-400/5 p-6 md:p-8">
                        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-300 mb-3">Popular Guide</p>
                        <h2 className="text-2xl md:text-3xl font-black text-white mb-3">Standard, Tough, Clear, Flexible 레진은 어떻게 다를까요?</h2>
                        <p className="text-white/60 break-keep leading-relaxed mb-5">
                            외관 시제품, 기능 테스트, 투명 부품, 유연 부품에 어떤 레진이 적합한지 검색형 질문 기준으로 따로 정리했습니다.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/guides/standard-vs-tough-vs-clear-vs-flexible-resin" className="inline-flex items-center gap-2 text-sm font-black text-indigo-300 hover:text-white transition-colors">
                                레진 비교 가이드 자세히 보기 <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link href="/guides/best-materials-for-transparent-3d-printed-parts" className="inline-flex items-center gap-2 text-sm font-black text-cyan-300 hover:text-white transition-colors">
                                투명 부품용 소재 추천 보기 <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link href="/guides/best-materials-for-miniatures-and-figurines" className="inline-flex items-center gap-2 text-sm font-black text-fuchsia-300 hover:text-white transition-colors">
                                정밀 모형·피규어용 소재 추천 보기 <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                    <motion.h2
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="text-2xl font-black text-white/90 mb-12 flex items-center gap-4 px-2"
                    >
                        <div className="w-2 h-8 bg-indigo-500 rounded-full" />
                        Resin Materials (SLA · DLP)
                    </motion.h2>
                    <div className="space-y-8">
                        {RESIN_MATERIALS.map((m, i) => (
                            <motion.article
                                key={m.id}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05 }}
                                className="p-8 md:p-10 rounded-[3rem] bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.04] transition-all backdrop-blur-3xl relative group overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Droplets className="w-32 h-32 text-white" />
                                </div>
                                <div className="flex flex-wrap items-center gap-5 mb-10">
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center shadow-2xl">
                                        <Droplets className="w-8 h-8 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white tracking-tight">{m.name}</h3>
                                        <p className="text-[13px] font-bold text-white/30 tracking-tight">{m.nameKo}</p>
                                    </div>
                                    <div className="ml-auto flex gap-2">
                                        <span className="px-5 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">SLA</span>
                                        <span className="px-5 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest">DLP</span>
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-12 relative z-10">
                                    <div className="space-y-4">
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-400/80 mb-2">Mechanical Propertis</h4>
                                        <ul className="space-y-3">
                                            {m.features.map((f) => (
                                                <li key={f} className="flex items-start gap-3 group/item">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/40 mt-1.5 group-hover/item:scale-125 transition-transform" />
                                                    <span className="text-[14px] font-bold text-white/50 group-hover/item:text-white/80 transition-colors leading-relaxed">{f}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-400/80 mb-2">Practical Applications</h4>
                                        <ul className="space-y-3">
                                            {m.applications.map((a) => (
                                                <li key={a} className="flex items-start gap-3 group/item">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-white/20 mt-1.5 group-hover/item:bg-indigo-400/60 transition-colors" />
                                                    <span className="text-[14px] font-bold text-white/50 group-hover/item:text-white/80 transition-colors leading-relaxed">{a}</span>
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
            <section className="py-32 relative z-10">
                <div className="container mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="max-w-4xl mx-auto p-12 md:p-20 rounded-[4rem] bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 backdrop-blur-3xl space-y-8 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-teal-400/5 blur-3xl rounded-full opacity-30 pointer-events-none" />
                        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                            최적의 소재를 찾으셨나요?<br />
                            <span className="text-teal-400">지능형 견적</span>을 시작하세요.
                        </h2>
                        <p className="text-lg font-bold text-white/40 max-w-xl mx-auto break-keep">
                            복잡한 계산 없이 파일을 업로드하는 것만으로 즉시 정밀한 견적을 산출합니다.
                        </p>
                        <div className="pt-4">
                            <Link href="/quote">
                                <Button size="lg" className="h-16 px-12 text-lg rounded-2xl bg-teal-400 text-slate-950 font-black hover:bg-teal-300 gap-3 shadow-[0_0_30px_rgba(45,212,191,0.3)] transition-all active:scale-95">
                                    견적 시작하기 <ArrowRight className="w-6 h-6" />
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
