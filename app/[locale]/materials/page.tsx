'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import { Printer, Droplets, Zap, ArrowRight, Box, Layers, Shield } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

type MaterialMeta = {
    id: 'pla' | 'abs' | 'petg' | 'tpu' | 'standard' | 'tough' | 'clear' | 'flexible';
    name: string;
    methods: string[];
};

const FDM_META: MaterialMeta[] = [
    { id: 'pla', name: 'PLA', methods: ['FDM'] },
    { id: 'abs', name: 'ABS', methods: ['FDM'] },
    { id: 'petg', name: 'PETG', methods: ['FDM'] },
    { id: 'tpu', name: 'TPU', methods: ['FDM'] },
];

const RESIN_META: MaterialMeta[] = [
    { id: 'standard', name: 'Standard', methods: ['SLA', 'DLP'] },
    { id: 'tough', name: 'Tough', methods: ['SLA', 'DLP'] },
    { id: 'clear', name: 'Clear', methods: ['SLA', 'DLP'] },
    { id: 'flexible', name: 'Flexible', methods: ['SLA', 'DLP'] },
];

export default function MaterialsPage() {
    const t = useTranslations('Materials');

    const fdmMaterials = FDM_META.map((m) => ({
        ...m,
        nameKo: t(`materials.${m.id}.nameKo`),
        features: t.raw(`materials.${m.id}.features`) as string[],
        applications: t.raw(`materials.${m.id}.applications`) as string[],
    }));

    const resinMaterials = RESIN_META.map((m) => ({
        ...m,
        nameKo: t(`materials.${m.id}.nameKo`),
        features: t.raw(`materials.${m.id}.features`) as string[],
        applications: t.raw(`materials.${m.id}.applications`) as string[],
    }));

    const methodCards = [
        {
            title: 'FDM',
            desc: t('byMethod.fdm'),
            color: 'teal',
            icon: <Printer className="w-5 h-5" />,
            items: ['PLA', 'ABS', 'PETG', 'TPU'],
        },
        {
            title: 'SLA',
            desc: t('byMethod.sla'),
            color: 'indigo',
            icon: <Droplets className="w-5 h-5" />,
            items: ['Standard', 'Tough', 'Clear', 'Flexible'],
        },
        {
            title: 'DLP',
            desc: t('byMethod.dlp'),
            color: 'purple',
            icon: <Zap className="w-5 h-5" />,
            items: ['Standard', 'Tough', 'Clear', 'Flexible'],
        },
    ];

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
                            {t('hero.title')}{' '}
                            <span className="text-teal-400">{t('hero.titleAccent')}</span>
                        </h1>
                        <p className="text-lg md:text-xl font-bold text-white/40 leading-relaxed break-keep max-w-2xl mx-auto">
                            {t('hero.subtitle')}
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
                        {t('byMethod.title')}
                    </motion.h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {methodCards.map((m, idx) => (
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
                        <h2 className="text-2xl md:text-3xl font-black text-white mb-3">{t('fdmGuide.title')}</h2>
                        <p className="text-white/60 break-keep leading-relaxed mb-5">
                            {t('fdmGuide.desc')}
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/guides/pla-vs-abs-vs-petg" className="inline-flex items-center gap-2 text-sm font-black text-teal-300 hover:text-white transition-colors">
                                {t('fdmGuide.compareLink')} <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link href="/guides/best-materials-for-3d-printed-housings-and-cases" className="inline-flex items-center gap-2 text-sm font-black text-amber-300 hover:text-white transition-colors">
                                {t('fdmGuide.housingLink')} <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link href="/guides/best-materials-for-heat-resistant-and-impact-resistant-parts" className="inline-flex items-center gap-2 text-sm font-black text-rose-300 hover:text-white transition-colors">
                                {t('fdmGuide.heatLink')} <ArrowRight className="w-4 h-4" />
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
                        {fdmMaterials.map((m, i) => (
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
                        <h2 className="text-2xl md:text-3xl font-black text-white mb-3">{t('resinGuide.title')}</h2>
                        <p className="text-white/60 break-keep leading-relaxed mb-5">
                            {t('resinGuide.desc')}
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/guides/standard-vs-tough-vs-clear-vs-flexible-resin" className="inline-flex items-center gap-2 text-sm font-black text-indigo-300 hover:text-white transition-colors">
                                {t('resinGuide.compareLink')} <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link href="/guides/best-materials-for-transparent-3d-printed-parts" className="inline-flex items-center gap-2 text-sm font-black text-cyan-300 hover:text-white transition-colors">
                                {t('resinGuide.clearLink')} <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link href="/guides/best-materials-for-miniatures-and-figurines" className="inline-flex items-center gap-2 text-sm font-black text-fuchsia-300 hover:text-white transition-colors">
                                {t('resinGuide.miniatureLink')} <ArrowRight className="w-4 h-4" />
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
                        {resinMaterials.map((m, i) => (
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
                            {t('cta.titleBefore')}
                            <br />
                            <span className="text-teal-400">{t('cta.titleAccent')}</span>
                            {t('cta.titleAfter')}
                        </h2>
                        <p className="text-lg font-bold text-white/40 max-w-xl mx-auto break-keep">
                            {t('cta.subtitle')}
                        </p>
                        <div className="pt-4">
                            <Link href="/quote">
                                <Button size="lg" className="h-16 px-12 text-lg rounded-2xl bg-teal-400 text-slate-950 font-black hover:bg-teal-300 gap-3 shadow-[0_0_30px_rgba(45,212,191,0.3)] transition-all active:scale-95">
                                    {t('cta.button')} <ArrowRight className="w-6 h-6" />
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
