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
        <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30">
            <Header />

            <main className="pt-20">
                {/* Hero Section */}
                <section className="relative py-24 md:py-32 overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_40%,rgba(59,130,246,0.1),transparent_50%)]" />

                    <div className="container mx-auto px-6 relative z-10">
                        <div className="max-w-4xl mx-auto text-center space-y-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-primary"
                            >
                                <Handshake className="w-3 h-3" />
                                Special Partnership Opportunity
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]"
                            >
                                하드웨어를 넘어, <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-400 to-blue-500">제조 비즈니스의 미래</span>를 <br />
                                독점하십시오.
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed"
                            >
                                프리미엄 3D 프린터 라인업과 업계 유일의 AI 자동견적 시스템이 결합된
                                국내 최강의 3D 제조 솔루션 파트너가 될 기회입니다.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex flex-wrap justify-center gap-4 pt-4"
                            >
                                <Link href="#contact">
                                    <Button size="lg" className="h-16 px-10 rounded-2xl bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest gap-2">
                                        대리점 신청하기
                                        <ChevronRight className="w-5 h-5" />
                                    </Button>
                                </Link>
                                <Link href="/contact">
                                    <Button variant="ghost" size="lg" className="h-16 px-10 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 font-bold uppercase tracking-widest gap-2">
                                        제안서 요청
                                    </Button>
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Core Benefits */}
                <section className="py-24 bg-white/[0.02] border-y border-white/5">
                    <div className="container mx-auto px-6">
                        <div className="grid md:grid-cols-3 gap-8">
                            {BENEFITS.map((benefit, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-primary/50 transition-all group"
                                >
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${benefit.color} flex items-center justify-center text-white mb-6 shadow-lg shadow-black/20 group-hover:scale-110 transition-transform`}>
                                        {benefit.icon}
                                    </div>
                                    <h3 className="text-xl font-bold mb-4">{benefit.title}</h3>
                                    <p className="text-white/50 text-sm leading-relaxed">{benefit.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Edge Section - AI Quote System */}
                <section className="py-32 relative">
                    <div className="container mx-auto px-6">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="space-y-8">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-widest">
                                    System Advantage
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black leading-tight">
                                    영업 사원 없는 <br />
                                    <span className="text-indigo-400">24시간 자동 영업망</span>
                                </h2>
                                <p className="text-lg text-white/50 leading-relaxed">
                                    대리점주님께는 본사의 핵심 무기인 'AI 실시간 견적 엔진'을 웹사이트에 그대로 탑재해 드립니다. 고객은 그저 파일을 업로드하고 견적을 확인하며, 주문까지 한 번에 완료합니다.
                                </p>
                                <div className="space-y-4">
                                    {['무인화된 견적 상담 솔루션', '실시간 원가 분석 엔진 탑재', '고객 주문 데이터 본사 연동'].map((t, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                                <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />
                                            </div>
                                            <span className="text-sm font-semibold text-white/80">{t}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="relative aspect-square md:aspect-video rounded-3xl bg-gradient-to-br from-slate-900 to-black border border-white/10 overflow-hidden shadow-2xl">
                                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {/* Placeholder for system UI illustration or image */}
                                    <div className="text-center space-y-4">
                                        <Zap className="w-20 h-20 text-primary mx-auto animate-pulse" />
                                        <p className="text-xs font-mono text-white/40">AI QUOTE ENGINE V2.0 ACTIVATED</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Support Grid */}
                <section className="py-24 bg-white/[0.02]">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-16 space-y-4">
                            <h2 className="text-3xl md:text-4xl font-black">성공을 위한 전폭적인 지원</h2>
                            <p className="text-white/40">WOW3D 파트너십은 단순한 납품이 아닌 공동의 성장을 목표로 합니다.</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-12">
                            {FEATURES.map((feature, idx) => (
                                <div key={idx} className="space-y-6">
                                    <div className="h-px bg-gradient-to-r from-primary/50 to-transparent w-20" />
                                    <h3 className="text-xl font-bold">{feature.title}</h3>
                                    <ul className="space-y-4">
                                        {feature.items.map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 group">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                                                <span className="text-white/60 text-sm group-hover:text-white transition-colors">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Process Roadmap */}
                <section className="py-32">
                    <div className="container mx-auto px-6">
                        <div className="max-w-xl mx-auto space-y-12">
                            <h2 className="text-3xl font-black text-center mb-16 underline decoration-primary/30 decoration-8 underline-offset-[12px]">파트너십 진행 절차</h2>
                            {[
                                { step: "01", title: "온라인 신청 접수", desc: "문의 폼을 통해 기본 정보 작성" },
                                { step: "02", title: "비즈니스 미팅", desc: "지역 상권 분석 및 수익 가이드 제공" },
                                { step: "03", title: "계약 체결 및 교육", desc: "공식 권한 부여 및 기술/운영 교육" },
                                { step: "04", title: "시스템 런칭", desc: "자동견적 쇼핑몰 구축 및 영업 개시" }
                            ].map((p, i) => (
                                <div key={i} className="flex gap-8 relative items-start">
                                    {i < 3 && <div className="absolute left-[23px] top-12 bottom-[-40px] w-px bg-white/10" />}
                                    <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center font-black text-primary shrink-0 z-10">
                                        {p.step}
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-lg font-bold">{p.title}</h4>
                                        <p className="text-sm text-white/40 leading-relaxed">{p.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Final CTA / Contact Form */}
                <section id="contact" className="py-32 border-t border-white/5 bg-[radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.1),transparent_40%)]">
                    <div className="container mx-auto px-6">
                        <div className="max-w-2xl mx-auto text-center space-y-10">
                            <div className="space-y-4">
                                <h2 className="text-4xl md:text-5xl font-black">지금 바로 파트너가 되세요</h2>
                                <p className="text-white/40">신청 글을 남겨주시면 담당자가 24시간 이내에 연락드립니다.</p>
                            </div>

                            <Link href="/contact?category=partnership">
                                <Button size="lg" className="h-20 px-16 rounded-3xl bg-primary text-white hover:bg-primary/90 font-black text-xl uppercase tracking-widest gap-3 shadow-2xl shadow-primary/20 group">
                                    <Handshake className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                    대리점 가입 상담 신청
                                </Button>
                            </Link>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12">
                                <div className="space-y-2">
                                    <div className="text-2xl font-black text-white">24H</div>
                                    <div className="text-[10px] text-white/30 uppercase tracking-widest">Support</div>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-2xl font-black text-white">±0.2mm</div>
                                    <div className="text-[10px] text-white/30 uppercase tracking-widest">Precision</div>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-2xl font-black text-white">16K</div>
                                    <div className="text-[10px] text-white/30 uppercase tracking-widest">Resolution</div>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-2xl font-black text-white">AI Engine</div>
                                    <div className="text-[10px] text-white/30 uppercase tracking-widest">Licensed</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}
