'use client'

import { motion } from 'framer-motion'
import { BadgeCheck, BarChart3, Building2, ChevronRight, Globe, Handshake, MessageSquare, Rocket, ShieldCheck, Users, Zap } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

const BENEFITS = [
    {
        icon: <Rocket className="w-6 h-6" />,
        title: "하드웨어 독점 공급",
        description: "9K 및 16K 초고해상도 P-시리즈 Pro 라인업을 파트너사 전용가로 공급받으세요.",
        color: "from-blue-500 to-cyan-500"
    },
    {
        icon: <Zap className="w-6 h-6" />,
        title: "AI 자동견적 시스템 제공",
        description: "본사의 실시간 AI 견적 엔진을 대리점 웹사이트에 그대로 이식해 드립니다.",
        color: "from-amber-400 to-orange-500"
    },
    {
        icon: <BarChart3 className="w-6 h-6" />,
        title: "수익의 다각화",
        description: "장비 판매 마진은 물론, 전용 레진 소모품과 유지보수 서비스를 통한 지속적 수익 창출.",
        color: "from-emerald-400 to-teal-500"
    }
]

const FEATURES = [
    {
        title: "검증된 기술력",
        items: ["국내 최고 사양 16K 해상도", "±0.2mm급 정밀 제조 품질", "산업용 대형 출력 특화 모델"]
    },
    {
        title: "영업 자동화",
        items: ["24시간 무인 견적 대응", "고객 데이터 리드 제공", "본사 통합 주문 관리 시스템"]
    },
    {
        title: "전폭적인 지원",
        items: ["정기 기술 및 마케팅 교육", "카탈로그 및 홍보 샘플 지원", "A/S 부품 및 인력 백업"]
    }
]

