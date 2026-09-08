'use client'

import { motion } from 'framer-motion'
import { BadgeCheck, BarChart3, ChevronRight, Handshake, Rocket, Store, Zap } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

type Benefit = { title: string; description: string }
type Feature = { title: string; items: string[] }
type ProcessStep = { step: string; title: string; desc: string }

const BENEFIT_ICONS = [Rocket, Zap, BarChart3] as const

const STATS = [
    { val: '24H', label: 'Business Support' },
    { val: '±0.1mm', label: 'Extreme Precision' },
    { val: '16K', label: 'Max Resolution' },
    { val: 'AI Quote', label: 'Full License' },
] as const

export default function PartnershipPage() {
    const t = useTranslations('Partnership')
    const benefits = t.raw('benefits') as Benefit[]
    const features = t.raw('features') as Feature[]
    const processSteps = t.raw('process') as ProcessStep[]
    const edgeItems = t.raw('edgeItems') as string[]

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
                                {t('eyebrow')}
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-5xl md:text-8xl font-black tracking-tight leading-[1] text-white"
                            >
                                {t('heroTitleBefore')} <br />
                                <span className="text-teal-400 shadow-teal-400/20 shadow-sm">{t('heroTitleAccent')}</span>
                                {t('heroTitleAfter')} <br />
                                {t('heroTitleEnd')}
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-lg md:text-xl text-white/40 max-w-2xl mx-auto font-bold leading-relaxed break-keep"
                            >
                                {t('heroSubtitle')}
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex flex-wrap justify-center gap-4 pt-4"
                            >
                                <Link href="#contact">
                                    <Button size="lg" className="h-16 px-12 rounded-2xl bg-teal-400 text-slate-950 font-black uppercase tracking-widest gap-3 shadow-[0_0_30px_rgba(45,212,191,0.3)] hover:bg-teal-300 transition-all active:scale-95">
                                        {t('applyCta')}
                                        <ChevronRight className="w-5 h-5" />
                                    </Button>
                                </Link>
                                <Link href="/contact">
                                    <Button variant="ghost" size="lg" className="h-16 px-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 font-black text-white/50 uppercase tracking-widest gap-2 hover:text-white transition-all">
                                        {t('proposalCta')}
                                    </Button>
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Smart Store tech supply banner */}
                <section className="pb-8 relative">
                    <div className="container mx-auto px-6">
                        <Link
                            href="/partnership/smart-store"
                            className="group mx-auto flex max-w-4xl flex-col gap-4 rounded-[2rem] border border-teal-400/25 bg-gradient-to-r from-teal-400/10 via-white/[0.03] to-indigo-400/10 p-6 md:flex-row md:items-center md:justify-between md:p-8 transition-all hover:border-teal-400/50 hover:bg-teal-400/[0.08]"
                        >
                            <div className="flex items-start gap-4 md:items-center">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-teal-400/30 bg-teal-400/10 text-teal-400">
                                    <Store className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-400">
                                        {t('smartStoreEyebrow')}
                                    </p>
                                    <h2 className="mt-1 text-xl font-black tracking-tight text-white md:text-2xl">
                                        {t('smartStoreTitle')}
                                    </h2>
                                    <p className="mt-2 text-sm font-bold leading-relaxed text-white/40 break-keep">
                                        {t('smartStoreDesc')}
                                    </p>
                                </div>
                            </div>
                            <span className="inline-flex items-center gap-2 self-start rounded-xl bg-teal-400 px-5 py-3 text-sm font-black text-slate-950 transition-transform group-hover:translate-x-1 md:self-center">
                                {t('smartStoreMore')}
                                <ChevronRight className="h-4 w-4" />
                            </span>
                        </Link>
                    </div>
                </section>

                {/* Core Benefits */}
                <section className="py-24 relative overflow-hidden">
                    <div className="container mx-auto px-6">
                        <div className="grid md:grid-cols-3 gap-8">
                            {benefits.map((benefit, idx) => {
                                const Icon = BENEFIT_ICONS[idx] ?? Rocket
                                return (
                                    <motion.div
                                        key={benefit.title}
                                        initial={{ opacity: 0, y: 24 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="p-10 rounded-[3rem] bg-white/[0.03] border border-white/10 hover:border-teal-400/50 transition-all group backdrop-blur-3xl relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-teal-400/10 border border-teal-400/20 flex items-center justify-center text-teal-400 mb-8 shadow-2xl group-hover:scale-110 transition-transform">
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-2xl font-black text-white mb-4 tracking-tight">{benefit.title}</h3>
                                        <p className="text-white/40 font-bold text-[15px] leading-relaxed break-keep">{benefit.description}</p>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>
                </section>

                {/* Edge Section - AI Quote System */}
                <section className="py-40 relative">
                    <div className="container mx-auto px-6">
                        <div className="grid lg:grid-cols-2 gap-20 items-center">
                            <div className="space-y-10">
                                <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-teal-400/10 border border-teal-400/20 text-[10px] font-black text-teal-400 uppercase tracking-widest">
                                    {t('edgeEyebrow')}
                                </div>
                                <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.1] tracking-tight">
                                    {t('edgeTitleBefore')} <br />
                                    <span className="text-teal-400">{t('edgeTitleAccent')}</span>
                                </h2>
                                <p className="text-lg font-bold text-white/40 leading-relaxed break-keep">
                                    {t('edgeDesc')}
                                </p>
                                <div className="space-y-5">
                                    {edgeItems.map((point) => (
                                        <div key={point} className="flex items-center gap-4 group">
                                            <div className="w-6 h-6 rounded-full bg-teal-400/10 border border-teal-400/20 flex items-center justify-center group-hover:bg-teal-400/20 transition-all">
                                                <BadgeCheck className="w-4 h-4 text-teal-400" />
                                            </div>
                                            <span className="text-sm font-black text-white/60 group-hover:text-white transition-colors">{point}</span>
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
                                        <p className="text-[10px] font-black font-mono text-teal-400/40 tracking-[0.3em] uppercase">
                                            AI QUOTE ENGINE V3.0 DEPLOYED
                                        </p>
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
                            <h2 className="text-4xl md:text-5xl font-black text-white">{t('supportTitle')}</h2>
                            <p className="text-white/40 font-bold">{t('supportSubtitle')}</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-16">
                            {features.map((feature) => (
                                <div key={feature.title} className="space-y-8 p-10 rounded-[3rem] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group">
                                    <div className="h-1 bg-gradient-to-r from-teal-400 to-transparent w-20 rounded-full group-hover:w-32 transition-all duration-500" />
                                    <h3 className="text-2xl font-black text-white tracking-tight">{feature.title}</h3>
                                    <ul className="space-y-5">
                                        {feature.items.map((item) => (
                                            <li key={item} className="flex items-center gap-4 group/item">
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
                                <h2 className="text-3xl font-black text-white">{t('processTitle')}</h2>
                                <div className="h-1.5 w-24 bg-teal-400 mx-auto rounded-full" />
                            </div>
                            {processSteps.map((p, i) => (
                                <div key={p.step} className="flex gap-10 relative items-start group">
                                    {i < processSteps.length - 1 && <div className="absolute left-[31px] top-16 bottom-[-60px] w-px bg-white/5 group-hover:bg-teal-400/20 transition-colors" />}
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
                                    {t('ctaTitleBefore')} <span className="text-teal-400">{t('ctaTitleAccent')}</span>{t('ctaTitleAfter')}
                                </h2>
                                <p className="text-xl font-bold text-white/40 max-w-xl mx-auto break-keep">{t('ctaSubtitle')}</p>
                            </div>

                            <div className="relative z-10">
                                <Link href={{ pathname: '/contact', query: { category: 'partnership' } }}>
                                    <Button size="lg" className="h-20 px-16 rounded-[2rem] bg-teal-400 text-slate-950 hover:bg-teal-300 font-black text-2xl uppercase tracking-widest gap-4 shadow-[0_20px_50px_rgba(45,212,191,0.3)] transition-all active:scale-95 group/btn">
                                        <Handshake className="w-8 h-8 group-hover/btn:scale-110 transition-transform" />
                                        {t('ctaButton')}
                                    </Button>
                                </Link>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 relative z-10 border-t border-white/5">
                                {STATS.map((stat) => (
                                    <div key={stat.label} className="space-y-2">
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
