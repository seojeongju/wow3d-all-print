'use client';

import { motion } from 'framer-motion';
import {
    Package,
    Factory,
    Layers,
    Box,
    Paintbrush,
    Users,
    Droplets,
    Zap,
    Printer,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

export default function ServicesSection() {
    const t = useTranslations('Home.servicesSection');

    const services = [
        {
            icon: Package,
            title: t('cards.prototype.title'),
            description: t('cards.prototype.description'),
            items: t.raw('cards.prototype.items') as string[],
            className: 'md:col-span-2 bg-gradient-to-br from-primary/10 to-indigo-500/5 border-primary/20',
            iconColor: 'text-primary',
        },
        {
            icon: Factory,
            title: t('cards.production.title'),
            description: t('cards.production.description'),
            items: t.raw('cards.production.items') as string[],
            className: 'md:col-span-1 bg-white/5 border-white/10',
            iconColor: 'text-amber-400',
        },
        {
            icon: Layers,
            title: t('cards.methods.title'),
            description: t('cards.methods.description'),
            iconColor: 'text-blue-400',
            className: 'md:col-span-1 bg-white/5 border-white/10',
            methods: [
                { name: 'FDM', icon: Printer, desc: t('cards.methods.fdm') },
                { name: 'SLA', icon: Droplets, desc: t('cards.methods.sla') },
                { name: 'DLP', icon: Zap, desc: t('cards.methods.dlp') },
            ],
        },
        {
            icon: Box,
            title: t('cards.materials.title'),
            description: t('cards.materials.description'),
            items: t.raw('cards.materials.items') as string[],
            className: 'md:col-span-2 bg-gradient-to-br from-teal-500/10 to-teal-800/10 border-teal-500/20',
            iconColor: 'text-teal-400',
        },
        {
            icon: Paintbrush,
            title: t('cards.finishing.title'),
            description: t('cards.finishing.description'),
            items: t.raw('cards.finishing.items') as string[],
            className: 'md:col-span-1 bg-white/5 border-white/10',
            iconColor: 'text-pink-400',
        },
        {
            icon: Users,
            title: t('cards.targets.title'),
            description: t('cards.targets.description'),
            items: t.raw('cards.targets.items') as string[],
            className: 'md:col-span-1 bg-white/5 border-white/10',
            iconColor: 'text-violet-400',
        },
    ];

    return (
        <section id="services" className="py-24 relative overflow-hidden">
            {/* 연한 블랙 및 그라데이션 배경 (Hero와 동일) */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#1f2937] to-[#111827]" />
            {/* 틸/블루 은은한 포인트 오버레이 */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(20,184,166,0.08),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(79,70,229,0.08),transparent_50%)]" />

            {/* 그리드 배경 */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]" />
            
            {/* 배경 글로우 포인트들 */}
            <div className="absolute left-0 bottom-0 w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-[130px]" />
            <div className="absolute right-0 top-0 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[150px]" />

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 word-keep-all text-white">{t('title')}</h2>
                    <p className="text-white/85 text-lg max-w-2xl mx-auto break-keep font-medium">
                        {t('subtitle')}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {services.map((s, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08 }}
                            whileHover={{ y: -4 }}
                            className={`group relative p-8 rounded-3xl border overflow-hidden hover:shadow-xl transition-all duration-300 ${s.className}`}
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                <s.icon className="w-24 h-24" />
                            </div>
                            <div className="relative z-10">
                                <div
                                    className={`w-12 h-12 rounded-2xl bg-white/10 shadow-sm flex items-center justify-center mb-5 ${s.iconColor}`}
                                >
                                    <s.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 word-keep-all text-white">{s.title}</h3>
                                <p className="text-white/85 text-sm leading-relaxed mb-4 break-keep font-medium">
                                    {s.description}
                                </p>
                                {'methods' in s && s.methods ? (
                                    <div className="space-y-3">
                                        {(s.methods as { name: string; icon: React.ComponentType<{ className?: string }>; desc: string }[]).map(
                                            (m, j) => (
                                                <div key={j} className="flex items-start gap-2 text-sm">
                                                    <m.icon className="w-4 h-4 mt-0.5 shrink-0 text-white/55" />
                                                    <div>
                                                        <span className="font-semibold text-white">{m.name}</span>
                                                        <span className="text-white/75"> — {m.desc}</span>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <ul className="space-y-1.5 text-sm text-white/75 font-medium">
                                        {(s.items || []).map((item, j) => (
                                            <li key={j} className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-teal-500/60" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center mt-12"
                >
                    <Link href="/quote">
                        <Button size="lg" className="rounded-full h-12 px-8">
                            {t('cta')}
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
