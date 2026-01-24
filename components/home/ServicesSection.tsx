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
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const services = [
    {
        icon: Package,
        title: '시제품 & 프로토타입',
        description: '아이디어 검증부터 디자인 리뷰까지. 단일·소량 시제품으로 제품화 전 검증과 투자 논의를 앞당깁니다.',
        items: ['디자인 검증', '기능 시험', '투자·발표용 샘플'],
        className: 'md:col-span-2 bg-gradient-to-br from-primary/10 to-indigo-500/5 border-primary/20',
        iconColor: 'text-primary',
    },
    {
        icon: Factory,
        title: '소량·대량 생산',
        description: '1개부터 수백 개까지. FDM·SLA·DLP를 조합해 리드타임과 단가를 최적화한 소량 양산을 지원합니다.',
        items: ['소량 로트', '반복 주문', '재고형 생산'],
        className: 'md:col-span-1 bg-card border-border',
        iconColor: 'text-amber-500',
    },
    {
        icon: Layers,
        title: '출력 방식',
        description: 'FDM(강도·비용), SLA(표면·정밀), DLP(속도·세밀)를 목적에 맞게 선택할 수 있습니다.',
        iconColor: 'text-blue-500',
        className: 'md:col-span-1 bg-card border-border',
        methods: [
            { name: 'FDM', icon: Printer, desc: '필라멘트 적층, 기능 시험·튼튼한 부품' },
            { name: 'SLA', icon: Droplets, desc: '레진 광조형, 매끄러운 표면·디테일' },
            { name: 'DLP', icon: Zap, desc: '광경화, 빠른 제작·정밀도' },
        ],
    },
    {
        icon: Box,
        title: '다양한 소재',
        description: 'PLA, ABS, PETG, TPU, 나일론, Standard·Tough·Clear·Flexible 레진 등 30종 이상. 용도별 최적 소재를 제안합니다.',
        items: ['PLA·ABS·PETG·TPU', '나일론·PC', 'Standard·Tough·Clear·Flexible 레진'],
        className: 'md:col-span-2 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border-emerald-500/20',
        iconColor: 'text-emerald-500',
    },
    {
        icon: Paintbrush,
        title: '후가공 & 도장',
        description: '연마, 도색, 경화, 조립 등. 출력물을 그대로가 아닌 제품 수준으로 마감하는 옵션을 제공합니다.',
        items: ['연마·경화', '도장·도색', '조립·패키징'],
        className: 'md:col-span-1 bg-card border-border',
        iconColor: 'text-pink-500',
    },
    {
        icon: Users,
        title: '맞춤 타깃',
        description: '산업 R&D, 교육·졸업작품, 스타트업·개인 제작까지. 용도와 예산에 맞는 플랜을 제안합니다.',
        items: ['산업·R&D', '교육·졸업작품', '스타트업·개인'],
        className: 'md:col-span-1 bg-card border-border',
        iconColor: 'text-violet-500',
    },
];

export default function ServicesSection() {
    return (
        <section id="services" className="py-24 bg-background relative overflow-hidden">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 word-keep-all">서비스</h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto break-keep">
                        시제품·양산, 다양한 출력 방식과 소재, 후가공까지. 목적에 맞는 3D 프린팅 솔루션을 제공합니다.
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
                                    className={`w-12 h-12 rounded-2xl bg-background shadow-sm flex items-center justify-center mb-5 ${s.iconColor}`}
                                >
                                    <s.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 word-keep-all">{s.title}</h3>
                                <p className="text-muted-foreground/90 text-sm leading-relaxed mb-4 break-keep">
                                    {s.description}
                                </p>
                                {'methods' in s && s.methods ? (
                                    <div className="space-y-3">
                                        {(s.methods as { name: string; icon: React.ComponentType<{ className?: string }>; desc: string }[]).map(
                                            (m, j) => (
                                                <div key={j} className="flex items-start gap-2 text-sm">
                                                    <m.icon className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                                                    <div>
                                                        <span className="font-semibold text-foreground">{m.name}</span>
                                                        <span className="text-muted-foreground"> — {m.desc}</span>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                                        {(s.items || []).map((item, j) => (
                                            <li key={j} className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
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
                            견적 요청하기
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