export default function PartnershipPage() {
    return (
        <main className="min-h-screen bg-[#020617] text-slate-50 flex flex-col selection:bg-teal-500/30 overflow-hidden relative font-sans">
            <Header />

            {/* Premium Background System */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1e293b_0%,#020617_100%)]" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-[length:40px_40px] opacity-[0.05] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-teal-400/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-400/5 rounded-full blur-[140px] animate-pulse" />
            </div>

            <main className="relative z-10 w-full">
                {/* Hero Section */}
                <section className="relative pt-40 pb-20 overflow-hidden">
                    <div className="container mx-auto px-6 relative z-10">
                        <div className="max-w-4xl mx-auto text-center space-y-10">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-teal-400/10 border border-teal-400/20 text-[11px] font-black uppercase tracking-[0.3em] text-teal-400"
                            >
                                <Handshake className="w-4 h-4" />
                                Premium Partnership
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-5xl md:text-8xl font-black tracking-tight leading-[1] text-white"
                            >
                                하드웨어를 넘어, <br />
                                <span className="text-teal-400 shadow-teal-400/20 shadow-sm">비즈니스의 미래</span>를 <br />
                                선점하십시오.
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-lg md:text-xl text-white/40 max-w-2xl mx-auto font-bold leading-relaxed break-keep"
                            >
                                초고해상도 3D 프린터 라인업과 업계 유일의 AI 실시간 견적 엔진이 결합된
                                국내 최강의 지능형 제조 솔루션 파트너가 될 기회입니다.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex flex-wrap justify-center gap-4 pt-4"
                            >
                                <Link href="#contact">
                                    <Button size="lg" className="h-16 px-12 rounded-2xl bg-teal-400 text-slate-950 font-black uppercase tracking-widest gap-3 shadow-[0_0_30px_rgba(45,212,191,0.3)] hover:bg-teal-300 transition-all active:scale-95">
                                        파트너십 신청하기
                                        <ChevronRight className="w-5 h-5" />
                                    </Button>
                                </Link>
                                <Link href="/contact">
                                    <Button variant="ghost" size="lg" className="h-16 px-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 font-black text-white/50 uppercase tracking-widest gap-2 hover:text-white transition-all">
                                        제안서 요청
                                    </Button>
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Core Benefits */}
                <section className="py-24 relative overflow-hidden">
                    <div className="container mx-auto px-6">
                        <div className="grid md:grid-cols-3 gap-8">
                            {BENEFITS.map((benefit, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 24 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="p-10 rounded-[3rem] bg-white/[0.03] border border-white/10 hover:border-teal-400/50 transition-all group backdrop-blur-3xl relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                                        {benefit.icon}
                                    </div>
                                    <div className={`w-16 h-16 rounded-[1.5rem] bg-teal-400/10 border border-teal-400/20 flex items-center justify-center text-teal-400 mb-8 shadow-2xl group-hover:scale-110 transition-transform`}>
                                        {benefit.icon}
                                    </div>
                                    <h3 className="text-2xl font-black text-white mb-4 tracking-tight">{benefit.title}</h3>
                                    <p className="text-white/40 font-bold text-[15px] leading-relaxed break-keep">{benefit.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Edge Section - AI Quote System */}
                <section className="py-40 relative">
                    <div className="container mx-auto px-6">
                        <div className="grid lg:grid-cols-2 gap-20 items-center">
                            <div className="space-y-10">
                                <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-teal-400/10 border border-teal-400/20 text-[10px] font-black text-teal-400 uppercase tracking-widest">
                                    System Advantage
                                </div>
                                <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.1] tracking-tight">
                                    영업 사원 없는 <br />
                                    <span className="text-teal-400">지능형 24H 영업망</span>
                                </h2>
                                <p className="text-lg font-bold text-white/40 leading-relaxed break-keep">
                                    대리점주님께는 본사의 핵심 기술인 'AI 실시간 견적 엔진' 라이선스를 제공합니다. 고객은 대기 시간 없이 즉시 파일을 업로드하고 견적을 산출하며, 온라인 결제까지 원스톱으로 완료합니다.
                                </p>
                                <div className="space-y-5">
                                    {['무인화된 프리미엄 견적 상담 솔루션', '실시간 소모품 원가 분석 엔진 탑재', '고객 주문 데이터 클라우드 통합 관리'].map((t, i) => (
                                        <div key={i} className="flex items-center gap-4 group">
                                            <div className="w-6 h-6 rounded-full bg-teal-400/10 border border-teal-400/20 flex items-center justify-center group-hover:bg-teal-400/20 transition-all">
                                                <BadgeCheck className="w-4 h-4 text-teal-400" />
                                            </div>
                                            <span className="text-sm font-black text-white/60 group-hover:text-white transition-colors">{t}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="relative aspect-square md:aspect-video rounded-[3rem] bg-white/[0.02] border border-white/10 overflow-hidden shadow-2xl group transition-all duration-700 hover:border-teal-400/30">
                                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
                                <div className="absolute inset-0 bg-gradient-to-br from-teal-400/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center space-y-6">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-teal-400 blur-3xl opacity-20 animate-pulse" />
                                            <Zap className="w-24 h-24 text-teal-400 mx-auto relative z-10 animate-bounce" />
                                        </div>
                                        <p className="text-[10px] font-black font-mono text-teal-400/40 tracking-[0.3em] uppercase">AI QUOTE ENGINE V3.0 DEPLOYED</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Support Grid */}
                <section className="py-32 relative">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-20 space-y-4">
                            <h2 className="text-4xl md:text-5xl font-black text-white">성공을 위한 전폭적인 지원</h2>
                            <p className="text-white/40 font-bold">WOW3D 파트너십은 단순한 납품이 아닌 공동의 성장을 목표로 합니다.</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-16">
                            {FEATURES.map((feature, idx) => (
                                <div key={idx} className="space-y-8 p-10 rounded-[3rem] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group">
                                    <div className="h-1 bg-gradient-to-r from-teal-400 to-transparent w-20 rounded-full group-hover:w-32 transition-all duration-500" />
                                    <h3 className="text-2xl font-black text-white tracking-tight">{feature.title}</h3>
                                    <ul className="space-y-5">
                                        {feature.items.map((item, i) => (
                                            <li key={i} className="flex items-center gap-4 group/item">
                                                <div className="w-2 h-2 rounded-full bg-teal-400/20 group-hover/item:bg-teal-400 transition-colors" />
                                                <span className="text-white/40 font-bold text-[15px] group-hover/item:text-white/90 transition-colors">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Process Roadmap */}
                <section className="py-32 relative">
                    <div className="container mx-auto px-6">
                        <div className="max-w-xl mx-auto space-y-20">
                            <div className="text-center space-y-4">
                                <h2 className="text-3xl font-black text-white">파트너십 진행 절차</h2>
                                <div className="h-1.5 w-24 bg-teal-400 mx-auto rounded-full" />
                            </div>
                            {[
                                { step: "01", title: "온라인 신청 접수", desc: "문의 폼을 통해 기본 비즈니스 정보 작성" },
                                { step: "02", title: "심층 비즈니스 미팅", desc: "지역 권역 분석 및 예상 수익 시뮬레이션 공유" },
                                { step: "03", title: "계약 체결 및 마스터 교육", desc: "공식 파트너 권한 부여 및 시스템 운영 전문 교육" },
                                { step: "04", title: "지능형 시스템 런칭", desc: "대리점 전용 AI 쇼핑몰 구축 및 통합 마케팅 개시" }
                            ].map((p, i) => (
                                <div key={i} className="flex gap-10 relative items-start group">
                                    {i < 3 && <div className="absolute left-[31px] top-16 bottom-[-60px] w-px bg-white/5 group-hover:bg-teal-400/20 transition-colors" />}
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-white/[0.05] border border-white/10 flex items-center justify-center font-black text-teal-400 text-xl shrink-0 z-10 group-hover:scale-110 group-hover:bg-teal-400/10 group-hover:border-teal-400/20 transition-all shadow-2xl">
                                        {p.step}
                                    </div>
                                    <div className="space-y-3 pt-2">
                                        <h4 className="text-2xl font-black text-white tracking-tight group-hover:text-teal-400 transition-colors">{p.title}</h4>
                                        <p className="text-[15px] font-bold text-white/40 leading-relaxed break-keep">{p.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Final CTA / Contact Form */}
                <section id="contact" className="py-40 relative">
                    <div className="container mx-auto px-6">
                        <div className="max-w-4xl mx-auto rounded-[4rem] p-12 md:p-24 bg-gradient-to-br from-teal-400/10 via-transparent to-indigo-500/5 border border-white/10 backdrop-blur-3xl text-center space-y-12 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-teal-400/5 blur-[120px] rounded-full opacity-50 pointer-events-none" />
                            <div className="space-y-6 relative z-10">
                                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">
                                    지금 바로 <span className="text-teal-400">Wow3D 파트너</span>가 되세요
                                </h2>
                                <p className="text-xl font-bold text-white/40 max-w-xl mx-auto break-keep">신청해 주시면 전담 비즈니스 디렉터가 24시간 이내에 직접 안내 드립니다.</p>
                            </div>

                            <div className="relative z-10">
                                <Link href="/contact?category=partnership">
                                    <Button size="lg" className="h-20 px-16 rounded-[2rem] bg-teal-400 text-slate-950 hover:bg-teal-300 font-black text-2xl uppercase tracking-widest gap-4 shadow-[0_20px_50px_rgba(45,212,191,0.3)] transition-all active:scale-95 group/btn">
                                        <Handshake className="w-8 h-8 group-hover/btn:scale-110 transition-transform" />
                                        상담 신청 및 제안서 수령
                                    </Button>
                                </Link>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 relative z-10 border-t border-white/5">
                                {[
                                    { val: "24H", label: "Business Support" },
                                    { val: "±0.1mm", label: "Extreme Precision" },
                                    { val: "16K", label: "Max Resolution" },
                                    { val: "AI Quote", label: "Full License" }
                                ].map((stat, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="text-2xl font-black text-white">{stat.val}</div>
                                        <div className="text-[10px] text-teal-400/50 font-black uppercase tracking-widest">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </main>
    )
}
